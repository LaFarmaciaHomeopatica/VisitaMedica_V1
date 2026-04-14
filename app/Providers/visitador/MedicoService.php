<?php

namespace App\Services;

use App\Models\Medico;
use Illuminate\Support\Facades\DB;

class MedicoService
{
    public function obtenerListadoParaVisita($search = null)
    {
        return Medico::query()
            ->when($search, function ($query, $search) {
                $query->where('nombre_completo', 'like', "%{$search}%")
                      ->orWhere('especialidad', 'like', "%{$search}%");
            })
            ->select([
                'id',
                'nombre_completo',
                'especialidad',
                'direccion_details as direccion',
                // Aquí podrías agregar lógica para calcular visitas o formulados si existen esas tablas
                DB::raw("UPPER(LEFT(nombre_completo, 1)) as inicial")
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