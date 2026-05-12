<?php

namespace App\Exports;

use App\Models\Transaccion;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class TransaccionesExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    public function query()
    {
        // Optimización: Solo traer las columnas necesarias de las relaciones
        return Transaccion::query()->with([
            'medico:documento,nombre,apellido', 
            'producto:codigo,nombre'
        ]);
    }

    public function headings(): array
    {
        return [
            'Documento Médico',
            'Nombre Médico',
            'Código Producto',
            'Producto',
            'Unidades Compradas',
            'Unidades Formuladas',
            'Valor Comprado',
            'Valor Formulado',
            'Fecha',
        ];
    }

    public function map($transaccion): array
    {
        return [
            $transaccion->medico_documento,
            $transaccion->medico 
                ? ($transaccion->medico->nombre . ' ' . $transaccion->medico->apellido) 
                : 'N/A',
            $transaccion->producto_codigo,
            $transaccion->producto ? $transaccion->producto->nombre : 'N/A',
            $transaccion->unidades_compradas,
            $transaccion->unidades_formuladas,
            $transaccion->valor_comprado,
            $transaccion->valor_formulado,
            $transaccion->fecha,
            // Verificamos que sea una instancia de Carbon antes de formatear
        ];
    }
}