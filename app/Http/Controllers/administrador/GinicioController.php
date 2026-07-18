<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\OdooSnapshot;
use App\Models\Visitador;
use App\Services\OdooService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class GinicioController extends Controller
{
    private OdooService $odoo;

    /** Memoiza calcularResumenAdmin() dentro de la misma request (varios props lazy la comparten). */
    private ?array $resumenAdminCache = null;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    public function index(Request $request)
    {
        // Por defecto: mes actual (antes: últimos 11 meses).
        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $fechaFin    = $request->input('fecha_fin',    Carbon::now()->endOfMonth()->format('Y-m-d'));
        $medicoDoc   = $request->input('medico_documento');

        // Sin médico filtrado: médicos con visitador asignado (los realmente
        // gestionados hoy). Con un médico filtrado: solo ese documento.
        $documentos = $medicoDoc
            ? [(string) $medicoDoc]
            : Medico::whereNotNull('visitador_id')
                ->pluck('documento')
                ->filter()
                ->map(fn($d) => (string) $d)
                ->values()
                ->toArray();

        $claveCache   = $medicoDoc ? "medico_{$medicoDoc}" : 'admin_global';
        $periodoCache = "{$fechaInicio}_{$fechaFin}";
        $mesCache     = substr($fechaFin, 0, 7);

        // --- Visitas por estado (local, sin Odoo) ---
        $visitasPorEstadoQuery = DB::table('visitas')
            ->whereBetween('fecha_programada', [$fechaInicio, $fechaFin]);

        if ($medicoDoc) {
            $medicoIdReal = DB::table('medicos')
                ->whereRaw('TRIM(documento) = ?', [trim($medicoDoc)])
                ->value('id');

            if (!$medicoIdReal) {
                $medicoIdReal = DB::table('medicos_temporales')
                    ->whereRaw('TRIM(documento) = ?', [trim($medicoDoc)])
                    ->value('id');
            }

            $visitasPorEstadoQuery->where('medico_id', $medicoIdReal ?: 0);
        }

        $visitasPorEstado = $visitasPorEstadoQuery
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->get();

        // --- Resumen de visitas por visitador (local, sin Odoo) ---
        $visitadoresResumen = DB::table('visitadores')
            ->leftJoin('visitas', function ($j) use ($fechaInicio, $fechaFin) {
                $j->on('visitadores.id', '=', 'visitas.visitador_id')
                  ->whereBetween('visitas.fecha_programada', [$fechaInicio, $fechaFin]);
            })
            ->select(
                'visitadores.id',
                'visitadores.nombre',
                'visitadores.apellido',
                DB::raw('COUNT(visitas.id)                                              as total_visitas'),
                DB::raw("SUM(CASE WHEN visitas.estado = 'efectiva'   THEN 1 ELSE 0 END) as efectivas"),
                DB::raw("SUM(CASE WHEN visitas.estado = 'programada' THEN 1 ELSE 0 END) as programadas"),
                DB::raw("SUM(CASE WHEN visitas.estado = 'cancelada'  THEN 1 ELSE 0 END) as canceladas")
            )
            ->groupBy('visitadores.id', 'visitadores.nombre', 'visitadores.apellido')
            ->get();

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

        // --- Lista de médicos para el filtro (ya no depende de transacciones) ---
        $medicosLista = Medico::whereNotNull('documento')
            ->orderBy('nombre')
            ->get(['documento', 'nombre']);

        return Inertia::render('ADMINISTRADOR/Ginicio', [
            'filtros' => [
                'fecha_inicio'        => $fechaInicio,
                'fecha_fin'           => $fechaFin,
                'medico_seleccionado' => $medicoDoc,
            ],
            'visitadoresResumen' => $visitadoresResumen,
            'visitasPorEstado'   => $visitasPorEstado,
            'medicos'            => $medicosLista,

            // Conteos locales: instantáneos, no dependen de Odoo.
            'statsLocales' => [
                'visitadores'        => Visitador::count(),
                'medicos'            => Medico::count(),
                'medicos_temporales' => MedicoTemporal::count(),
            ],

            'stats' => Inertia::lazy(
                fn() => $this->resumenAdmin($documentos, $fechaInicio, $fechaFin, $claveCache, $periodoCache, $mesCache)['stats']
            ),

            'tendencia' => Inertia::lazy(
                fn() => $this->resumenAdmin($documentos, $fechaInicio, $fechaFin, $claveCache, $periodoCache, $mesCache)['tendencia']
            ),
            'topProductos' => Inertia::lazy(
                fn() => $this->resumenAdmin($documentos, $fechaInicio, $fechaFin, $claveCache, $periodoCache, $mesCache)['topProductos']
            ),
            'topMedicos' => Inertia::lazy(
                fn() => $this->resumenAdmin($documentos, $fechaInicio, $fechaFin, $claveCache, $periodoCache, $mesCache)['topMedicos']
            ),
            'visitadoresAnalisis' => Inertia::lazy(function () use (
                $documentos, $fechaInicio, $fechaFin, $claveCache, $periodoCache, $mesCache, $visitasVisitadores
            ) {
                $porVisitador = $this->resumenAdmin($documentos, $fechaInicio, $fechaFin, $claveCache, $periodoCache, $mesCache)['porVisitador'];

                return Visitador::all(['id', 'nombre', 'apellido'])->map(function ($v) use ($porVisitador, $visitasVisitadores) {
                    $tx  = $porVisitador[$v->id] ?? null;
                    $vis = $visitasVisitadores->get($v->id);

                    $totalVisitas = $vis?->total_visitas ?? 0;
                    $visEfectivas = $vis?->visitas_efectivas ?? 0;

                    return [
                        'id'                => $v->id,
                        'nombre'            => trim("$v->nombre $v->apellido"),
                        'valor_comprado'    => (float) ($tx['valor_comprado'] ?? 0),
                        'valor_formulado'   => (float) ($tx['valor_formulado'] ?? 0),
                        'medicos_activos'   => (int) ($tx['medicos_activos'] ?? 0),
                        'total_visitas'     => (int) $totalVisitas,
                        'visitas_efectivas' => (int) $visEfectivas,
                        'efectividad'       => $totalVisitas > 0 ? round(($visEfectivas / $totalVisitas) * 100, 1) : 0,
                    ];
                })->sortByDesc('valor_comprado')->values();
            }),
        ]);
    }

    /**
     * Borra el snapshot cacheado del dashboard (global o de un médico
     * puntual) para forzar el recálculo contra Odoo en la próxima carga.
     */
    public function actualizarGinicio(Request $request)
    {
        $medicoDoc = $request->input('medico_documento');
        $clave = $medicoDoc ? "medico_{$medicoDoc}" : 'admin_global';

        OdooSnapshot::where('documento', $clave)->delete();

        return back()->with('success', 'Los datos se están actualizando. Puede tardar unos segundos.');
    }

    /**
     * Trae (con caché) el resumen agregado de Odoo para el dashboard:
     * stats, tendencia mensual, top productos, top médicos y el rollup por
     * visitador. Memoizado por instancia porque varios props Inertia::lazy
     * de la misma request lo necesitan.
     */
    private function resumenAdmin(
        array $documentos, string $fechaInicio, string $fechaFin,
        string $clave, string $periodo, string $mes
    ): array {
        if ($this->resumenAdminCache !== null) {
            return $this->resumenAdminCache;
        }

        $snapshot = OdooSnapshot::buscar($clave, $periodo, $mes);
        if ($snapshot) {
            return $this->resumenAdminCache = $snapshot->payload;
        }

        $data = $this->calcularResumenAdmin($documentos, $fechaInicio, $fechaFin);
        OdooSnapshot::guardar($clave, $periodo, $mes, $data);

        return $this->resumenAdminCache = $data;
    }

    /**
     * Lógica pesada: 1 sola llamada a Odoo (OdooService::obtenerResumenAdmin)
     * y arma las estructuras que espera la vista (stats, tendencia,
     * topProductos, topMedicos, porVisitador).
     */
    private function calcularResumenAdmin(array $documentos, string $fechaInicio, string $fechaFin): array
    {
        $resumen = $this->odoo->obtenerResumenAdmin($documentos, $fechaInicio, $fechaFin);

        $medicosInfo = Medico::whereIn('documento', $documentos)
            ->get(['documento', 'nombre', 'visitador_id'])
            ->keyBy(fn($m) => (string) $m->documento);

        $topMedicos = collect($resumen['porMedico'])
            ->map(function ($datos, $doc) use ($medicosInfo) {
                $m = $medicosInfo->get($doc);
                $compradas  = (int) $datos['unidades_compradas'];
                $formuladas = (int) $datos['unidades_formuladas'];

                return [
                    'documento'      => $doc,
                    'nombre'         => $m ? trim($m->nombre) : $doc,
                    'compradas'      => $compradas,
                    'formuladas'     => $formuladas,
                    'valor_comprado' => (float) $datos['valor_comprado'],
                    'efectividad'    => $compradas > 0 ? round(($formuladas / $compradas) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('compradas')
            ->take(10)
            ->values();

        $topProductos = collect($resumen['productos'])
            ->take(10)
            ->map(fn($p) => [
                'nombre'          => $p['nombre'],
                'valor_comprado'  => (float) $p['valor_comprado'],
                'valor_formulado' => (float) $p['valor_formulado'],
                'unidades'        => (float) $p['unidades'],
            ])
            ->values();

        // Rollup por visitador (para visitadoresAnalisis, combinado luego con visitas locales).
        $porVisitador = [];
        foreach ($resumen['porMedico'] as $doc => $datos) {
            $m = $medicosInfo->get($doc);
            if (!$m || !$m->visitador_id) continue;

            $vid = $m->visitador_id;
            if (!isset($porVisitador[$vid])) {
                $porVisitador[$vid] = ['valor_comprado' => 0.0, 'valor_formulado' => 0.0, 'medicos_activos' => 0];
            }
            $porVisitador[$vid]['valor_comprado']  += $datos['valor_comprado'];
            $porVisitador[$vid]['valor_formulado'] += $datos['valor_formulado'];
            $porVisitador[$vid]['medicos_activos']++;
        }

        return [
            'stats' => [
                'total_transacciones' => $resumen['total_transacciones'],
                'valor_comprado'      => $resumen['total_valor_comprado'],
                'valor_formulado'     => $resumen['total_valor_formulado'],
                'unidades_compradas'  => $resumen['total_unidades_compradas'],
                'unidades_formuladas' => $resumen['total_unidades_formuladas'],
                'medicos_con_tx'      => $resumen['medicos_con_tx'],
            ],
            'tendencia' => collect($resumen['tendencia'])->map(fn($t) => [
                'mes'             => $t['mes'],
                'valor_comprado'  => (float) $t['valor_comprado'],
                'valor_formulado' => (float) $t['valor_formulado'],
            ])->values(),
            'topProductos' => $topProductos,
            'topMedicos'   => $topMedicos,
            'porVisitador' => $porVisitador,
        ];
    }
}
