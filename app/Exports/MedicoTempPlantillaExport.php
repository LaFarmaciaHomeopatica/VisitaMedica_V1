<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Cell\DataType;

class MedicoTempPlantillaExport implements FromCollection, WithHeadings, WithColumnFormatting
{
    public function collection()
    {
        return new Collection([
            [
                'documento'         => '',
                'nombre_referencia' => '',
               
                
            ],
        ]);
    }

    public function headings(): array
    {
        return ['Documento', 'Nombre Referencia', ];
    }

    public function columnFormats(): array
    {
        return [
            'A' => DataType::TYPE_STRING,
        ];
    }
}