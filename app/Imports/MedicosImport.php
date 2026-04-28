<?php

namespace App\Imports;

use App\Models\TipoDocumento;
use App\Models\Visitador;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

// Quitamos WithChunkReading para que 'collection' reciba TODO el excel de golpe
class MedicosImport implements ToCollection, WithHeadingRow
{
    private $tiposDoc;
    private $visitadores;

    public function __construct()
    {
        // Consultas iniciales para mapeo en memoria (Solo se hacen 2 consultas aquí)
        $this->tiposDoc = TipoDocumento::pluck('id', 'nombre')->toArray();
        $this->visitadores = Visitador::all()->mapWithKeys(function ($v) {
            return [strtolower(trim($v->nombre . ' ' . $v->apellido)) => $v->id];
        })->toArray();
    }

    public function collection(Collection $rows)
    {
        $insertData = [];

        foreach ($rows as $row) {
            $documentoLimpio = preg_replace('/[^0-9]/', '', (string)$row['documento']);
            
            if (empty($documentoLimpio) || empty($row['nombre'])) {
                continue;
            }

            $tipoDocNombre = trim($row['tipo_documento'] ?? '');
            $tipoDocId = $this->tiposDoc[$tipoDocNombre] ?? 2;

            $visitadorNombreExcel = strtolower(trim($row['visitador_asignado'] ?? ''));
            $visitadorId = $this->visitadores[$visitadorNombreExcel] ?? null;

        
            $insertData[] = [
                'documento'             => $documentoLimpio,
                'tipo_documento_id'     => $tipoDocId,
                'nombre'                => $row['nombre'],
                'apellido'              => $row['apellido'],
                'especialidad'          => $row['especialidad'] ?? 'General',
                'geolocalizacion'       => $row['geolocalizacion'] ?? null,
                'direccion_detalles'    => $row['detalles_direccion'] ?? null,
                'telefono_contacto'     => $row['telefono'] ?? null,
                'horario_atencion'      => $row['horario_atencion'] ?? null,
                'visitador_id'          => $visitadorId,
                'fecha_inicio_relacion' => !empty($row['fecha_inicio_relacion']) ? $row['fecha_inicio_relacion'] : null,
                
            ];
        }

        if (!empty($insertData)) {
            // ESTA ES LA "MEGA-CONSULTA":
            // Envía los 5,000 registros en un solo INSERT ... ON DUPLICATE KEY UPDATE
            DB::table('medicos')->upsert($insertData, ['documento'], [
                'nombre', 'apellido', 'especialidad', 'tipo_documento_id', 
                'visitador_id', 'telefono_contacto'
            ]);
        }
    }
}