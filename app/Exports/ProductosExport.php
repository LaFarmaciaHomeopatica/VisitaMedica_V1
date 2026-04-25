<?php

namespace App\Exports;

use App\Models\Productos;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductosExport implements FromCollection, WithHeadings
{
    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        // Seleccionamos solo los campos necesarios para el reporte
        return Productos::select('nombre', 'laboratorio', 'codigo')->get();
    }

    /**
     * Definir los encabezados de las columnas
     */
   public function headings(): array
{
    return [
        'nombre_del_producto', // Sin espacios ni tildes para asegurar el mapeo
        'laboratorio',
        'codigo',
    ];
}
}