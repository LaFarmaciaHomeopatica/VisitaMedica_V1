<?php

namespace App\Imports;

use App\Models\TipoDocumento;
use App\Models\Visitador;
use App\Models\Categoria;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Carbon\Carbon;

class MedicosImport implements ToCollection, WithHeadingRow
{
    private $tiposDoc;
    private $visitadores;
    private $categorias;

    public function __construct()
    {
        // Indexado por código (CC, CE…) y por nombre completo como fallback
        $this->tiposDoc = TipoDocumento::all()
            ->flatMap(fn($t) => [
                strtoupper(trim($t->codigo ?? '')) => $t->id,
                strtolower(trim($t->nombre))       => $t->id,
            ])->toArray();
        
        $this->visitadores = Visitador::all()->mapWithKeys(function ($v) {
            return [strtolower(trim($v->nombre . ' ' . $v->apellido)) => $v->id];
        })->toArray();

        $this->categorias = Categoria::pluck('id', 'nombre')->toArray();
    }

    public function collection(Collection $rows)
    {
        $insertData = [];

        foreach ($rows as $row) {
            $documentoLimpio = preg_replace('/[^0-9]/', '', (string)$row['documento']);
            
            if (empty($documentoLimpio) || empty($row['nombre'])) {
                continue;
            }

            // 1. MAPEADOR FLEXIBLE DE DIRECCIÓN Y TELÉFONO
            $direccionFinal = $row['direccion_detalles'] 
                ?? $row['detalles_direccion'] 
                ?? $row['direccion'] 
                ?? $row['dir'] 
                ?? null;

            $telefonoFinal = $row['telefono_contacto'] 
                ?? $row['telefono'] 
                ?? $row['tel'] 
                ?? $row['celular'] 
                ?? null;

            // 2. LÓGICA DE CATEGORÍA, TIPO DOC Y VISITADOR
            $categoriaNombre = trim($row['categoria'] ?? '');
            $categoriaId = $this->categorias[$categoriaNombre] ?? null;

            $tipoDocRaw = trim($row['tipo_documento'] ?? '');
            $tipoDocId  = $this->tiposDoc[strtoupper($tipoDocRaw)]
                       ?? $this->tiposDoc[strtolower($tipoDocRaw)]
                       ?? 1;

            $visitadorNombreExcel = strtolower(trim($row['visitador_asignado'] ?? ''));
            $visitadorId = $this->visitadores[$visitadorNombreExcel] ?? null;

            // 3. LÓGICA DE FECHA (SOLUCIÓN AL 46122)
            $fechaRaw = $row['fecha_inicio_relacion'] ?? null;
            $fechaFinal = null;

            if (!empty($fechaRaw)) {
                try {
                    if (is_numeric($fechaRaw)) {
                        $fechaFinal = Date::excelToDateTimeObject($fechaRaw)->format('Y-m-d');
                    } else {
                        $fechaTexto = str_replace('/', '-', trim($fechaRaw));
                        $fechaFinal = Carbon::parse($fechaTexto)->format('Y-m-d');
                    }
                } catch (\Exception $e) {
                    $fechaFinal = null; 
                }
            }

            // 4. ARMADO DEL ARRAY (UNA SOLA VEZ)
            $insertData[] = [
                'documento'             => $documentoLimpio,
                'tipo_documento_id'     => $tipoDocId,
                'nombre'                => $row['nombre'],
                'apellido'              => $row['apellido'],
                'especialidad'          => $row['especialidad'] ?? 'General',
                'categoria_id'          => $categoriaId,
                'geolocalizacion'       => $row['geolocalizacion'] ?? null,
                'direccion_detalles'    => $direccionFinal, 
                'telefono_contacto'     => $telefonoFinal,
                'horario_atencion'      => $row['horario_atencion'] ?? null,
                'visitador_id'          => $visitadorId,
                'fecha_inicio_relacion' => $fechaFinal,
            ];
        }

        if (!empty($insertData)) {
            DB::table('medicos')->upsert($insertData, ['documento'], [
                'nombre', 
                'apellido', 
                'especialidad',
                'categoria_id',  
                'tipo_documento_id', 
                'visitador_id', 
                'telefono_contacto',
                'geolocalizacion',
                'direccion_detalles',
                'horario_atencion',
                'fecha_inicio_relacion'
            ]);
        }
    }
}