<?php

namespace App\Http\Controllers\api_odoo;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Services\OdooService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OdooSyncController extends Controller
{
    /**
     * Vista de productos — solo renderiza, el estado de conexión
     * se obtiene de la misma forma que en OdooController::index()
     */
    public function indexProductos()
    {
        $url      = config('odoo.url');
        $db       = config('odoo.db');
        $username = config('odoo.username');
        $password = config('odoo.password');

        $conexionEstado = 'sin_probar';
        if (!empty($url) && !empty($db) && !empty($password)) {
            $uid = $this->obtenerUid($url, $db, $username, $password);
            $conexionEstado = $uid ? 'conectado' : 'error';
        }

        return Inertia::render('API_ODOO/Odooproductos', [
            'conexionEstado' => $conexionEstado,
        ]);
    }

    // =========================================================================
    //  HELPERS PRIVADOS — CONEXIÓN
    // =========================================================================

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

    public function buscarPorDocumento(Request $request)
    {
        $request->validate([
            'documento' => 'required|string|max:20',
        ]);

        $url      = config('odoo.url');
        $db       = config('odoo.db');
        $username = config('odoo.username');
        $password = config('odoo.password');

        $uid = $this->obtenerUid($url, $db, $username, $password);
        if (!$uid) {
            return back()->withErrors(['error' => 'No se pudo autenticar con Odoo.']);
        }

        $ids = $this->ejecutarKw($url, $db, $uid, $password,
            'res.partner',
            'search',
            [[['vat', '=', $request->documento]]],
            ['limit' => 5]
        );

        if (empty($ids)) {
            return back()->with('resultado', [
                'encontrado' => false,
                'mensaje'    => 'No se encontró ningún contacto con ese documento en Odoo.',
            ]);
        }

        $records = $this->ejecutarKw($url, $db, $uid, $password,
            'res.partner',
            'read',
            [$ids],
            ['fields' => ['name', 'vat', 'email', 'phone', 'mobile', 'category_id']]
        );

        if (is_array($records)) {
            $this->agregarEspecialidad($records, $url, $db, $uid, $password);
        }

        $transacciones = $this->obtenerTransaccionesOdoo($url, $db, $uid, $password, $ids);

        return back()->with('resultado', [
            'encontrado'    => true,
            'registros'     => $records,
            'transacciones' => $transacciones,
        ]);
    }

    /**
     * Resuelve los category_id (tags) de cada registro de res.partner a un
     * nombre de especialidad, filtrando por ESPECIALIDADES_CONOCIDAS ya que
     * los tags de esta instancia de Odoo también incluyen cosas que no son
     * especialidad (consentimiento de mercadeo, tipo de negocio, etc.).
     * Agrega la clave 'especialidad' (string|null) a cada registro.
     */
    private function agregarEspecialidad(array &$records, string $url, string $db, int $uid, string $password): void
    {
        $idsUnicos = [];
        foreach ($records as $r) {
            foreach ($r['category_id'] ?? [] as $catId) {
                $idsUnicos[$catId] = true;
            }
        }

        $nombresPorId = [];
        if (!empty($idsUnicos)) {
            $categorias = $this->ejecutarKw($url, $db, $uid, $password,
                'res.partner.category',
                'read',
                [array_keys($idsUnicos)],
                ['fields' => ['name']]
            );

            foreach ((array) $categorias as $cat) {
                $nombresPorId[$cat['id']] = $cat['name'];
            }
        }

        foreach ($records as &$r) {
            $nombres = [];
            foreach ($r['category_id'] ?? [] as $catId) {
                $nombre = $nombresPorId[$catId] ?? null;
                if ($nombre && in_array(mb_strtoupper($nombre), OdooService::ESPECIALIDADES_CONOCIDAS, true)) {
                    $nombres[] = $nombre;
                }
            }
            $r['especialidad'] = !empty($nombres) ? implode(', ', $nombres) : null;
            unset($r['category_id']);
        }
    }

    // =========================================================================
    //  PRODUCTOS — Líneas de venta y factura de un médico (solo lectura)
    // =========================================================================

