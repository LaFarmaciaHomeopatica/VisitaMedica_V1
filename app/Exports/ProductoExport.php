<?php

namespace App\Exports;

use App\Models\Productos;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping; // Importante para el orden
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ProductoExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    protected $productos;

    public function __construct($productos = null)
    {
        $this->productos = $productos;
    }

    public function collection()
    {
        return $this->productos ?: Productos::select('codigo', 'nombre', 'laboratorio')->get();
    }

    // 1. Aquí defines los nombres EXACTOS de las columnas en el Excel
    public function headings(): array
    {
        return [
            'codigoo',
            'nombre',     //sonara raro pero por un error que tube, los nombres de los campos estan directos en la vista  en" handleExportExcel " osea si se quieren agrgar pues toca en la vista 
            'laboratoro',
        ];
    }

    // 2. Aquí aseguras que los datos del modelo entren en la columna correcta
    public function map($producto): array
    {
        return [
            $producto->codigo,
            $producto->nombre,
            $producto->laboratorio,
        ];
    }
}