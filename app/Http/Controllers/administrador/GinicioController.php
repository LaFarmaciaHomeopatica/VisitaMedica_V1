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
        // 1. Fechas y filtros básicos
        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->subMonths(11)->startOfMonth()->format('Y-m-d'));
        $fechaFin    = $request->input('fecha_fin',    Carbon::now()->endOfMonth()->format('Y-m-d'));
        $medicoDoc   = $request->input('medico_documento');

        // Instancia base reusable para consultas del período
        $base = Transaccion::whereBetween('fecha', [$fechaInicio, $fechaFin]);
        if ($medicoDoc) {
            $base->where('medico_documento', $medicoDoc);
        }

        // --- KPIs del período ---
        $statsPeriodo = (clone $base)->select(
            DB::raw('COUNT(*)                               as total_transacciones'),
            DB::raw('COALESCE(SUM(valor_comprado),   0)     as valor_comprado'),
            DB::raw('COALESCE(SUM(valor_formulado),  0)     as valor_formulado'),
            DB::raw('COALESCE(SUM(unidades_compradas),  0) as unidades_compradas'),
            DB::raw('COALESCE(SUM(unidades_formuladas), 0) as unidades_formuladas'),
            DB::raw('COUNT(DISTINCT medico_documento)       as medicos_con_tx')
        )->first();

        // --- Tendencia del período seleccionado ---
        $tendencia = (clone $base)->select(
            DB::raw("DATE_FORMAT(fecha, '%Y-%m') as mes"),
            DB::raw('SUM(valor_comprado)      as valor_comprado'),
            DB::raw('SUM(valor_formulado)     as valor_formulado'),
            DB::raw('SUM(unidades_compradas)  as compradas'),
            DB::raw('SUM(unidades_formuladas) as formuladas'),
            DB::raw('COUNT(*)                 as transacciones')
        )->groupBy('mes')->orderBy('mes')->get();

        // --- Top 5 (10) productos del período ---
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
            ->take(10)->get();

        // --- Top 10 médicos del período (Optimizado con Joins directos) ---
        $topMedicos = (clone $base)
            ->leftJoin('medicos as m', 'transacciones.medico_documento', '=', 'm.documento')
            ->leftJoin('medicos_temporales as mt', 'transacciones.medico_documento', '=', 'mt.documento')
            ->select(
                'transacciones.medico_documento as documento',
                DB::raw("TRIM(COALESCE(CONCAT(m.nombre, ' ', m.apellido), mt.nombre_referencia, transacciones.medico_documento)) as nombre"),
                DB::raw('SUM(transacciones.unidades_compradas)  as compradas'),
                DB::raw('SUM(transacciones.unidades_formuladas) as formuladas'),
                DB::raw('SUM(transacciones.valor_comprado)      as valor_comprado')
            )
            ->groupBy('transacciones.medico_documento', 'm.nombre', 'm.apellido', 'mt.nombre_referencia')
            ->orderByDesc('compradas')
            ->take(10)->get()
            ->map(fn($m) => [
                'documento'      => $m->documento,
                'nombre'         => $m->nombre,
                'compradas'      => (int)   $m->compradas,
                'formuladas'     => (int)   $m->formuladas,
                'valor_comprado' => (float) $m->valor_comprado,
                'efectividad'    => $m->compradas > 0 ? round(($m->formuladas / $m->compradas) * 100, 1) : 0,
            ]);

        // --- Resumen de visitadores ---
        $visitadoresResumen = DB::table('visitadores')
            ->leftJoin('visitas', function ($j) use ($fechaInicio, $fechaFin) {
                $j->on('visitadores.id', '=', 'visitas.visitador_id')
                  ->whereBetween('visitas.fecha_programada', [$fechaInicio, $fechaFin]);
            })
            ->select(
                'visitadores.id',
                'visitadores.nombre',
                'visitadores.apellido',
                DB::raw('COUNT(visitas.id)                                                 as total_visitas'),
                DB::raw("SUM(CASE WHEN visitas.estado = 'efectiva'   THEN 1 ELSE 0 END) as efectivas"),
                DB::raw("SUM(CASE WHEN visitas.estado = 'programada' THEN 1 ELSE 0 END) as programadas"),
                DB::raw("SUM(CASE WHEN visitas.estado = 'cancelada'  THEN 1 ELSE 0 END) as canceladas")
            )
            ->groupBy('visitadores.id', 'visitadores.nombre', 'visitadores.apellido')
            ->get();

        // --- Análisis de visitadores (Separado para evitar producto cartesiano destructivo) ---
        $txVisitadores = DB::table('visitadores as v')
            ->join('medicos as m', 'm.visitador_id', '=', 'v.id')
            ->join('transacciones as t', 't.medico_documento', '=', 'm.documento')
            ->whereBetween('t.fecha', [$fechaInicio, $fechaFin])
            ->when($medicoDoc, fn($q) => $q->where('t.medico_documento', $medicoDoc))
            ->select(
                'v.id',
                DB::raw('SUM(t.valor_comprado) as valor_comprado'),
                DB::raw('SUM(t.valor_formulado) as valor_formulado'),
                DB::raw('COUNT(DISTINCT t.medico_documento) as medicos_activos')
            )
            ->groupBy('v.id')
            ->get()
            ->keyBy('id');

        $visitasVisitadores = DB::table('visitadores as v')
            ->join('visitas as vis', 'vis.visitador_id', '=', 'v.id')
            ->whereBetween('vis.fecha_programada', [$fechaInicio, $fechaFin])
            ->select(
                'v.id',
                DB::raw('COUNT(vis.id) as total_visitas'),
                DB::raw("COUNT(CASE WHEN vis.estado = 'efectiva' THEN vis.id END) as visitas_efectivas")
            )
            ->groupBy('v.id')
            ->get()
            ->keyBy('id');

        $visitadoresAnalisis = Visitador::all(['id', 'nombre', 'apellido'])->map(function($v) use ($txVisitadores, $visitasVisitadores) {
            $tx  = $txVisitadores->get($v->id);
            $vis = $visitasVisitadores->get($v->id);

            $totalVisitas = $vis?->total_visitas ?? 0;
            $visEfectivas = $vis?->visitas_efectivas ?? 0;

            return [
                'id'                => $v->id,
                'nombre'            => trim("$v->nombre $v->apellido"),
                'valor_comprado'    => (float) ($tx?->valor_comprado ?? 0),
                'valor_formulado'   => (float) ($tx?->valor_formulado ?? 0),
                'medicos_activos'   => (int)   ($tx?->medicos_activos ?? 0),
                'total_visitas'     => (int)   $totalVisitas,
                'visitas_efectivas' => (int)   $visEfectivas,
                'efectividad'       => $totalVisitas > 0 ? round(($visEfectivas / $totalVisitas) * 100, 1) : 0,
            ];
        })->sortByDesc('valor_comprado')->values();


        // --- Visitas por estado (Sincronización de Identificadores) ---
        $visitasPorEstadoQuery = DB::table('visitas')
            ->whereBetween('fecha_programada', [$fechaInicio, $fechaFin]);

        if ($medicoDoc) {
            // 1. Buscamos el ID numérico en la tabla de médicos principales
            $medicoIdReal = DB::table('medicos')
                ->whereRaw('TRIM(documento) = ?', [trim($medicoDoc)])
                ->value('id');

            // 2. Si no aparece, buscamos en la tabla de médicos temporales por si acaso
            if (!$medicoIdReal) {
                $medicoIdReal = DB::table('medicos_temporales')
                    ->whereRaw('TRIM(documento) = ?', [trim($medicoDoc)])
                    ->value('id');
            }

            // 3. Aplicamos el filtro usando el ID numérico directo
            if ($medicoIdReal) {
                $visitasPorEstadoQuery->where('medico_id', $medicoIdReal);
            } else {
                // Si el documento no existe en ninguna de las dos tablas maestras,
                // forzamos un resultado vacío seguro en vez de romper la consulta.
                $visitasPorEstadoQuery->where('medico_id', 0);
            }
        }

        $visitasPorEstado = $visitasPorEstadoQuery
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->get();


        // --- Lista de médicos para el filtro ---
        $medicosLista = (clone $base)
            ->join('medicos as m', 'transacciones.medico_documento', '=', 'm.documento')
            ->select('m.documento', DB::raw("TRIM(CONCAT(m.nombre, ' ', m.apellido)) as nombre"))
            ->distinct()
            ->orderBy('nombre')
            ->get();

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