    /**
     * Busca por documento y retorna los productos (líneas) de todas sus
     * ventas y facturas en Odoo: código, nombre, cantidad y precio.
     */
    public function buscarProductos(Request $request)
{
    $request->validate([
        'documento' => 'required|string|max:20',
    ]);

    $url      = config('odoo.url');
    $db       = config('odoo.db');
    $username = config('odoo.username');
    $password = config('odoo.password');

    $uid = $this->obtenerUid($url, $db, $username, $password);
    
    // Si falla la conexión, renderizamos la vista con el error en las props
    if (!$uid) {
        return Inertia::render('API_ODOO/Odooproductos', [
            'conexionEstado' => 'error',
            'resultadoProductos' => [
                'encontrado' => false,
                'mensaje'    => 'No se pudo autenticar con Odoo.',
            ]
        ]);
    }

    // 1. Buscar el partner por documento
    $ids = $this->ejecutarKw($url, $db, $uid, $password,
        'res.partner',
        'search',
        [[['vat', '=', $request->documento]]],
        ['limit' => 5]
    );

    if (empty($ids)) {
        return Inertia::render('API_ODOO/Odooproductos', [
            'conexionEstado' => 'conectado',
            'resultadoProductos' => [
                'encontrado' => false,
                'mensaje'    => 'No se encontró ningún contacto con ese documento en Odoo.',
            ]
        ]);
    }

    // 2. Datos básicos del médico
    $partner = $this->ejecutarKw($url, $db, $uid, $password,
        'res.partner',
        'read',
        [$ids],
        ['fields' => ['name', 'vat']]
    );

    // 3. Productos facturados/vendidos
    $productos = $this->obtenerProductosOdoo($url, $db, $uid, $password, $ids);

    // RETORNO DIRECTO DE PROPS (Reemplaza al back()->with)
    return Inertia::render('API_ODOO/Odooproductos', [
        'conexionEstado' => 'conectado',
        'resultadoProductos' => [
            'encontrado'    => true,
            'medico'        => $partner[0] ?? null,
            'productos'     => $productos,
        ]
    ]);
}

