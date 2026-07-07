<?php

namespace App\Imports;

use App\Models\TipoDocumento;
use App\Models\Visitador;
use App\Models\Categoria;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Row;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Carbon\Carbon;

class MedicosImport implements OnEachRow, WithHeadingRow, WithChunkReading
{
    private $tiposDoc;
    private $visitadores;
    private $categorias;
    private $insertData = [];
    private $insertDataTemporal = [];
    private $batchSize  = 500;

    public function __construct()
    {
        $this->tiposDoc = TipoDocumento::all()
            ->flatMap(fn($t) => [
                strtoupper(trim($t->codigo ?? '')) => $t->id,
                strtolower(trim($t->nombre))       => $t->id,
            ])->toArray();

        $this->visitadores = Visitador::all()->mapWithKeys(function ($v) {
            $clave = strtolower(preg_replace('/\s+/', ' ', trim($v->nombre) . ' ' . trim($v->apellido)));
            return [$clave => $v->id];
        })->toArray();

        $this->categorias = Categoria::pluck('id', 'nombre')->toArray();
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function onRow(Row $row)
    {
        $row = $row->toArray();

        $documentoRaw = $row['documento'] ?? null;
        $nombreRaw    = trim($row['nombre'] ?? '');
        $apellidoRaw  = trim($row['apellido'] ?? '');

        $documentoLimpio = $documentoRaw !== null
            ? preg_replace('/[^0-9-]/', '', (string) $documentoRaw)
            : '';

        $tieneDocumento = !empty($documentoLimpio);
        $tieneNombre    = !empty($nombreRaw) || !empty($apellidoRaw);

        // ── CASO 1: fila totalmente vacía → se descarta ──
        if (!$tieneDocumento && !$tieneNombre) {
            \Log::warning('MÉDICO SALTADO - fila vacía (sin documento y sin nombre/apellido)');
            return;
        }

        // ── CASO 2: hay documento pero falta nombre/apellido → medico temporal ──
        if ($tieneDocumento && !$tieneNombre) {
            \Log::info('MÉDICO A MEDIAS - va a medicos_temporales (sin nombre)', [
                'documento' => $documentoLimpio,
            ]);

            $this->insertDataTemporal[] = [
                'documento'         => $documentoLimpio,
                'nombre_referencia' => null,
                'origen_datos'      => 'sin_nombre',
            ];

            if (count($this->insertDataTemporal) >= $this->batchSize) {
                $this->flushTemporal();
            }
            return;
        }

        // ── CASO 3: hay nombre/apellido pero falta documento → medico temporal (CORREGIDO DE RAÍZ) ──
        if (!$tieneDocumento && $tieneNombre) {
            $nombreReferencia = trim($nombreRaw . ' ' . $apellidoRaw);
            $origenPlaceholder = 'TEMP-' . Str::uuid();

            \Log::info('MÉDICO A MEDIAS - va a medicos_temporales (sin documento)', [
                'nombre_referencia' => $nombreReferencia,
            ]);

            $this->insertDataTemporal[] = [
                'documento'         => null,               // El documento queda vacío en la base de datos
                'nombre_referencia' => $nombreReferencia,
                'origen_datos'      => $origenPlaceholder, // El código TEMP se almacena aquí de forma limpia
            ];

            if (count($this->insertDataTemporal) >= $this->batchSize) {
                $this->flushTemporal();
            }
            return;
        }

        // ── CASO 4: documento y nombre completos → flujo normal (medicos) ──

        // 1. DIRECCIÓN Y TELÉFONO
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

        // 2. CATEGORÍA, TIPO DOC Y VISITADOR
        $categoriaNombre = trim($row['categoria'] ?? '');
        $categoriaId     = $this->categorias[$categoriaNombre] ?? null;

        $tipoDocRaw = trim($row['tipo_documento'] ?? '');
        $tipoDocId  = $this->tiposDoc[strtoupper($tipoDocRaw)]
                   ?? $this->tiposDoc[strtolower($tipoDocRaw)]
                   ?? 1;

        $visitadorNombreExcel = strtolower(preg_replace('/\s+/', ' ', trim($row['visitador_assigned'] ?? $row['visitador_asignado'] ?? '')));
        $visitadorId          = $this->visitadores[$visitadorNombreExcel] ?? null;

        // Fallback invertido
        if (!$visitadorId && $visitadorNombreExcel) {
            foreach ($this->visitadores as $nombreCompleto => $id) {
                $partes    = explode(' ', $nombreCompleto);
                $mitad     = (int) ceil(count($partes) / 2);
                $invertido = implode(' ', array_merge(
                    array_slice($partes, $mitad),
                    array_slice($partes, 0, $mitad)
                ));
                if ($invertido === $visitadorNombreExcel) {
                    $visitadorId = $id;
                    break;
                }
            }
        }

        // 3. NOMBRE COMPLETO
        $nombreCompleto = trim($nombreRaw . ' ' . $apellidoRaw);

        // 4. FECHA
        $fechaRaw   = $row['fecha_inicio_relacion'] ?? null;
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

        // 5. ACUMULAR
        $this->insertData[] = [
            'documento'             => $documentoLimpio,
            'tipo_documento_id'     => $tipoDocId,
            'nombre'                => $nombreCompleto,
            'especialidad'          => $row['especialidad'] ?? 'General',
            'categoria_id'          => $categoriaId,
            'geolocalizacion'       => $row['geolocalizacion'] ?? null,
            'direccion_detalles'    => $direccionFinal,
            'telefono_contacto'     => $telefonoFinal,
            'horario_atencion'      => $row['horario_atencion'] ?? null,
            'visitador_id'          => $visitadorId,
            'fecha_inicio_relacion' => $fechaFinal,
        ];

        // 6. FLUSH cada 500 filas
        if (count($this->insertData) >= $this->batchSize) {
            $this->flush();
        }
    }

    public function __destruct()
    {
        $this->flush();
        $this->flushTemporal();
    }

    private function flush(): void
    {
        if (empty($this->insertData)) return;

        DB::table('medicos')->upsert($this->insertData, ['documento'], [
            'nombre', 'especialidad', 'categoria_id',
            'tipo_documento_id', 'visitador_id', 'telefono_contacto',
            'geolocalizacion', 'direccion_detalles', 'horario_atencion',
            'fecha_inicio_relacion',
        ]);

        $this->insertData = [];
    }

    private function flushTemporal(): void
    {
        if (empty($this->insertDataTemporal)) return;

        DB::table('medicos_temporales')->insert($this->insertDataTemporal);

        $this->insertDataTemporal = [];
    }
}