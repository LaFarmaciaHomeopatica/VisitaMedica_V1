<?php

namespace App\Exports;

use App\Models\MedicoTemporal;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;


class MedicosTempExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize
{
    protected array $ids;

    public function __construct(array $ids = [])
    {
        $this->ids = $ids;
    }

    public function query()
    {
        $query = MedicoTemporal::query()->with([
            'transacciones:id,medico_documento,producto_codigo,unidades_compradas,unidades_formuladas,valor_comprado,valor_formulado,fecha',
        ]);

        if (!empty($this->ids)) {
            $query->whereIn('id', $this->ids);
        }

        return $query;
    }

    public function headings(): array
    {
        return [
            'Documento',
            'Nombre Referencia',
           
            
        ];
    }

    public function map($medico): array
    {
        $transacciones = $medico->transacciones;

        return [
            $medico->documento,
            $medico->nombre_referencia,
           

        ];
    }
}