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
    
    if ($user) {
        // "Eager Load" de la relación rol para que no sea null
        $user->load('rol');
        $visitador = \App\Models\Visitador::where('usuario_id', $user->id)->first();
    }

    return [
        ...parent::share($request),
        'auth' => [
            'user' => $user ? [
                'id'         => $user->id,
                'username'   => $user->username,
                // Si el rol existe en la DB, saca el nombre. Si no, pon 'Usuario'
                'rol_nombre' => $user->rol->nombre ?? 'Usuario', 
                'nombre'     => $visitador->nombre ?? '',
                'apellido'   => $visitador->apellido ?? '',
            ] : null,
        ],
    ];
}
}
