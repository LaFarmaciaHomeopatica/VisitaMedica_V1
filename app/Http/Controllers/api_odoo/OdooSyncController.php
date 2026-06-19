<?php

namespace App\Http\Controllers\api_odoo;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OdooSyncController extends Controller
{
    // =========================================================================
    //  HELPERS PRIVADOS — CONEXIÓN
    // =========================================================================

    /**
     * Obtiene el UID autenticándose contra Odoo.
     * Retorna el UID (int) o null si falla.
     */
    private function obtenerUid(string $url, string $db, string $username, string $password): ?int
    {
        try {
            $xml = $this->xmlCall('authenticate', [
                ['string', $db],
                ['string', $username],
                ['string', $password],
                ['struct', []],
            ]);

            $response = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'text/xml'])
                ->send('POST', rtrim($url, '/') . '/xmlrpc/2/common', ['body' => $xml]);

            if ($response->successful() && preg_match('/<int>(\d+)<\/int>/', $response->body(), $m)) {
                return (int) $m[1];
            }

            return null;

        } catch (\Exception $e) {
            Log::error('[OdooSync] Error obteniendo UID: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Ejecuta execute_kw en el endpoint /xmlrpc/2/object
     * Equivale a: $models->execute_kw($db, $uid, $password, $modelo, $metodo, $args, $kwargs)
     */
    private function ejecutarKw(
        string $url,
        string $db,
        int    $uid,
        string $password,
        string $modelo,
        string $metodo,
        array  $args   = [],
        array  $kwargs = []
    ): ?array {
        try {
            // Construimos el XML manualmente equivalente al execute_kw de ripcord
            $argsXml   = $this->valorToXml($args);
            $kwargsXml = $this->valorToXml($kwargs);

            $xml = <<<XML
            <?xml version="1.0"?>
            <methodCall>
                <methodName>execute_kw</methodName>
                <params>
                    <param><value><string>{$db}</string></value></param>
                    <param><value><int>{$uid}</int></value></param>
                    <param><value><string>{$password}</string></value></param>
                    <param><value><string>{$modelo}</string></value></param>
                    <param><value><string>{$metodo}</string></value></param>
                    <param><value>{$argsXml}</value></param>
                    <param><value>{$kwargsXml}</value></param>
                </params>
            </methodCall>
            XML;

            $response = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'text/xml'])
                ->send('POST', rtrim($url, '/') . '/xmlrpc/2/object', ['body' => $xml]);

            if (!$response->successful()) {
                Log::error('[OdooSync] execute_kw falló: ' . $response->body());
                return null;
            }

            return $this->parseXmlResponse($response->body());

        } catch (\Exception $e) {
            Log::error('[OdooSync] Excepción en ejecutarKw: ' . $e->getMessage());
            return null;
        }
    }

    // =========================================================================
    //  BÚSQUEDA POR DOCUMENTO
    // =========================================================================

    /**
     * Recibe un documento desde la vista, lo busca en Odoo y retorna
     * el nombre completo + datos básicos del contacto encontrado.
     *
     * Equivale a:
     *   $ids     = $models->execute_kw($db, $uid, $pw, 'res.partner', 'search', [[['vat','=',$doc]]]);
     *   $records = $models->execute_kw($db, $uid, $pw, 'res.partner', 'read',   [$ids], ['fields'=>[...]]);
     */
    public function buscarPorDocumento(Request $request)
    {
        $request->validate([
            'documento' => 'required|string|max:20',
        ]);

        $url      = config('odoo.url');
        $db       = config('odoo.db');
        $username = config('odoo.username');
        $password = config('odoo.password');

        // 1. Autenticarse y obtener UID
        $uid = $this->obtenerUid($url, $db, $username, $password);
        if (!$uid) {
            return back()->withErrors(['error' => 'No se pudo autenticar con Odoo.']);
        }

        // 2. Buscar IDs que coincidan con el documento (campo vat)
        // Equivale a: search([[['vat', '=', $documento]]])
        $ids = $this->ejecutarKw($url, $db, $uid, $password,
            'res.partner',
            'search',
            [[['vat', '=', $request->documento]]],  // dominio de búsqueda
            ['limit' => 5]                           // máximo 5 resultados
        );

        if (empty($ids)) {
            return back()->with('resultado', [
                'encontrado' => false,
                'mensaje'    => 'No se encontró ningún contacto con ese documento en Odoo.',
            ]);
        }

        // 3. Leer los campos de esos IDs
        // Equivale a: read([$ids], ['fields' => ['name', 'vat', 'email', 'phone']])
        $records = $this->ejecutarKw($url, $db, $uid, $password,
            'res.partner',
            'read',
            [$ids],
            ['fields' => ['name', 'vat', 'email', 'phone', 'mobile']]
        );

        // 4. Buscar transacciones asociadas (Pedidos y Facturas de Odoo)
        $transacciones = $this->obtenerTransaccionesOdoo($url, $db, $uid, $password, $ids);

        return back()->with('resultado', [
            'encontrado'    => true,
            'registros'     => $records,
            'transacciones' => $transacciones,
        ]);
    }

    /**
     * Busca las transacciones (sale.order y account.move) de un partner en Odoo de solo lectura.
     */
    private function obtenerTransaccionesOdoo(string $url, string $db, int $uid, string $password, array $partnerIds): array
    {
        $transacciones = [];

        // 1. Intentar con sale.order (Pedidos de venta)
        try {
            $sales = $this->ejecutarKw($url, $db, $uid, $password,
                'sale.order',
                'search_read',
                [[['partner_id', 'in', $partnerIds]]],
                [
                    'fields' => ['id', 'name', 'date_order', 'amount_total', 'state'],
                    'order'  => 'date_order desc',
                    
                ]
            );

            if (is_array($sales)) {
                foreach ($sales as $sale) {
                    $transacciones[] = [
                        'origen'     => 'Odoo (Venta)',
                        'id'         => $sale['id'],
                        'referencia' => $sale['name'],
                        'fecha'      => $sale['date_order'] ?? null,
                        'total'      => $sale['amount_total'] ?? 0,
                        'estado'     => $sale['state'] ?? 'Desconocido',
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning('[OdooSync] Error consultando sale.order: ' . $e->getMessage());
        }

        // 2. Intentar con account.move (Facturas de cliente)
        try {
            $moves = $this->ejecutarKw($url, $db, $uid, $password,
                'account.move',
                'search_read',
                [[
                    ['partner_id', 'in', $partnerIds],
                    ['move_type', '=', 'out_invoice']
                ]],
                [
                    'fields' => ['id', 'name', 'invoice_date', 'amount_total', 'state'],
                    'order'  => 'invoice_date desc',
                    
                ]
            );

            if (is_array($moves)) {
                foreach ($moves as $move) {
                    $transacciones[] = [
                        'origen'     => 'Odoo (Factura)',
                        'id'         => $move['id'],
                        'referencia' => $move['name'],
                        'fecha'      => $move['invoice_date'] ?? null,
                        'total'      => $move['amount_total'] ?? 0,
                        'estado'     => $move['state'] ?? 'Desconocido',
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning('[OdooSync] Error consultando account.move: ' . $e->getMessage());
        }

        // Ordenar por fecha descendentemente
        usort($transacciones, function ($a, $b) {
            $fA = $a['fecha'] ?? '';
            $fB = $b['fecha'] ?? '';
            return strcmp($fB, $fA);
        });

        return $transacciones;
    }

    // =========================================================================
    //  HELPERS XML-RPC
    // =========================================================================

    private function xmlCall(string $method, array $params = []): string
    {
        $paramsXml = '';
        foreach ($params as [$tipo, $valor]) {
            if ($tipo === 'string') {
                $paramsXml .= '<param><value><string>' . htmlspecialchars((string) $valor) . '</string></value></param>';
            } elseif ($tipo === 'struct') {
                $paramsXml .= '<param><value><struct></struct></value></param>';
            }
        }

        return <<<XML
        <?xml version="1.0"?>
        <methodCall>
            <methodName>{$method}</methodName>
            <params>{$paramsXml}</params>
        </methodCall>
        XML;
    }

    /**
     * Convierte un array PHP al formato XML-RPC correspondiente
     */
    private function valorToXml(mixed $valor): string
    {
        if (is_array($valor)) {
            // Array asociativo → struct
            if (array_keys($valor) !== range(0, count($valor) - 1)) {
                $members = '';
                foreach ($valor as $k => $v) {
                    $members .= "<member><name>{$k}</name><value>{$this->valorToXml($v)}</value></member>";
                }
                return "<struct>{$members}</struct>";
            }
            // Array indexado → array
            $items = '';
            foreach ($valor as $v) {
                $items .= "<value>{$this->valorToXml($v)}</value>";
            }
            return "<array><data>{$items}</data></array>";
        }

        if (is_int($valor))    return "<int>{$valor}</int>";
        if (is_bool($valor))   return "<boolean>" . ($valor ? '1' : '0') . "</boolean>";
        if (is_string($valor)) return "<string>" . htmlspecialchars($valor) . "</string>";

        return "<string></string>";
    }

    /**
     * Parsea la respuesta XML-RPC de Odoo a un array PHP
     */
    private function parseXmlResponse(string $body): mixed
    {
        try {
            $xml = simplexml_load_string($body);
            if (!$xml) return null;

            // Si hay fault (error de Odoo)
            if (isset($xml->fault)) {
                Log::error('[OdooSync] Fault de Odoo: ' . $body);
                return null;
            }

            if (isset($xml->params->param->value)) {
                return $this->parseValue($xml->params->param->value);
            }

            return null;

        } catch (\Exception $e) {
            Log::error('[OdooSync] Error parseando XML: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Parsea recursivamente un nodo de valor XML-RPC
     */
    private function parseValue(\SimpleXMLElement $valueNode): mixed
    {
        foreach ($valueNode->children() as $typeNode) {
            $typeName = $typeNode->getName();
            switch ($typeName) {
                case 'int':
                case 'i4':
                    return (int) $typeNode;
                case 'double':
                    return (float) $typeNode;
                case 'boolean':
                    return ((string) $typeNode === '1' || (string) $typeNode === 'true');
                case 'string':
                    return (string) $typeNode;
                case 'array':
                    $arr = [];
                    if (isset($typeNode->data)) {
                        foreach ($typeNode->data->value as $val) {
                            $arr[] = $this->parseValue($val);
                        }
                    }
                    return $arr;
                case 'struct':
                    $struct = [];
                    foreach ($typeNode->member as $member) {
                        $name = (string) $member->name;
                        $struct[$name] = $this->parseValue($member->value);
                    }
                    return $struct;
            }
        }
        return (string) $valueNode;
    }
}