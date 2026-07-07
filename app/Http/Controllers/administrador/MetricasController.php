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
                DB::raw("COALESCE(medicos.nombre, transacciones.medico_documento) as nombre_medico"),
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

        // --- Análisis de visitadores ---
        $visitadoresAnalisis = DB::table('visitadores as v')
            ->leftJoin('medicos as m', 'm.visitador_id', '=', 'v.id')
            ->leftJoin('transacciones as t', function ($j) use ($fechaInicio, $fechaFin) {
                $j->on('t.medico_documento', '=', 'm.documento')
                  ->whereBetween('t.fecha', [$fechaInicio, $fechaFin]);
            })
            ->leftJoin('visitas as vis', function ($j) use ($fechaInicio, $fechaFin) {
                $j->on('vis.visitador_id', '=', 'v.id')
                  ->whereBetween('vis.fecha_programada', [$fechaInicio, $fechaFin]);
            })
            ->select(
                'v.id',
                DB::raw("CONCAT(v.nombre, ' ', v.apellido) as nombre"),
                DB::raw('COALESCE(SUM(t.valor_comprado),  0) as valor_comprado'),
                DB::raw('COALESCE(SUM(t.valor_formulado), 0) as valor_formulado'),
                DB::raw('COUNT(DISTINCT t.medico_documento)  as medicos_activos'),
                DB::raw('COUNT(DISTINCT vis.id)              as total_visitas'),
                DB::raw("COUNT(DISTINCT CASE WHEN vis.estado = 'efectiva' THEN vis.id END) as visitas_efectivas")
            )
            ->groupBy('v.id', 'v.nombre', 'v.apellido')
            ->orderByDesc('valor_comprado')
            ->get()
            ->map(fn($v) => [
                'id'               => $v->id,
                'nombre'           => $v->nombre,
                'valor_comprado'   => (float) $v->valor_comprado,
                'valor_formulado'  => (float) $v->valor_formulado,
                'medicos_activos'  => (int)   $v->medicos_activos,
                'total_visitas'    => (int)   $v->total_visitas,
                'visitas_efectivas'=> (int)   $v->visitas_efectivas,
                'efectividad'      => $v->total_visitas > 0
                    ? round(($v->visitas_efectivas / $v->total_visitas) * 100, 1) : 0,
            ]);

        // --- Lista de médicos para el filtro ---
        $medicosLista = Medico::select('documento', 'nombre')
            ->get()->map(fn($m) => [
                'documento' => $m->documento ?? '',
                'nombre'    => trim($m->nombre ?? ''),
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
            'topMedicos'          => $topMedicos,
            'tabla'               => $tabla,
            'medicos'             => $medicosLista,
            'visitadoresAnalisis' => $visitadoresAnalisis,
        ]);
    }
}
