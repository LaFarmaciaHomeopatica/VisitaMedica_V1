<?php

namespace App\Imports;

use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Carbon\Carbon;

class TransaccionesImport implements ToModel, WithHeadingRow
{
    protected $mesReferencia;

    public function __construct($mesReferencia = null)
    {
        $this->mesReferencia = $mesReferencia;
    }

    public function model(array $row)
{
    $documento = $row['documento_medico'] ?? null;
    $fechaRaw = $row['fecha'] ?? null;
    $productoCodigo = $row['codigo_producto'] ?? null;

    if (!$documento || !$fechaRaw || !$productoCodigo) {
        return null; 
    }

    $fechaExcel = $this->transformDate($fechaRaw);
    
    // 1. Verificar médico
    $medicoExiste = Medico::where('documento', $documento)->exists();

    if (!$medicoExiste) {
        MedicoTemporal::updateOrCreate(
            ['documento' => $documento],
            [
                'nombre_referencia' => $row['nombre_medico'] ?? 'SIN NOMBRE',
                'origen'            => 'IMPORTACION_EXCEL',
            ]
        );
        return null; 
    }

    // 2. EVITAR DUPLICADOS: 
    // Buscamos si ya existe una transacción para ese médico, producto y fecha exacta.
    // Si existe, actualiza los valores; si no, crea uno nuevo.
    return Transaccion::updateOrCreate(
        [
            'medico_documento' => $documento,
            'producto_codigo'  => $productoCodigo,
            'fecha'            => $fechaExcel->format('Y-m-d'),
        ],
        [
            'unidades_compradas'  => $row['unidades_compradas'] ?? 0,
            'unidades_formuladas' => $row['unidades_formuladas'] ?? 0,
            'valor_comprado'      => $row['valor_comprado'] ?? 0,
            'valor_formulado'     => $row['valor_formulado'] ?? 0,
        ]
    );
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