<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\ListaPrecio;
use App\Models\Rol;
use App\Models\User;
use App\Services\OdooService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ListasPreciosController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    /**
     * Página única de "Configuración", con pestañas: Tarifas, Conexión Odoo,
     * Usuarios. Todos los datos son consultas locales livianas (nada de Odoo
     * salvo el propio estado de configuración), así que se cargan de una vez
     * y el cambio de pestaña es puramente del lado del cliente.
     */
    public function index()
    {
        $tarifas = ListaPrecio::orderBy('categoria')->orderBy('nombre')->get();

        return Inertia::render('ADMINISTRADOR/CONFIGURACION/Configuracion', [
            'tarifas'     => $tarifas,
            'categorias'  => $this->categoriasExistentes($tarifas),
            'odooConfig'  => [
                'url_saved'      => !empty(env('ODOO_URL', '')),
                'db_saved'       => !empty(env('ODOO_DB', '')),
                'username_saved' => !empty(env('ODOO_USERNAME', '')),
                'password_saved' => !empty(env('ODOO_PASSWORD', '')),
            ],
            'usuarios' => User::all(),
            'roles'    => Rol::all(),
        ]);
    }

    /**
     * Guarda las credenciales de conexión a Odoo en el .env.
     */
    public function odooConfigSave(Request $request)
    {
        $data = $request->validate([
            'url'             => 'nullable|url|max:255',
            'db'              => 'nullable|string|max:100',
            'username'        => 'nullable|string|max:100',
            'password'        => 'nullable|string|max:255',
            'borrar_url'      => 'nullable|boolean',
            'borrar_db'       => 'nullable|boolean',
            'borrar_username' => 'nullable|boolean',
            'borrar_password' => 'nullable|boolean',
        ]);

        $nuevosValores = [];

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

        if (empty($nuevosValores)) {
            return back()->with('message', 'Sin cambios que guardar.');
        }

        try {
            $this->escribirEnv($nuevosValores);
            return back()->with('message', 'Configuración de Odoo guardada correctamente.');
        } catch (\Exception $e) {
            Log::error('[Gtarifas] Error al escribir en .env: ' . $e->getMessage());
            return back()->withErrors(['error' => 'No se pudo guardar la configuración de Odoo.']);
        }
    }

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

    public function store(Request $request)
    {
        $data = $request->validate([
            'odoo_id'   => 'nullable|integer|unique:listas_precios,odoo_id',
            'nombre'    => 'required|string|max:255',
            'categoria' => 'required|string|max:100',
        ]);

        ListaPrecio::create($data);

        return back()->with('message', 'Tarifa agregada');
    }

    public function update(Request $request, ListaPrecio $listaPrecio)
    {
        $data = $request->validate([
            'nombre'    => 'required|string|max:255',
            'categoria' => 'required|string|max:100',
        ]);

        $listaPrecio->update($data);

        return back()->with('message', 'Tarifa actualizada');
    }

    public function destroy(ListaPrecio $listaPrecio)
    {
        $listaPrecio->delete();

        return back()->with('message', 'Tarifa eliminada');
    }

    /**
     * Trae las listas de precios actuales desde Odoo y agrega las que
     * todavía no existen en la tabla local (con categoría 'NA' para que
     * el admin las clasifique manualmente). No modifica ni borra las que
     * ya fueron clasificadas.
     */
    public function sincronizar()
    {
        $pricelists = $this->odoo->getPricelists();

        if (empty($pricelists)) {
            return back()->with('error', 'No se pudo conectar con Odoo o no hay listas de precios.');
        }

        $existentes = ListaPrecio::pluck('id', 'odoo_id');
        $nuevas = 0;

        foreach ($pricelists as $p) {
            if (isset($existentes[$p['odoo_id']])) {
                continue;
            }

            ListaPrecio::create([
                'odoo_id'   => $p['odoo_id'],
                'nombre'    => $p['nombre'],
                'categoria' => 'NA',
            ]);
            $nuevas++;
        }

        return back()->with('message', $nuevas > 0
            ? "Sincronizado: {$nuevas} tarifa(s) nueva(s) agregada(s) como NA."
            : 'Sincronizado: no hay tarifas nuevas en Odoo.');
    }

    private function categoriasExistentes($tarifas): array
    {
        return $tarifas->pluck('categoria')->unique()->sort()->values()->all();
    }
}