    /**
     * Trae las líneas de producto (sale.order.line y account.move.line)
     * asociadas a las órdenes/facturas de un partner. Solo lectura.
     */
  private function obtenerProductosOdoo(string $url, string $db, int $uid, string $password, array $partnerIds): array
    {
        $productos = [];

        // 1. Traer IDs de las órdenes de venta del partner
        $orderIds = $this->ejecutarKw($url, $db, $uid, $password,
            'sale.order',
            'search',
            [[['partner_id', 'in', $partnerIds]]]
        );

        Log::info('[OdooSync] DEBUG orderIds encontrados: ' . json_encode($orderIds));

        if (!empty($orderIds)) {
            try {
                $lineasVenta = $this->ejecutarKw($url, $db, $uid, $password,
                    'sale.order.line',
                    'search_read',
                    [[['order_id', 'in', $orderIds]]],
                    [
                        'fields' => ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal', 'order_id', 'display_type'],
                        'order'  => 'id desc',
                    ]
                );

                Log::info('[OdooSync] DEBUG lineasVenta count: ' . (is_array($lineasVenta) ? count($lineasVenta) : 'null'));

                if (is_array($lineasVenta)) {
                    foreach ($lineasVenta as $linea) {
                        // En Odoo 18, display_type puede ser 'line_section' o 'line_note' para secciones/notas — las saltamos
                        if (!empty($linea['display_type'])) continue;
                        if (empty($linea['product_id'])) continue;

                        $productId  = is_array($linea['product_id']) ? ($linea['product_id'][0] ?? null) : null;
                        $codigo     = is_array($linea['product_id']) ? $this->extraerCodigo($linea['product_id'][1] ?? '') : '—';
                        $nombreProd = is_array($linea['product_id']) ? $this->limpiarNombre($linea['product_id'][1] ?? $linea['name']) : $linea['name'];

                        $productos[] = [
                            'origen'      => 'Venta',
                            'referencia'  => is_array($linea['order_id'] ?? null) ? ($linea['order_id'][1] ?? '—') : '—',
                            'codigo'      => $codigo,
                            'producto_id' => $productId,
                            'nombre'      => $nombreProd,
                            'cantidad'    => is_numeric($linea['product_uom_qty'] ?? null) ? (float) $linea['product_uom_qty'] : 0,
                            'precio'      => is_numeric($linea['price_unit']      ?? null) ? (float) $linea['price_unit']      : 0,
                            'subtotal'    => is_numeric($linea['price_subtotal']  ?? null) ? (float) $linea['price_subtotal']  : 0,
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('[OdooSync] Error consultando sale.order.line: ' . $e->getMessage());
            }
        }

        // 2. Traer IDs de las facturas (out_invoice) del partner
        $moveIds = $this->ejecutarKw($url, $db, $uid, $password,
            'account.move',
            'search',
            [[
                ['partner_id', 'in', $partnerIds],
                ['move_type', '=', 'out_invoice'],
            ]]
        );

        Log::info('[OdooSync] DEBUG moveIds encontrados: ' . json_encode($moveIds));

        if (!empty($moveIds)) {
            try {
                // OPTIMIZACIÓN ODOO 18:
                // En Odoo 18 filtramos explícitamente por display_type = 'product' 
                // para capturar solo los productos reales y omitir apuntes contables automáticos.
                $lineasFactura = $this->ejecutarKw($url, $db, $uid, $password,
                    'account.move.line',
                    'search_read',
                    [[
                        ['move_id', 'in', $moveIds],
                        ['display_type', '=', 'product'] 
                    ]],
                    [
                        'fields' => ['product_id', 'name', 'quantity', 'price_unit', 'price_subtotal', 'move_id'],
                        'order'  => 'id desc',
                    ]
                );

                Log::info('[OdooSync] DEBUG lineasFactura count: ' . (is_array($lineasFactura) ? count($lineasFactura) : 'null'));

                if (is_array($lineasFactura)) {
                    foreach ($lineasFactura as $linea) {
                        if (empty($linea['product_id'])) continue;

                        $productId  = is_array($linea['product_id']) ? ($linea['product_id'][0] ?? null) : null;
                        $codigo     = is_array($linea['product_id']) ? $this->extraerCodigo($linea['product_id'][1] ?? '') : '—';
                        $nombreProd = is_array($linea['product_id']) ? $this->limpiarNombre($linea['product_id'][1] ?? $linea['name']) : $linea['name'];

                        $productos[] = [
                            'origen'      => 'Factura',
                            'referencia'  => is_array($linea['move_id'] ?? null) ? ($linea['move_id'][1] ?? '—') : '—',
                            'codigo'      => $codigo,
                            'producto_id' => $productId,
                            'nombre'      => $nombreProd,
                            'cantidad'    => is_numeric($linea['quantity']       ?? null) ? (float) $linea['quantity']       : 0,
                            'precio'      => is_numeric($linea['price_unit']     ?? null) ? (float) $linea['price_unit']     : 0,
                            'subtotal'    => is_numeric($linea['price_subtotal'] ?? null) ? (float) $linea['price_subtotal'] : 0,
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('[OdooSync] Error consultando account.move.line v18: ' . $e->getMessage());
            }
        }

        return $productos;
    }

    /**
     * Odoo suele devolver el nombre del producto con el código entre corchetes:
     * "[COD123] Nombre del producto" — extraemos el código.
     */
    private function extraerCodigo(string $nombreCompleto): string
    {
        if (preg_match('/^\[(.+?)\]/', $nombreCompleto, $m)) {
            return $m[1];
        }
        return '—';
    }

    /**
     * Quita el prefijo "[CODIGO]" del nombre para dejar solo el nombre limpio.
     */
    private function limpiarNombre(string $nombreCompleto): string
    {
        return trim(preg_replace('/^\[.+?\]\s*/', '', $nombreCompleto));
    }

    /**
     * Busca las transacciones (sale.order y account.move) de un partner en Odoo de solo lectura.
     * Incluye total, base imponible (sin impuestos) e impuestos por separado.
     */
    private function obtenerTransaccionesOdoo(string $url, string $db, int $uid, string $password, array $partnerIds): array
    {
        $transacciones = [];

        // 1. sale.order (Pedidos de venta)
        try {
            $sales = $this->ejecutarKw($url, $db, $uid, $password,
                'sale.order',
                'search_read',
                [[['partner_id', 'in', $partnerIds]]],
                [
                    'fields' => ['id', 'name', 'date_order', 'amount_total', 'amount_untaxed', 'amount_tax', 'state'],
                    'order'  => 'date_order desc',
                ]
            );

            if (is_array($sales)) {
                foreach ($sales as $sale) {
                    $transacciones[] = [
                        'origen'         => 'Odoo (Venta)',
                        'id'             => $sale['id'],
                        'referencia'     => $sale['name'],
                        'fecha'          => $sale['date_order'] ?? null,
                        'total'          => is_numeric($sale['amount_total']   ?? null) ? (float) $sale['amount_total']   : 0,
                        'base_imponible' => is_numeric($sale['amount_untaxed'] ?? null) ? (float) $sale['amount_untaxed'] : 0,
                        'impuestos'      => is_numeric($sale['amount_tax']     ?? null) ? (float) $sale['amount_tax']     : 0,
                        'estado'         => $sale['state'] ?? 'Desconocido',
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning('[OdooSync] Error consultando sale.order: ' . $e->getMessage());
        }

        // 2. account.move (Facturas de cliente)
        try {
            $moves = $this->ejecutarKw($url, $db, $uid, $password,
                'account.move',
                'search_read',
                [[
                    ['partner_id', 'in', $partnerIds],
                    ['move_type', '=', 'out_invoice']
                ]],
                [
                    'fields' => ['id', 'name', 'invoice_date', 'amount_total', 'amount_untaxed', 'amount_tax', 'state'],
                    'order'  => 'invoice_date desc',
                ]
            );

            if (is_array($moves)) {
                Log::info('[OdooSync] DEBUG account.move raw: ' . json_encode($moves[0] ?? null));
                foreach ($moves as $move) {
                    $transacciones[] = [
                        'origen'         => 'Odoo (Factura)',
                        'id'             => $move['id'],
                        'referencia'     => $move['name'],
                        'fecha'          => $move['invoice_date'] ?? null,
                        'total'          => is_numeric($move['amount_total']   ?? null) ? (float) $move['amount_total']   : 0,
                        'base_imponible' => is_numeric($move['amount_untaxed'] ?? null) ? (float) $move['amount_untaxed'] : 0,
                        'impuestos'      => is_numeric($move['amount_tax']     ?? null) ? (float) $move['amount_tax']     : 0,
                        'estado'         => $move['state'] ?? 'Desconocido',
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning('[OdooSync] Error consultando account.move: ' . $e->getMessage());
        }

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

    private function valorToXml(mixed $valor): string
    {
        if (is_array($valor)) {
            if (array_keys($valor) !== range(0, count($valor) - 1)) {
                $members = '';
                foreach ($valor as $k => $v) {
                    $members .= "<member><name>{$k}</name><value>{$this->valorToXml($v)}</value></member>";
                }
                return "<struct>{$members}</struct>";
            }
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

    private function parseXmlResponse(string $body): mixed
    {
        try {
            $xml = simplexml_load_string($body);
            if (!$xml) return null;

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


    // =========================================================================
//  FORMULACIÓN — Órdenes de venta donde el médico es el prescriptor (doctor_id)
// =========================================================================

public function indexFormulacion()
{
    $url      = config('odoo.url');
    $db       = config('odoo.db');
    $username = config('odoo.username');
    $password = config('odoo.password');

    $conexionEstado = 'sin_probar';
    if (!empty($url) && !empty($db) && !empty($password)) {
        $uid = $this->obtenerUid($url, $db, $username, $password);
        $conexionEstado = $uid ? 'conectado' : 'error';
    }

    return Inertia::render('API_ODOO/Odooformulacion', [
        'conexionEstado' => $conexionEstado,
    ]);
}

public function buscarFormulacion(Request $request)
{
    $request->validate([
        'documento' => 'required|string|max:20',
    ]);

    $url      = config('odoo.url');
    $db       = config('odoo.db');
    $username = config('odoo.username');
    $password = config('odoo.password');

    $uid = $this->obtenerUid($url, $db, $username, $password);

    if (!$uid) {
        return Inertia::render('API_ODOO/Odooformulacion', [
            'conexionEstado' => 'error',
            'resultadoFormulacion' => [
                'encontrado' => false,
                'mensaje'    => 'No se pudo autenticar con Odoo.',
            ]
        ]);
    }

    // 1. Buscar al médico (prescriptor) por documento en res.partner
    $ids = $this->ejecutarKw($url, $db, $uid, $password,
        'res.partner',
        'search',
        [[['vat', '=', $request->documento]]],
        ['limit' => 5]
    );

    if (empty($ids)) {
        return Inertia::render('API_ODOO/Odooformulacion', [
            'conexionEstado' => 'conectado',
            'resultadoFormulacion' => [
                'encontrado' => false,
                'mensaje'    => 'No se encontró ningún médico con ese documento en Odoo.',
            ]
        ]);
    }

    $partner = $this->ejecutarKw($url, $db, $uid, $password,
        'res.partner',
        'read',
        [$ids],
        ['fields' => ['name', 'vat']]
    );

    $formulacion = $this->obtenerFormulacionOdoo($url, $db, $uid, $password, $ids);

    return Inertia::render('API_ODOO/Odooformulacion', [
        'conexionEstado' => 'conectado',
        'resultadoFormulacion' => [
            'encontrado'   => true,
            'medico'       => $partner[0] ?? null,
            'formulacion'  => $formulacion,
        ]
    ]);
}

/**
 * Trae las líneas de sale.order.line de todas las órdenes donde
 * doctor_id (el médico prescriptor) coincide, sin filtrar por quién
 * es el partner_id (paciente/cliente) de la orden. Solo lectura.
 */
private function obtenerFormulacionOdoo(string $url, string $db, int $uid, string $password, array $doctorIds): array
{
    $formulacion = [];

    $orderIds = $this->ejecutarKw($url, $db, $uid, $password,
        'sale.order',
        'search',
        [[['doctor_id', 'in', $doctorIds]]]
    );

    Log::info('[OdooSync] DEBUG orderIds (formulación) encontrados: ' . json_encode($orderIds));

    if (empty($orderIds)) {
        return $formulacion;
    }

    // Cabeceras: necesitamos partner_id (paciente), doctor_title_id, fecha y estado
    $ordenes = [];
    try {
        $ordenesRaw = $this->ejecutarKw($url, $db, $uid, $password,
            'sale.order',
            'read',
            [$orderIds],
            ['fields' => ['name', 'partner_id', 'doctor_id', 'doctor_title_id', 'date_order', 'state']]
        );
        if (is_array($ordenesRaw)) {
            foreach ($ordenesRaw as $orden) {
                $ordenes[$orden['id']] = $orden;
            }
        }
    } catch (\Exception $e) {
        Log::warning('[OdooSync] Error leyendo cabeceras sale.order (formulación): ' . $e->getMessage());
    }

    try {
        $lineas = $this->ejecutarKw($url, $db, $uid, $password,
            'sale.order.line',
            'search_read',
            [[['order_id', 'in', $orderIds]]],
            [
                'fields' => ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal','price_total', 'order_id', 'display_type'],
                'order'  => 'id desc',
            ]
        );

        Log::info('[OdooSync] DEBUG lineas formulación count: ' . (is_array($lineas) ? count($lineas) : 'null'));

        if (is_array($lineas)) {
            foreach ($lineas as $linea) {
                if (!empty($linea['display_type'])) continue;
                if (empty($linea['product_id'])) continue;

                $ordenId = is_array($linea['order_id'] ?? null) ? ($linea['order_id'][0] ?? null) : null;
                $orden   = $ordenId ? ($ordenes[$ordenId] ?? null) : null;

                $productId  = is_array($linea['product_id']) ? ($linea['product_id'][0] ?? null) : null;
                $codigo     = is_array($linea['product_id']) ? $this->extraerCodigo($linea['product_id'][1] ?? '') : '—';
                $nombreProd = is_array($linea['product_id']) ? $this->limpiarNombre($linea['product_id'][1] ?? $linea['name']) : $linea['name'];

                $paciente = '—';
                if ($orden && is_array($orden['partner_id'] ?? null)) {
                    $paciente = $orden['partner_id'][1] ?? '—';
                }

                $tituloDoctor = '';
                if ($orden && is_array($orden['doctor_title_id'] ?? null)) {
                    $tituloDoctor = $orden['doctor_title_id'][1] ?? '';
                }

                $formulacion[] = [
                    'referencia'  => is_array($linea['order_id'] ?? null) ? ($linea['order_id'][1] ?? '—') : '—',
                    'paciente'    => $paciente,
                    'doctor_titulo' => $tituloDoctor,
                    'codigo'      => $codigo,
                    'producto_id' => $productId,
                    'nombre'      => $nombreProd,
                    'cantidad'    => is_numeric($linea['product_uom_qty'] ?? null) ? (float) $linea['product_uom_qty'] : 0,
                    'precio'      => is_numeric($linea['price_unit']      ?? null) ? (float) $linea['price_unit']      : 0,
                    'subtotal'    => is_numeric($linea['price_subtotal']  ?? null) ? (float) $linea['price_subtotal']  : 0,

                    'total'         => is_numeric($linea['price_total']     ?? null) ? (float) $linea['price_total']     : 0,
                    'fecha'       => $orden['date_order'] ?? null,
                    'estado'      => $orden['state'] ?? 'Desconocido',
                ];
            }
        }
    } catch (\Exception $e) {
        Log::warning('[OdooSync] Error consultando sale.order.line (formulación): ' . $e->getMessage());
    }

    return $formulacion;
}
}