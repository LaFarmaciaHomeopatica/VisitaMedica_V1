<?php

namespace App\Imports;

use App\Models\Medico;
use App\Models\TipoDocumento;
use App\Models\Visitador;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class MedicosImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        // 1. Verificación de seguridad usando los nombres que genera la librería (slugs)
        if (empty($row['documento']) || empty($row['nombre'])) {
            return null;
        }

        // 2. BUSCADOR DE TIPO DE DOCUMENTO
        // Convertimos 'Tipo Documento' -> 'tipo_documento'
        $tipoDocNombre = trim($row['tipo_documento'] ?? '');
        $tipoDoc = TipoDocumento::where('nombre', 'LIKE', $tipoDocNombre)->first();
        $tipoDocId = $tipoDoc ? $tipoDoc->id : 2; 

        // 3. BUSCADOR DE VISITADOR
        // Convertimos 'Visitador Asignado' -> 'visitador_asignado'
        // 3. BUSCADOR DE VISITADOR POR NOMBRE (Versión Mejorada)
        $visitadorNombreExcel = trim($row['visitador_asignado'] ?? ''); 
        $visitadorId = null;

        if (!empty($visitadorNombreExcel)) {
            // Buscamos ignorando mayúsculas/minúsculas y espacios extras
            $visitador = Visitador::where(function($query) use ($visitadorNombreExcel) {
        $query->where('nombre', 'LIKE', "%{$visitadorNombreExcel}%")
              ->orWhere('apellido', 'LIKE', "%{$visitadorNombreExcel}%")
              // Opcional: buscar por nombre completo concatenado
              ->orWhereRaw("CONCAT(nombre, ' ', apellido) LIKE ?", ["%{$visitadorNombreExcel}%"]);
    })->first();
    
    if ($visitador) {
        $visitadorId = $visitador->id;
    } else {
        // Log temporal para saber qué nombre falló (revisa storage/logs/laravel.log)
        \Log::warning("No se encontró el visitador: " . $visitadorNombreExcel);
    }
}

        return new Medico([
            'tipo_documento_id'     => $tipoDocId,
            'documento'             => $row['documento'],
            'nombre'                => $row['nombre'],
            'apellido'              => $row['apellido'],
            'especialidad'          => $row['especialidad'],
            // Así es como Laravel lee los encabezados con espacios y tildes:
            'geolocalizacion'       => $row['geolocalizacion'] ?? null, 
            'direccion_detalles'    => $row['direccion_detalles'] ?? null,
            'telefono_contacto'     => $row['telefono'] ?? null,
            'horario_atencion'      => $row['horario_de_atencion'] ?? null,
            'visitador_id'          => $visitadorId,
            'fecha_inicio_relacion' => !empty($row['fecha_inicio_relacion']) ? $row['fecha_inicio_relacion'] : null,
        ]);
    }
}