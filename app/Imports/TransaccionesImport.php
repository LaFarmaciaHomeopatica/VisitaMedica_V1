<?php

namespace App\Imports;

use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\Productos;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class TransaccionesImport implements ToCollection, WithHeadingRow
{
    protected $mesReferencia;

    public int   $importadas   = 0;
    public int   $actualizadas = 0;
    public int   $pendientes   = 0;
    public int   $invalidas    = 0;
    public array $codigosNoExisten = [];

    public function __construct($mesReferencia = null)
    {
        $this->mesReferencia = $mesReferencia;
    }

    public function collection(Collection $rows)
    {
        // Pre-cargar todos los códigos válidos para evitar N+1 queries
        $codigosValidos = Productos::pluck('codigo')->flip();

        foreach ($rows as $row) {
            $documento      = $row['documento_medico'] ?? null;
            $fechaRaw       = $row['fecha'] ?? null;
            $productoCodigo = trim($row['codigo_producto'] ?? '');

            if (!$documento || !$fechaRaw || !$productoCodigo) {
                $this->invalidas++;
                continue;
            }

            // Validar que el código de producto exista en la tabla productos
            if (!isset($codigosValidos[$productoCodigo])) {
                if (!in_array($productoCodigo, $this->codigosNoExisten)) {
                    $this->codigosNoExisten[] = $productoCodigo;
                }
                $this->invalidas++;
                continue;
            }

            $fecha = $this->transformDate($fechaRaw);

            if (!Medico::where('documento', $documento)->exists()) {
                MedicoTemporal::updateOrCreate(
                    ['documento' => $documento],
                    [
                        'nombre_referencia' => $row['nombre_medico'] ?? 'SIN NOMBRE',
                        'origen_datos'      => 'IMPORTACION_EXCEL',
                    ]
                );
                $this->pendientes++;
            }

            $llave = [
                'medico_documento' => $documento,
                'producto_codigo'  => $productoCodigo,
                'fecha'            => $fecha->format('Y-m-d'),
            ];

            $existe = Transaccion::where($llave)->exists();

            Transaccion::updateOrCreate($llave, [
                'unidades_compradas'  => $row['unidades_compradas'] ?? 0,
                'unidades_formuladas' => $row['unidades_formuladas'] ?? 0,
                'valor_comprado'      => $row['valor_comprado'] ?? 0,
                'valor_formulado'     => $row['valor_formulado'] ?? 0,
            ]);

            $existe ? $this->actualizadas++ : $this->importadas++;
        }
    }

    private function transformDate($value)
    {
        try {
            if (is_numeric($value)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value);
            }
            return Carbon::parse($value);
        } catch (\Exception $e) {
            return now();
        }
    }
}
