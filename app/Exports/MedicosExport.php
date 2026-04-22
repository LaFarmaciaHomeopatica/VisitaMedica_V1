<?php

namespace App\Exports;

use App\Models\Medico;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class MedicosExport implements FromCollection, WithHeadings, WithMapping
{
    protected $ids;

    /**
     * Recibimos los IDs seleccionados desde el controlador.
     * Si el array está vacío, se asume que se exportarán todos.
     */
    public function __construct(array $ids = [])
    {
        $this->ids = $ids;
    }

    /**
    * Retorna la colección de médicos filtrada si hay IDs seleccionados.
    */
    public function collection()
    {
        $query = Medico::with(['tipoDocumento', 'visitador']);

        // Si hay IDs en el array, filtramos la consulta
        if (!empty($this->ids)) {
            $query->whereIn('id', $this->ids);
        }

        return $query->get();
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