<?php

namespace App\Providers\visitador;

use App\Models\Medico;
use Illuminate\Support\Facades\DB;

class MedicoService
{
    public function obtenerListadoParaVisita($search = null)
    {
        return Medico::query()
            ->when($search, function ($query, $search) {
                $query->where('nombre', 'like', "%{$search}%")
                      ->orWhere('apellido', 'like', "%{$search}%")
                      ->orWhere('especialidad', 'like', "%{$search}%");
            })
            ->select([
                'id',
                'nombre',
                'apellido',
                'especialidad',
                'direccion_detalles as direccion',
                DB::raw("UPPER(LEFT(nombre, 1)) as inicial")
            ])
            ->get();
    }

    public function obtenerEstadisticasVisitas()
    {
        // Ejemplo: Supongamos que quieres mostrar cuántos se han visitado hoy
        return [
            'visitados' => 5, // Lógica real: Medico::where('visitado', true)->count()
            'total' => Medico::count()
        ];
    }
}