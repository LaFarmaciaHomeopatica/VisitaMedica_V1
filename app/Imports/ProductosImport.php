<?php

namespace App\Imports;

use App\Models\Productos;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithUpserts; // Para evitar el error 23000
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class ProductosImport implements ToModel, WithHeadingRow, WithUpserts, SkipsEmptyRows
{
    public function model(array $row)
    {
        // Validamos que el código no venga vacío
        if (!isset($row['codigo']) || empty($row['codigo'])) {
            return null;
        }

        return new Productos([
            'nombre'      => $row['nombre_del_producto'],
            'laboratorio' => $row['laboratorio'] ?? 'S/L',
            'codigo'      => $row['codigo'],
        ]);
    }

    /**
     * Esto le dice a Laravel: "Si el CÓDIGO ya existe, actualiza la fila en lugar de insertar"
     */
    public function uniqueBy()
    {
        return 'codigo';
    }
}