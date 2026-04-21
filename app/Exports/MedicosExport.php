<?php

namespace App\Exports;

use App\Models\Medico;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class MedicosExport implements FromCollection, WithHeadings, WithMapping
{
    /**
    * Retorna la colección de médicos con sus relaciones.
    */
    public function collection()
    {
        return Medico::with(['tipoDocumento', 'visitador'])->get();
    }

    /**
    * Definimos qué datos van en cada columna.
    */
    public function map($medico): array
    {
        return [
            $medico->tipoDocumento->nombre ?? 'N/A',
            $medico->documento,
            $medico->nombre,
            $medico->apellido,
            $medico->especialidad,
            $medico->telefono_contacto,
            $medico->geolocalizacion,
            $medico->direccion_detalles,
            $medico->horario_atencion,
            $medico->visitador ? ($medico->visitador->nombre . ' ' . $medico->visitador->apellido) : 'Sin asignar',
            $medico->fecha_inicio_relacion,
        ];
    }

    /**
    * Títulos de las columnas en el Excel.
    */
    public function headings(): array
    {
        return [
            'Tipo Documento',
            'Documento',
            'Nombre',
            'Apellido',
            'Especialidad',
            'Teléfono',
            'Geolocalización',
            'Detalles Dirección',
            'Horario Atención',
            'Visitador Asignado',
            'Fecha Inicio Relación',
        ];
    }
}