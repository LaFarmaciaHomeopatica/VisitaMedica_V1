<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\Visitador;
use App\Services\OdooService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class GinicioController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    // =========================================================================
    //  RENDER RÁPIDO — solo datos locales, sin tocar Odoo
    // =========================================================================
    public function index(Request $request)
    {
       $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $fechaFin    = $request->input('fecha_fin',    Carbon::now()->endOfMonth()->format('Y-m-d'));
        $medicoDoc   = $request->input('medico_documento');

        $medicosLista = Medico::select('documento', DB::raw("TRIM(nombre) as nombre"))
            ->whereNotNull('documento')
            ->orderBy('nombre')
            ->get();

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

        $visitasPorEstado = $this->visitasPorEstadoQuery($fechaInicio, $fechaFin, $medicoDoc)
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->get();

        return Inertia::render('ADMINISTRADOR/Ginicio', [
            'filtros' => [
                'fecha_inicio'        => $fechaInicio,
                'fecha_fin'           => $fechaFin,
                'medico_seleccionado' => $medicoDoc,
            ],
            'stats' => [
                'visitadores'        => Visitador::count(),
                'medicos'            => Medico::count(),
                'medicos_temporales' => MedicoTemporal::count(),
            ],
            'visitadoresResumen' => $visitadoresResumen,
            'visitasPorEstado'   => $visitasPorEstado,
            'medicos'            => $medicosLista,
        ]);
    }

    // =========================================================================
    //  RESUMEN ODOO — endpoint JSON async, solo lectura, en vivo (sin caché)
    // =========================================================================
    public function odooResumen(Request $request)
    {
        set_time_limit(120);

       $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
$fechaFin    = $request->input('fecha_fin',    Carbon::now()->endOfMonth()->format('Y-m-d'));
        $medicoDoc   = $request->input('medico_documento');

        $medicosLista = Medico::select('id', 'documento', 'nombre', 'visitador_id')
            ->whereNotNull('documento')
            ->get();

        $documentos = $medicoDoc
            ? [$medicoDoc]
            : $medicosLista->pluck('documento')->filter()->values()->all();

        $resumen      = $this->odoo->getResumenGlobal($documentos, $fechaInicio, $fechaFin);
        $porDocumento = $resumen['por_documento'] ?? [];

        $medicosConTx = collect($porDocumento)->filter(
            fn($d) => ($d['valor_comprado'] ?? 0) > 0 || ($d['valor_formulado'] ?? 0) > 0
        )->count();

        $stats = [
            'total_transacciones' => (int)   ($resumen['total_transacciones']       ?? 0),
            'valor_comprado'      => (float) ($resumen['total_valor_comprado']      ?? 0),
            'valor_formulado'     => (float) ($resumen['total_valor_formulado']     ?? 0),
            'unidades_compradas'  => (int)   ($resumen['total_unidades_compradas']  ?? 0),
            'unidades_formuladas' => (int)   ($resumen['total_unidades_formuladas'] ?? 0),
            'medicos_con_tx'      => $medicosConTx,
        ];

        $tendencia = collect($resumen['tendencia'] ?? [])->map(fn($m) => [
            'mes'             => $m['mes'],
            'valor_comprado'  => (float) $m['valor_comprado'],
            'valor_formulado' => (float) $m['valor_formulado'],
        ])->values();

        $topProductos = collect($resumen['top_productos'] ?? [])->map(fn($p) => [
            'nombre'          => $p['nombre'],
            'valor_comprado'  => (float) $p['valor_comprado'],
            'valor_formulado' => (float) $p['valor_formulado'],
            'unidades'        => (float) $p['unidades'],
        ])->values();

       $nombresPorDoc = collect();

foreach ($medicosLista as $m) {
    $nombresPorDoc[trim((string) $m->documento)] = $m->nombre;
}

foreach (MedicoTemporal::pluck('nombre_referencia', 'documento') as $doc => $nombreRef) {
    $key = trim((string) $doc);
    if (!isset($nombresPorDoc[$key])) {
        $nombresPorDoc[$key] = $nombreRef;
    }
}

        $topMedicos = collect($porDocumento)
            ->map(function ($d, $doc) use ($nombresPorDoc) {
                $compradas  = (float) ($d['unidades_compradas']  ?? 0);
                $formuladas = (float) ($d['unidades_formuladas'] ?? 0);
                return [
                    'documento'      => $doc,
                    'nombre'         => trim($nombresPorDoc[$doc] ?? $doc),
                    'compradas'      => (int) $compradas,
                    'formuladas'     => (int) $formuladas,
                    'valor_comprado' => (float) ($d['valor_comprado'] ?? 0),
                    'efectividad'    => $compradas > 0 ? round(($formuladas / $compradas) * 100, 1) : 0,
                ];
            })
            ->filter(fn($m) => $m['compradas'] > 0 || $m['formuladas'] > 0)
            ->sortByDesc('compradas')
            ->take(10)
            ->values();

        $medicosConVisitador = $medicosLista->whereNotNull('visitador_id')->groupBy('visitador_id');

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

        $visitadoresAnalisis = Visitador::all(['id', 'nombre', 'apellido'])->map(function ($v) use ($medicosConVisitador, $porDocumento, $visitasVisitadores) {
            $medicosDelVisitador = $medicosConVisitador->get($v->id, collect());

            $valorComprado  = 0.0;
            $valorFormulado = 0.0;
            $medicosActivos = 0;

            foreach ($medicosDelVisitador as $m) {
                $d = $porDocumento[$m->documento] ?? null;
                if (!$d) continue;
                $valorComprado  += $d['valor_comprado']  ?? 0;
                $valorFormulado += $d['valor_formulado'] ?? 0;
                if (($d['valor_comprado'] ?? 0) > 0 || ($d['valor_formulado'] ?? 0) > 0) {
                    $medicosActivos++;
                }
            }

            $vis = $visitasVisitadores->get($v->id);
            $totalVisitas = $vis?->total_visitas ?? 0;
            $visEfectivas = $vis?->visitas_efectivas ?? 0;

            return [
                'id'                => $v->id,
                'nombre'            => trim("$v->nombre $v->apellido"),
                'valor_comprado'    => (float) $valorComprado,
                'valor_formulado'   => (float) $valorFormulado,
                'medicos_activos'   => $medicosActivos,
                'total_visitas'     => (int) $totalVisitas,
                'visitas_efectivas' => (int) $visEfectivas,
                'efectividad'       => $totalVisitas > 0 ? round(($visEfectivas / $totalVisitas) * 100, 1) : 0,
            ];
        })->sortByDesc('valor_comprado')->values();

        return response()->json([
            'stats'               => $stats,
            'tendencia'           => $tendencia,
            'topProductos'        => $topProductos,
            'topMedicos'          => $topMedicos,
            'visitadoresAnalisis' => $visitadoresAnalisis,
            'odooConectado'       => $resumen['conectado'] ?? false,
        ]);
    }

    private function visitasPorEstadoQuery(string $fechaInicio, string $fechaFin, ?string $medicoDoc)
    {
        $query = DB::table('visitas')->whereBetween('fecha_programada', [$fechaInicio, $fechaFin]);

        if ($medicoDoc) {
            $medicoIdReal = DB::table('medicos')
                ->whereRaw('TRIM(documento) = ?', [trim($medicoDoc)])
                ->value('id');

            if (!$medicoIdReal) {
                $medicoIdReal = DB::table('medicos_temporales')
                    ->whereRaw('TRIM(documento) = ?', [trim($medicoDoc)])
                    ->value('id');
            }

            $query->where('medico_id', $medicoIdReal ?: 0);
        }

        return $query;
    }
}