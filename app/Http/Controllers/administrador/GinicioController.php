<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class GinicioController extends Controller
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

        // --- KPIs del período ---
        $statsPeriodo = (clone $base)->select(
            DB::raw('COUNT(*)                               as total_transacciones'),
            DB::raw('COALESCE(SUM(valor_comprado),  0)     as valor_comprado'),
            DB::raw('COALESCE(SUM(valor_formulado), 0)     as valor_formulado'),
            DB::raw('COALESCE(SUM(unidades_compradas),  0) as unidades_compradas'),
            DB::raw('COALESCE(SUM(unidades_formuladas), 0) as unidades_formuladas'),
            DB::raw('COUNT(DISTINCT medico_documento)       as medicos_con_tx')
        )->first();

        // --- Tendencia del período seleccionado (filtrada por fecha y médico) ---
        $tendencia = Transaccion::select(
            DB::raw("DATE_FORMAT(fecha, '%Y-%m') as mes"),
            DB::raw('SUM(valor_comprado)      as valor_comprado'),
            DB::raw('SUM(valor_formulado)     as valor_formulado'),
            DB::raw('SUM(unidades_compradas)  as compradas'),
            DB::raw('SUM(unidades_formuladas) as formuladas'),
            DB::raw('COUNT(*)                 as transacciones')
        )
        ->whereBetween('fecha', [$fechaInicio, $fechaFin])
        ->when($medicoDoc, fn($q) => $q->where('medico_documento', $medicoDoc))
        ->groupBy('mes')->orderBy('mes')->get();

        // --- Top 5 productos del período ---
        $topProductos = (clone $base)
            ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->select(
                'productos.nombre',
                DB::raw('SUM(transacciones.valor_comprado)     as valor_comprado'),
                DB::raw('SUM(transacciones.valor_formulado)    as valor_formulado'),
                DB::raw('SUM(transacciones.unidades_compradas) as unidades')
            )
            ->groupBy('productos.nombre')
            ->orderByDesc('valor_comprado')
            ->take(5)->get();

        // --- Top 10 médicos del período ---
        $medicoNombres = Medico::all(['documento', 'nombre', 'apellido'])
            ->mapWithKeys(fn($m) => [$m->documento => trim(($m->nombre ?? '') . ' ' . ($m->apellido ?? ''))]);
        $tempNombres = MedicoTemporal::pluck('nombre_referencia', 'documento');

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
                'documento'      => $m->medico_documento,
                'nombre'         => $nombre,
                'compradas'      => (int)   $m->compradas,
                'formuladas'     => (int)   $m->formuladas,
                'valor_comprado' => (float) $m->valor_comprado,
                'efectividad'    => $m->compradas > 0
                    ? round(($m->formuladas / $m->compradas) * 100, 1) : 0,
            ];
        });

        // --- Resumen de visitadores (visitas del período) ---
        $visitadoresResumen = DB::table('visitadores')
            ->leftJoin('visitas', function ($j) use ($fechaInicio, $fechaFin) {
                $j->on('visitadores.id', '=', 'visitas.visitador_id')
                  ->whereBetween('visitas.fecha_programada', [$fechaInicio, $fechaFin]);
            })
            ->select(
                'visitadores.id',
                'visitadores.nombre',
                'visitadores.apellido',
                DB::raw('COUNT(visitas.id)                                               as total_visitas'),
                DB::raw("SUM(CASE WHEN visitas.estado = 'efectiva'   THEN 1 ELSE 0 END) as efectivas"),
                DB::raw("SUM(CASE WHEN visitas.estado = 'programada' THEN 1 ELSE 0 END) as programadas"),
                DB::raw("SUM(CASE WHEN visitas.estado = 'cancelada'  THEN 1 ELSE 0 END) as canceladas")
            )
            ->groupBy('visitadores.id', 'visitadores.nombre', 'visitadores.apellido')
            ->get();

        // --- Análisis de visitadores (transacciones + visitas) ---
        $visitadoresAnalisis = DB::table('visitadores as v')
            ->leftJoin('medicos as m', 'm.visitador_id', '=', 'v.id')
            ->leftJoin('transacciones as t', function ($j) use ($fechaInicio, $fechaFin, $medicoDoc) {
                $j->on('t.medico_documento', '=', 'm.documento')
                  ->whereBetween('t.fecha', [$fechaInicio, $fechaFin]);
                if ($medicoDoc) {
                    $j->where('t.medico_documento', '=', $medicoDoc);
                }
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
                'id'                => $v->id,
                'nombre'            => $v->nombre,
                'valor_comprado'    => (float) $v->valor_comprado,
                'valor_formulado'   => (float) $v->valor_formulado,
                'medicos_activos'   => (int)   $v->medicos_activos,
                'total_visitas'     => (int)   $v->total_visitas,
                'visitas_efectivas' => (int)   $v->visitas_efectivas,
                'efectividad'       => $v->total_visitas > 0
                    ? round(($v->visitas_efectivas / $v->total_visitas) * 100, 1) : 0,
            ]);

        // --- Visitas por estado del período ---
        $visitasPorEstado = DB::table('visitas')
            ->whereBetween('fecha_programada', [$fechaInicio, $fechaFin])
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->get();

        // --- Lista de médicos para el filtro ---
        $medicosLista = Medico::select('documento', 'nombre', 'apellido')
            ->get()->map(fn($m) => [
                'documento' => (string) ($m->documento ?? ''),
                'nombre'    => trim(($m->nombre ?? '') . ' ' . ($m->apellido ?? '')),
            ])->values();

        return Inertia::render('ADMINISTRADOR/Ginicio', [
            'filtros' => [
                'fecha_inicio'        => $fechaInicio,
                'fecha_fin'           => $fechaFin,
                'medico_seleccionado' => $medicoDoc,
            ],
            'stats' => [
                'visitadores'         => Visitador::count(),
                'medicos'             => Medico::count(),
                'medicos_temporales'  => MedicoTemporal::count(),
                'total_transacciones' => (int)   ($statsPeriodo->total_transacciones ?? 0),
                'valor_comprado'      => (float) ($statsPeriodo->valor_comprado      ?? 0),
                'valor_formulado'     => (float) ($statsPeriodo->valor_formulado     ?? 0),
                'unidades_compradas'  => (int)   ($statsPeriodo->unidades_compradas  ?? 0),
                'unidades_formuladas' => (int)   ($statsPeriodo->unidades_formuladas ?? 0),
                'medicos_con_tx'      => (int)   ($statsPeriodo->medicos_con_tx      ?? 0),
            ],
            'tendencia'           => $tendencia,
            'topProductos'        => $topProductos,
            'topMedicos'          => $topMedicos,
            'visitadoresResumen'  => $visitadoresResumen,
            'visitadoresAnalisis' => $visitadoresAnalisis,
            'visitasPorEstado'    => $visitasPorEstado,
            'medicos'             => $medicosLista,
        ]);
    }
}
