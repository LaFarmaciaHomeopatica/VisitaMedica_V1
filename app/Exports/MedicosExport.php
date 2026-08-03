<?php

namespace App\Exports;

use App\Models\Medico;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class MedicosExport implements FromQuery, WithHeadings, WithMapping, WithChunkReading
{
    protected $ids;

    /**
     * Recibimos los IDs seleccionados desde el controlador.
     */
    public function __construct(array $ids = [])
    {
        $this->ids = $ids;
    }

    /**
    * Retorna el query (no la colección ya cargada) para que Laravel Excel
    * pueda traer y escribir los registros en bloques (chunks) en vez de
    * cargar los 5000+ médicos completos en memoria de una sola vez.
    */
    public function query()
    {
        // Añadimos 'categoria' al eager loading
        $query = Medico::query()
            ->with(['tipoDocumento', 'visitador', 'categoria'])
            ->orderBy('id'); // orden estable, requerido para que el chunking sea consistente

        if (!empty($this->ids)) {
            $query->whereIn('id', $this->ids);
        }

        return $query;
    }

    /**
    * Tamaño de cada bloque leído/escrito. 500 es un buen balance entre
    * memoria y cantidad de queries a la base de datos.
    */
    public function chunkSize(): int
    {
        return 500;
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
            $medico->especialidad,
            $medico->categoria->nombre ?? 'Sin Categoría', // <--- Agregado después de especialidad
            $medico->telefono_contacto,
            
            $medico->direccion_detalles,
            $medico->horario_atencion,
         $medico->visitador 
    ? trim($medico->visitador->nombre) . ' ' . trim($medico->visitador->apellido) 
    : 'Sin asignar',
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
            'Especialidad',
            'Categoría', // <--- Agregado después de Especialidad
            'Teléfono',
            'Detalles Dirección',
            'Horario Atención',
            'Visitador Asignado',
            'Fecha Inicio Relación',
        ];
    }
}