<?php

namespace App\Exports;

use App\Models\Transaccion;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class TransaccionesExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $ids;

    // El constructor recibe los IDs seleccionados (opcional)
    public function __construct(array $ids = [])
    {
        $this->ids = $ids;
    }

    public function query()
    {
        $query = Transaccion::query()->with([
            'medico:documento,nombre', 
            'producto:codigo,nombre'
        ]);

        // Si hay IDs seleccionados, filtramos la consulta
        if (!empty($this->ids)) {
            $query->whereIn('id', $this->ids);
        }

        return $query;
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
                ? $transaccion->medico->nombre 
                : 'N/A',
            $transaccion->producto_codigo,
            $transaccion->producto ? $transaccion->producto->nombre : 'N/A',
            $transaccion->unidades_compradas,
            $transaccion->unidades_formuladas,
            $transaccion->valor_comprado,
            $transaccion->valor_formulado,
            $transaccion->fecha,
        ];
    }
}