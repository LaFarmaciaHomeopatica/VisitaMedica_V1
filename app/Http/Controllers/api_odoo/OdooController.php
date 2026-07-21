<?php

namespace App\Http\Controllers\api_odoo;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Services\OdooService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OdooController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    // =========================================================================
    //  VISTAS
    // =========================================================================

    public function index()
    {
        $url      = config('odoo.url');
        $db       = config('odoo.db');
        $username = config('odoo.username');
        $password = config('odoo.password');

        $conexionEstado = (empty($url) || empty($db) || empty($password))
            ? 'sin_probar'
            : $this->verificarConexion($url, $db, $username, $password);

        return Inertia::render('API_ODOO/Odoomedicos', [
            'conexionEstado' => $conexionEstado,
        ]);
    }

    /**
     * Sugerencias de autocompletado para el buscador de /odoo/medicos —
     * busca por nombre o documento contra TODOS los clientes de Odoo (estén
     * o no registrados localmente como médico), igual que hace la vista de
     * Cartera. Se marca 'registrado' para distinguir los que sí están en la
     * tabla local.
     */
    public function buscarSugerencias(Request $request)
    {
        $q = trim((string) $request->input('q', ''));
        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $clientes = $this->odoo->buscarClientesPorTexto($q, 8);
        if (empty($clientes)) {
            return response()->json([]);
        }

        $documentos = collect($clientes)->pluck('documento')->all();
        $registrados = Medico::whereIn('documento', $documentos)
            ->pluck('documento')
            ->map(fn($d) => trim((string) $d))
            ->flip();

        $resultado = collect($clientes)->map(fn($c) => [
            'documento'  => $c['documento'],
            'nombre'     => $c['nombre'],
            'registrado' => $registrados->has($c['documento']),
        ]);

        return response()->json($resultado->values());
    }

    // =========================================================================
    //  LÓGICA PRIVADA — VERIFICACIÓN DE CONEXIÓN
    // =========================================================================

    private function verificarConexion(string $url, string $db, string $username, string $password): string
    {
        try {
            $base = rtrim($url, '/') . '/xmlrpc/2/common';

            $respVersion = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'text/xml'])
                ->send('POST', $base, ['body' => $this->xmlCall('version')]);

            if (!$respVersion->successful() || str_contains($respVersion->body(), 'faultCode')) {
                Log::warning('[Odoo] El servidor no respondió al método version().');
                return 'error';
            }

            $respAuth = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'text/xml'])
                ->send('POST', $base, ['body' => $this->xmlCall('authenticate', [
                    ['string', $db],
                    ['string', $username],
                    ['string', $password],
                    ['struct', []],
                ])]);

            if ($respAuth->successful() && str_contains($respAuth->body(), '<int>')) {
                Log::info('[Odoo] Conexión verificada correctamente.');
                return 'conectado';
            }

            Log::warning('[Odoo] Autenticación fallida.');
            return 'error';

        } catch (\Exception $e) {
            Log::error('[Odoo] Excepción en verificarConexion: ' . $e->getMessage());
            return 'error';
        }
    }

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
}