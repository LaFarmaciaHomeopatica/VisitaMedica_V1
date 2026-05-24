<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MetricasController extends Controller
{
    public function index(Request $request)
    {
        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->subMonths(11)->startOfMonth()->format('Y-m-d'));
        $fechaFin    = $request->input('fecha_fin',    Carbon::now()->endOfMonth()->format('Y-m-d'));
        $medicoDoc   = $request->input('medico_documento');

        $base = Transaccion::whereBetween('fecha', [$fechaInicio, $fechaFin]);
        if ($medicoDoc) {
            $base->where('medico_documento', $medicoDoc);
        }

        // --- KPIs globales ---
        $totales = (clone $base)->select(
            DB::raw('COALESCE(SUM(unidades_compradas), 0)  as total_compradas'),
            DB::raw('COALESCE(SUM(unidades_formuladas), 0) as total_formuladas'),
            DB::raw('COALESCE(SUM(valor_comprado), 0)      as total_valor_comprado'),
            DB::raw('COALESCE(SUM(valor_formulado), 0)     as total_valor_formulado'),
            DB::raw('COUNT(DISTINCT medico_documento)       as medicos_activos'),
            DB::raw('COUNT(*)                               as total_transacciones')
        )->first();

        // --- Tendencia mensual ---
        $tendencia = (clone $base)->select(
            DB::raw("DATE_FORMAT(fecha, '%Y-%m') as mes"),
            DB::raw('SUM(unidades_compradas)  as compradas'),
            DB::raw('SUM(unidades_formuladas) as formuladas'),
            DB::raw('SUM(valor_comprado)      as valor_comprado'),
            DB::raw('SUM(valor_formulado)     as valor_formulado')
        )->groupBy('mes')->orderBy('mes')->get();

        // --- Top productos (JOIN para obtener nombre) ---
        $topProductos = (clone $base)
            ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->select(
                'transacciones.producto_codigo',
                'productos.nombre',
                DB::raw('SUM(transacciones.unidades_compradas)  as compradas'),
                DB::raw('SUM(transacciones.unidades_formuladas) as formuladas'),
                DB::raw('SUM(transacciones.valor_comprado)      as valor_comprado'),
                DB::raw('SUM(transacciones.valor_formulado)     as valor_formulado')
            )
            ->groupBy('transacciones.producto_codigo', 'productos.nombre')
            ->orderByDesc('compradas')
            ->get();

        // --- Top médicos con nombre ---
        $medicoNombres = Medico::pluck('nombre', 'documento');
        $tempNombres   = MedicoTemporal::pluck('nombre_referencia', 'documento');

        $topMedicos = (clone $base)->select(
            'medico_documento',
            DB::raw('SUM(unidades_compradas)  as compradas'),
            DB::raw('SUM(unidades_formuladas) as formuladas'),
            DB::raw('SUM(valor_comprado)      as valor_comprado')
        )->groupBy('medico_documento')->orderByDesc('compradas')->take(10)->get()
        ->map(function ($m) use ($medicoNombres, $tempNombres) {
            $nombre = $medicoNombres[$m->medico_documento]
                ?? $tempNombres[$m->medico_documento]
                ?? $m->medico_documento;
            return [
                'documento'     => $m->medico_documento,
                'nombre'        => $nombre,
                'compradas'     => (int) $m->compradas,
                'formuladas'    => (int) $m->formuladas,
                'valor_comprado'=> (float) $m->valor_comprado,
                'efectividad'   => $m->compradas > 0
                    ? round(($m->formuladas / $m->compradas) * 100, 1) : 0,
            ];
        });

        // --- Tabla desglose ---
        $tabla = (clone $base)
            ->leftJoin('medicos', 'transacciones.medico_documento', '=', 'medicos.documento')
            ->leftJoin('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->select(
                'transacciones.medico_documento',
                DB::raw("COALESCE(CONCAT(medicos.nombre, ' ', medicos.apellido), transacciones.medico_documento) as nombre_medico"),
                'transacciones.producto_codigo',
                DB::raw('COALESCE(productos.nombre, transacciones.producto_codigo) as nombre_producto'),
                DB::raw('SUM(transacciones.unidades_compradas)  as compradas'),
                DB::raw('SUM(transacciones.unidades_formuladas) as formuladas'),
                DB::raw('SUM(transacciones.valor_comprado)      as valor_comprado'),
                DB::raw('SUM(transacciones.valor_formulado)     as valor_formulado'),
                DB::raw('MAX(transacciones.fecha)               as ultima_fecha')
            )
            ->groupBy(
                'transacciones.medico_documento',
                'nombre_medico',
                'transacciones.producto_codigo',
                'nombre_producto'
            )
            ->orderByDesc('compradas')
            ->get();

        // --- Lista de médicos para el filtro ---
        $medicosLista = Medico::select('documento', 'nombre', 'apellido')
            ->get()->map(fn($m) => [
                'documento' => $m->documento,
                'nombre'    => "{$m->nombre} {$m->apellido}",
                'tipo'      => 'registrado',
            ]);

        return Inertia::render('ADMINISTRADOR/METRICAS/Metricas', [
            'filtros' => [
                'fecha_inicio'       => $fechaInicio,
                'fecha_fin'          => $fechaFin,
                'medico_seleccionado'=> $medicoDoc,
            ],
            'stats' => [
                'compradas'          => (int)   ($totales->total_compradas   ?? 0),
                'formuladas'         => (int)   ($totales->total_formuladas  ?? 0),
                'valor_comprado'     => (float) ($totales->total_valor_comprado  ?? 0),
                'valor_formulado'    => (float) ($totales->total_valor_formulado ?? 0),
                'medicos_activos'    => (int)   ($totales->medicos_activos       ?? 0),
                'total_transacciones'=> (int)   ($totales->total_transacciones   ?? 0),
            ],
            'tendencia'    => $tendencia,
            'topProductos' => $topProductos,
            'topMedicos'   => $topMedicos,
            'tabla'        => $tabla,
            'medicos'      => $medicosLista,
        ]);
    }
}
