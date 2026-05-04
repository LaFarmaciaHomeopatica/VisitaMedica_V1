<?php

namespace App\Imports;

use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class TransaccionesImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        $documento = $row['documento_medico'];

        // 1. Verificar si el médico existe en la tabla oficial
        $medicoExiste = Medico::where('documento', $documento)->exists();

        if (!$medicoExiste) {
            // 2. Si no existe, lo mandamos a Medicos Temporales
            // Usamos updateOrCreate para evitar duplicar el documento y capturar el nombre
            MedicoTemporal::updateOrCreate(
                ['documento' => $documento],
                [
                    // Captura el nombre del Excel para mostrarlo en tu bandeja de validación
                    'nombre_referencia' => $row['nombre_medico'] ?? 'SIN NOMBRE EN EXCEL',
                    'origen'            => 'IMPORTACION_EXCEL',
                ]
            );

            // Retornamos null para que NO se cree la transacción hasta que el médico sea oficial
            return null;
        }

        // 3. Evitar duplicar la transacción si ya existe (Mismo médico, producto, semana y unidades:)
        $transaccionDuplicada = Transaccion::where([
           
            ['semana',           '=', $row['semana']],
           
        ])->exists();

        if ($transaccionDuplicada) {
            return null;
        }

        // 4. Si el médico existe y no es duplicado, procedemos con la transacción normal
        return new Transaccion([
            'medico_documento'    => $documento,
            'producto_codigo'     => $row['codigo_producto'],
            'unidades_compradas'  => $row['unidades_compradas'] ?? 0,
            'unidades_formuladas' => $row['unidades_formuladas'] ?? 0,
            'valor_comprado'      => $row['valor_comprado'] ?? 0,
            'valor_formulado'     => $row['valor_formulado'] ?? 0,
            'semana'              => $row['semana'],
        ]);
    }
}