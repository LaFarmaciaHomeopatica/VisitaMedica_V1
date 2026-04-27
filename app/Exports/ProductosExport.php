<?php

namespace App\Exports;

use App\Models\Productos;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductosExport implements FromCollection, WithHeadings
{
    protected $productos;

    // El constructor recibe la colección de productos desde el controlador
    public function __construct($productos = null)
    {
        $this->productos = $productos;
    }

    public function collection()
    {
        // Si se pasaron productos específicos (individuales), los devuelve.
        // Si no, descarga todos los productos.
        return $this->productos ?: \App\Models\Productos::select('codigo', 'nombre', 'laboratorio')->get();
    }

    public function headings(): array
    {
        return [
            'codigo',      // Visualmente con tilde y mayúscula
            'nombre',
            'laboratorio',
        ];
    }
}