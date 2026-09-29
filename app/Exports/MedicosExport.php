<?php

namespace App\Exports;

use App\Models\Medico;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class MedicosExport implements FromQuery, WithHeadings, WithMapping, WithChunkReading
{
    protected array $ids;
    protected ?string $mes;
    protected ?int $anio;
    protected ?string $fechaDesde;
    protected ?string $fechaHasta;

    /**
     * Recibimos los IDs seleccionados y los filtros de periodo/fecha desde el controlador.
     */
    public function __construct(
        array $ids = [],
        ?string $mes = null,
        ?int $anio = null,
        ?string $fechaDesde = null,
        ?string $fechaHasta = null
    ) {
        $this->ids = $ids;
        $this->mes = $mes;
        $this->anio = $anio ?? Carbon::now()->year;
        $this->fechaDesde = $fechaDesde;
        $this->fechaHasta = $fechaHasta;
    }

    /**
    * Retorna el query para que Laravel Excel escriba los registros en bloques (chunks).
    */
    public function query()
    {
        $fechaDesde = $this->fechaDesde;
        $fechaHasta = $this->fechaHasta;
        $mes        = $this->mes;
        $anio       = $this->anio;

        $query = Medico::query()
            ->with([
                'tipoDocumento',
                'visitador',
                'categoria',
                'visitas' => function ($q) use ($fechaDesde, $fechaHasta, $mes, $anio) {
                    if ($fechaDesde && $fechaHasta) {
                        $q->whereBetween(DB::raw("DATE(COALESCE(fecha_realizada, fecha_programada))"), [$fechaDesde, $fechaHasta]);
                    } elseif ($mes && $mes !== 'todos') {
                        $q->whereRaw("MONTH(COALESCE(fecha_realizada, fecha_programada)) = ?", [(int) $mes]);
                        if ($anio) {
                            $q->whereRaw("YEAR(COALESCE(fecha_realizada, fecha_programada)) = ?", [$anio]);
                        }
                    }
                }
            ])
            ->orderBy('id');

        if (!empty($this->ids)) {
            $query->whereIn('id', $this->ids);
        }

        return $query;
    }

    /**
    * Tamaño de cada bloque leído/escrito.
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
        // Agrupar visitas registradas por estado y contar (filtrando solo conteos > 0)
        $visitasGrouped = $medico->visitas
            ->groupBy('estado')
            ->map(fn($group) => $group->count())
            ->filter(fn($count) => $count > 0);

        // Formato solicitado: ejemplo "efectiva2-cancelada2"
        $resumenVisitasStr = $visitasGrouped->isNotEmpty()
            ? $visitasGrouped->map(fn($count, $estado) => strtolower($estado ?: 'sin estado') . $count)->join('-')
            : '0';

        return [
            $medico->tipoDocumento->nombre ?? 'N/A',
            $medico->documento,
            $medico->nombre,
            $medico->especialidad,
            $medico->categoria->nombre ?? 'Sin Categoría',
            $medico->telefono_contacto,
            $medico->direccion_detalles,
            $medico->horario_atencion,
            $medico->visitador 
                ? trim($medico->visitador->nombre) . ' ' . trim($medico->visitador->apellido) 
                : 'Sin asignar',
            $medico->fecha_inicio_relacion,
            $resumenVisitasStr,
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
            'Categoría',
            'Teléfono',
            'Detalles Dirección',
            'Horario Atención',
            'Visitador Asignado',
            'Fecha Inicio Relación',
            'Visitas',
        ];
    }
}