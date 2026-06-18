<?php

namespace App\Http\Controllers\api_odoo;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OdooController extends Controller
{
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

    public function config()
    {
        return Inertia::render('API_ODOO/Odooconfig', [
            'config' => [
                'url_saved'      => !empty(env('ODOO_URL', '')),
                'db_saved'       => !empty(env('ODOO_DB', '')),
                'username_saved' => !empty(env('ODOO_USERNAME', '')),
                'password_saved' => !empty(env('ODOO_PASSWORD', '')),
            ],
        ]);
    }

    // =========================================================================
    //  GUARDAR CONFIGURACIÓN EN .ENV
    // =========================================================================

    public function configSave(Request $request)
    {
        $data = $request->validate([
            'url'             => 'nullable|url|max:255',
            'db'              => 'nullable|string|max:100',
            'username'        => 'nullable|string|max:100',
            'password'        => 'nullable|string|max:255',
            // Flags que envía el frontend cuando el usuario presiona "Borrar"
            'borrar_url'      => 'nullable|boolean',
            'borrar_db'       => 'nullable|boolean',
            'borrar_username' => 'nullable|boolean',
            'borrar_password' => 'nullable|boolean',
        ]);

        $nuevosValores = [];

        // Cada campo: solo se toca si el usuario escribió algo nuevo O pidió borrarlo
        if (!empty($data['url'])) {
            $nuevosValores['ODOO_URL'] = $data['url'];
        } elseif (!empty($data['borrar_url'])) {
            $nuevosValores['ODOO_URL'] = '';
        }

        if (!empty($data['db'])) {
            $nuevosValores['ODOO_DB'] = $data['db'];
        } elseif (!empty($data['borrar_db'])) {
            $nuevosValores['ODOO_DB'] = '';
        }

        if (!empty($data['username'])) {
            $nuevosValores['ODOO_USERNAME'] = '"' . $data['username'] . '"';
        } elseif (!empty($data['borrar_username'])) {
            $nuevosValores['ODOO_USERNAME'] = '';
        }

        if (!empty($data['password'])) {
            $nuevosValores['ODOO_PASSWORD'] = '"' . $data['password'] . '"';
        } elseif (!empty($data['borrar_password'])) {
            $nuevosValores['ODOO_PASSWORD'] = '';
        }

        // Si no hay nada que cambiar, redirige sin tocar el .env
        if (empty($nuevosValores)) {
            return redirect()->route('odoo.config')->with('success', 'Sin cambios que guardar.');
        }

        try {
            $this->escribirEnv($nuevosValores);
            return redirect()->route('odoo.config')->with('success', 'Configuración guardada correctamente.');
        } catch (\Exception $e) {
            Log::error('[Odoo] Error al escribir en .env: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'No se pudo guardar la configuración.']);
        }
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

    // =========================================================================
    //  LÓGICA PRIVADA — ESCRITURA EN .ENV
    // =========================================================================

    private function escribirEnv(array $data): void
    {
        $envPath = base_path('.env');

        if (!file_exists($envPath)) {
            throw new \Exception('El archivo .env no existe en: ' . $envPath);
        }

        $contenido = file_get_contents($envPath);

        foreach ($data as $clave => $valor) {
            $patron = "/^{$clave}=.*/m";
            if (preg_match($patron, $contenido)) {
                $contenido = preg_replace($patron, "{$clave}={$valor}", $contenido);
            } else {
                $contenido .= "\n{$clave}={$valor}";
            }
        }

        file_put_contents($envPath, $contenido);
    }
}