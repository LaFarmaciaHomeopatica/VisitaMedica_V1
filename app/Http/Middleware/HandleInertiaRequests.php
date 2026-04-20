<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Visitador; // Importamos el modelo para poder buscar los datos

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $visitador = null;

        // Si hay un usuario logueado, buscamos su información en la tabla visitadores
        if ($user) {
            $visitador = Visitador::where('usuario_id', $user->id)->first();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id'       => $user->id,
                    'username' => $user->username, // O 'name' según tu columna en users
                    'id_rol'   => $user->id_rol,
                    // Si encontramos al visitador traemos su nombre, si no, un string vacío
                    'nombre'   => $visitador ? $visitador->nombre : '',
                    'apellido' => $visitador ? $visitador->apellido : '',
                ] : null,
            ],
        ];
    }
}