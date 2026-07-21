<?php

namespace App\Imports;


use App\Models\MedicoTemporal;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithUpserts;

class MedicosTempImport implements ToModel, WithHeadingRow, WithUpserts
{
    /**
     * Mapea cada fila del Excel a un registro del modelo.
     *
     * @param array $row
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        /*
         * Laravel-Excel convierte automáticamente las cabeceras del paso anterior:
         * 'Documento' -> $row['documento']
         * 'Nombre Referencia' -> $row['nombre_referencia']
         * 'Origen Datos' -> $row['origen_datos']
         */
        return new MedicoTemporal([
            'documento'         => $row['documento'],
            'nombre_referencia' => $row['nombre_referencia'],
           
            
        ]);
    }

    /**
     * Indica qué columna o columnas sirven para identificar si el registro ya existe (Upsert).
     * En tu caso, el identificador único de negocio es el 'documento'.
     *
     * @return string|array
     */
    public function uniqueBy()
    {
        return 'documento';
    }
}