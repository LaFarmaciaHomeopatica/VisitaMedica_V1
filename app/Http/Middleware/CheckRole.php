<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CheckRole
{
    public function handle(Request $request, Closure $next, $role)
    {
        if (!Auth::check()) {
            return redirect('/');
        }

        $user = Auth::user();

        // Si el rol del usuario NO coincide con el de la ruta
        if ((string)$user->id_rol !== (string)$role) {
            
            // Determinamos a dónde debería ir según su rol real
            $destiny = ($user->id_rol == 1) ? route('PanelAdmin') : route('panel');

            // IMPORTANTE: Inertia::location obliga al navegador a hacer 
            // un refresco total de la ventana, eliminando el rastro del otro usuario.
            return Inertia::location($destiny);
        }

        return $next($request);
    }
}