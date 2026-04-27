<?php

namespace App\Imports;

use App\Models\Productos;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class ProductosImport implements ToModel, WithHeadingRow, WithUpserts, SkipsEmptyRows
{
    public function model(array $row)
    {
        /* IMPORTANTE: 
           Si tu Excel tiene "Código", Laravel Excel lo lee como "codigo".
           Si tu Excel tiene "Nombre", lo lee como "nombre".
           Si tu Excel tiene "Laboratorio", lo lee como "laboratorio".
        */

        if (empty($row['codigo'])) {
            return null;
        }

        return new Productos([
            'codigo'      => $row['codigo'],      // Mapea desde "Código"
            'nombre'      => $row['nombre'],      // Mapea desde "Nombre"
            'laboratorio' => $row['laboratorio'] ?? 'S/L', // Mapea desde "Laboratorio"
        ]);
    }

    /**
     * Indica la columna de la base de datos que es única para el Upsert.
     */
    public function uniqueBy()
    {
        return 'codigo'; 
    }
}