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
        // 1. Verificación básica: Si no hay documento o nombre, saltar fila
        if (empty($row['documento']) || empty($row['nombre'])) {
            return null;
        }

        // 2. BUSCADOR DE TIPO DE DOCUMENTO
        $tipoDocNombre = trim($row['tipo_documento'] ?? '');
        $tipoDoc = TipoDocumento::where('nombre', 'LIKE', $tipoDocNombre)->first();
        $tipoDocId = $tipoDoc ? $tipoDoc->id : 2; 

        // 3. BUSCADOR DE VISITADOR POR NOMBRE
        $visitadorNombreExcel = trim($row['visitador_asignado'] ?? ''); 
        $visitadorId = null;

        if (!empty($visitadorNombreExcel)) {
            $visitador = Visitador::where(function($query) use ($visitadorNombreExcel) {
                $query->where('nombre', 'LIKE', "%{$visitadorNombreExcel}%")
                      ->orWhere('apellido', 'LIKE', "%{$visitadorNombreExcel}%")
                      ->orWhereRaw("CONCAT(nombre, ' ', apellido) LIKE ?", ["%{$visitadorNombreExcel}%"]);
            })->first();
            
            if ($visitador) {
                $visitadorId = $visitador->id;
            } else {
                \Log::warning("No se encontró el visitador: " . $visitadorNombreExcel);
            }
        }

        /**
         * EVITAR DUPLICADOS Y ACTUALIZAR
         * En lugar de 'return new Medico(...)', usamos updateOrCreate.
         * El primer array son los campos para BUSCAR (la clave única).
         * El segundo array son los campos para INSERTAR o ACTUALIZAR.
         */
        return Medico::updateOrCreate(
            // Criterio de búsqueda: Si el documento ya existe
            ['documento' => $row['documento']], 
            
            // Datos a insertar o actualizar
            [
                'tipo_documento_id'     => $tipoDocId,
                'nombre'                => $row['nombre'],
                'apellido'              => $row['apellido'],
                'especialidad'          => $row['especialidad'] ?? null,
                'geolocalizacion'       => $row['geolocalizacion'] ?? null, 
                'direccion_detalles'    => $row['direccion_detalles'] ?? null,
                'telefono_contacto'     => $row['telefono'] ?? null,
                'horario_atencion'      => $row['horario_de_atencion'] ?? null,
                'visitador_id'          => $visitadorId,
                'fecha_inicio_relacion' => !empty($row['fecha_inicio_relacion']) ? $row['fecha_inicio_relacion'] : null,
            ]
        );
    }
}