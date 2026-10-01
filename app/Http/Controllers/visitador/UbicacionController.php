<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use Illuminate\Http\Request;

class UbicacionController extends Controller
{
    /**
     * Recibe la posición del celular del visitador y actualiza
     * su última ubicación conocida (UPDATE sobre su fila, sin duplicar).
     */
    public function actualizar(Request $request)
    {
        $datos = $request->validate([
            'latitud'  => 'required|numeric|between:-90,90',
            'longitud' => 'required|numeric|between:-180,180',
        ]);

        // El visitador se identifica por el usuario que inició sesión,
        // nunca por un id enviado desde el navegador.
        $visitador = Visitador::where('usuario_id', $request->user()->id)->first();

        if (!$visitador || $visitador->estado !== 'Habilitado') {
            return response()->json(['success' => false], 403);
        }

        $visitador->update([
            'latitud'                  => $datos['latitud'],
            'longitud'                 => $datos['longitud'],
            'ubicacion_actualizada_en' => now(),
        ]);

        return response()->json([
            'success'        => true,
            'actualizado_en' => $visitador->ubicacion_actualizada_en->toIso8601String(),
        ]);
    }
}