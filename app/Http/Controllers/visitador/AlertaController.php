<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico;
use App\Models\Transaccion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Services\OdooService;

class AlertaController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    public function index(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('panel')->with('error', 'Visitador no encontrado.');
        }

        // 1. Sincronización de mes del filtro
        $mesFiltroStr = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));

        // 2. Per-page libre (el usuario escribe el valor que quiera), default 10
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 1) {
            $perPage = 10;
        }
        if ($perPage > 200) {
            $perPage = 200; // límite de seguridad para no saturar las consultas a Odoo
        }
        $page = (int) $request->input('page', 1);

        $mesSeleccionadoInicio = Carbon::parse($mesFiltroStr . '-01')->startOfMonth();
        $mesSeleccionadoFin    = $mesSeleccionadoInicio->copy()->endOfMonth();

        $mesActualInicio = Carbon::now()->startOfMonth();
        $mesActualFin    = Carbon::now()->endOfMonth();

        $esMesActual = $mesSeleccionadoInicio->isSameMonth($mesActualInicio);

        if ($esMesActual) {
            $periodoAInicio = $mesActualInicio->copy()->subMonth()->startOfMonth();
            $periodoAFin    = $mesActualInicio->copy()->subMonth()->endOfMonth();
            $periodoBInicio = $mesActualInicio;
            $periodoBFin    = $mesActualFin;
            $mesFiltroStr   = $periodoAInicio->format('Y-m');
        } elseif ($mesSeleccionadoInicio->lt($mesActualInicio)) {
            $periodoAInicio = $mesSeleccionadoInicio;
            $periodoAFin    = $mesSeleccionadoFin;
            $periodoBInicio = $mesActualInicio;
            $periodoBFin    = $mesActualFin;
        } else {
            $periodoAInicio = $mesActualInicio;
            $periodoAFin    = $mesActualFin;
            $periodoBInicio = $mesSeleccionadoInicio;
            $periodoBFin    = $mesSeleccionadoFin;
        }

        // 3. Props "rápidas" (solo BD local, sin Odoo) -> se envían siempre, de inmediato
        return Inertia::render('VISITADOR/ALERTAS/Alerta', [
            'mesActual'             => $mesFiltroStr,
            'mesHoy'                => $mesActualInicio->format('Y-m'),
            'comparaConMesAnterior' => $esMesActual,
            'periodoALabel'         => $this->formatMesEs($periodoAInicio),
            'periodoBLabel'         => $this->formatMesEs($periodoBInicio),
            'perPageInicial'        => $perPage,
            'paginaInicial'         => $page,

            // 4. Prop "lenta" (consulta Odoo) -> se carga en segundo plano, no bloquea la vista
            'datosAlertas' => Inertia::lazy(function () use (
                $visitador,
                $perPage,
                $page,
                $periodoAInicio,
                $periodoAFin,
                $periodoBInicio,
                $periodoBFin
            ) {
                $medicosPaginados = $visitador->medicos()->paginate($perPage, ['*'], 'page', $page);

                $loteMedicos = collect($medicosPaginados->items());
                $docsLote = $loteMedicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

                $medicosAlertas = [];

                if ($docsLote->isNotEmpty()) {
                    $periodoA = ['desde' => $periodoAInicio->format('Y-m-d'), 'hasta' => $periodoAFin->format('Y-m-d')];
                    $periodoB = ['desde' => $periodoBInicio->format('Y-m-d'), 'hasta' => $periodoBFin->format('Y-m-d')];

                    $odooAlerts = $this->odoo->getProductosComparativoGrupal($docsLote->toArray(), $periodoA, $periodoB);
                    $formulacionGrupal = $this->odoo->getFormulacionGrupalPorDocumentos($docsLote->toArray(), $periodoA, $periodoB);
                    $especialidades = $this->odoo->getEspecialidadesPorDocumentos($docsLote->toArray());

                    foreach ($loteMedicos as $medico) {
                        $doc = (string) $medico->documento;

                        $medAlert = $odooAlerts[$doc] ?? [
                            'totales' => [
                                'comprado_mes_anterior' => 0.0,
                                'comprado_mes_actual'   => 0.0,
                                'comprado_diferencia'   => 0.0,
                                'comprado_tendencia'    => 'igual',
                            ],
                            'productos' => []
                        ];

                        $formulacion = $formulacionGrupal[$doc] ?? [
                            'formulado_mes_anterior' => 0.0,
                            'formulado_mes_actual'   => 0.0,
                            'formulado_diferencia'   => 0.0,
                            'formulado_tendencia'    => 'igual',
                        ];

                        $totalesUnificados = array_merge($medAlert['totales'], $formulacion);

                        $medicosAlertas[] = [
                            'documento'    => $doc,
                            'nombre'       => trim($medico->nombre),
                            'especialidad' => $especialidades[$doc] ?? 'General',
                            'totales'      => $totalesUnificados,
                            'productos'    => $medAlert['productos'],
                        ];
                    }

                    usort($medicosAlertas, function ($a, $b) {
                        $diffRealA = $a['totales']['comprado_mes_actual'] - $a['totales']['comprado_mes_anterior'];
                        $diffRealB = $b['totales']['comprado_mes_actual'] - $b['totales']['comprado_mes_anterior'];
                        return $diffRealA <=> $diffRealB;
                    });
                }

                return [
                    'medicosAlertas' => $medicosAlertas,
                    'pagination'     => [
                        'total'        => $medicosPaginados->total(),
                        'per_page'     => $medicosPaginados->perPage(),
                        'current_page' => $medicosPaginados->currentPage(),
                        'last_page'    => $medicosPaginados->lastPage(),
                    ],
                ];
            }),
        ]);
    }

    public function detalle(Request $request, string $documento)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('panel')->with('error', 'Visitador no encontrado.');
        }

        $medico = $visitador->medicos()->with('tipoDocumento')->where('documento', $documento)->firstOrFail();

        // 1. Consultamos los datos extendidos desde Odoo
        $partnerOdoo = $this->odoo->buscarMedicoPorDocumento($medico->documento);

        // 2. Leemos el mes del filtro; si no viene ningún parámetro, tomamos por defecto EL MES ANTERIOR (ej. Junio)
        $mesFiltroStr = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));

        // Periodo A: Mes a comparar (Filtro)
        $periodoAInicio = Carbon::parse($mesFiltroStr . '-01')->startOfMonth();
        $periodoAFin    = $periodoAInicio->copy()->endOfMonth();

        // Periodo B: Mes actual real (Hoy / Julio)
        $periodoBInicio = Carbon::now()->startOfMonth();
        $periodoBFin    = Carbon::now()->endOfMonth();

        // 🌟 Si el usuario selecciona manualmente el mes actual en el filtro,
        // forzamos a que el Periodo A sea el mes anterior para no comparar Julio vs Julio.
        if ($periodoAInicio->isSameMonth($periodoBInicio)) {
            $periodoAInicio = $periodoBInicio->copy()->subMonth()->startOfMonth();
            $periodoAFin    = $periodoBInicio->copy()->subMonth()->endOfMonth();
            $mesFiltroStr   = $periodoAInicio->format('Y-m');
        }

        return Inertia::render('VISITADOR/ALERTAS/ProductosAlerta', [
            'mesActual'     => $mesFiltroStr,
            'periodoALabel' => $this->formatMesEs($periodoAInicio), // Ej: "junio de 2026"
            'periodoBLabel' => $this->formatMesEs($periodoBInicio), // Ej: "julio de 2026"
            'medico'        => [
                'id'                 => $medico->id,
                'documento'          => $medico->documento,
                'nombre'             => trim($medico->nombre),
                'especialidad'       => $this->odoo->resolverEspecialidadPorDocumento($medico->documento) ?? 'General',
                'celular'            => $partnerOdoo['celular'] ?? $medico->celular,
                'telefono'           => $partnerOdoo['telefono'] ?? $medico->telefono,
                'telefono_contacto'  => $medico->telefono_contacto,
                'mes_nacimiento'     => $partnerOdoo['mes_nacimiento'] ?? $medico->mes_nacimiento,
                'dia_nacimiento'     => $partnerOdoo['dia_nacimiento'] ?? $medico->dia_nacimiento,
                'observaciones'      => $medico->observaciones,
                'direccion_detalles' => $medico->direccion_detalles,
                'horario_atencion'   => $medico->horario_atencion,
                'geolocalizacion'    => $medico->geolocalizacion,
                'tipo_documento'     => $medico->tipoDocumento ? ['nombre' => $medico->tipoDocumento->nombre] : null,
            ],

            'productosAlertas' => Inertia::lazy(function () use ($medico, $periodoAInicio, $periodoAFin, $periodoBInicio, $periodoBFin) {
                $odooResult = $this->odoo->getProductosComparativo(
                    $medico->documento,
                    ['desde' => $periodoAInicio->format('Y-m-d'), 'hasta' => $periodoAFin->format('Y-m-d')],
                    ['desde' => $periodoBInicio->format('Y-m-d'), 'hasta' => $periodoBFin->format('Y-m-d')]
                );

                // ── 1. CARGA Y FILTRADO DE FORMULACIONES POR MES ──
                $formulacionesMesAnterior = collect($this->odoo->getFormulacionPorDocumento($medico->documento, $periodoAInicio->format('Y-m-d')))
                    ->filter(function($l) use ($periodoAInicio, $periodoAFin) {
                        $fecha = Carbon::parse($l['fecha'] ?? now());
                        $estado = strtoupper($l['estado'] ?? '');
                        return $fecha->between($periodoAInicio, $periodoAFin) && !in_array($estado, ['CANCEL', 'CANCELADO', 'CANCELADA']);
                    })->groupBy('codigo');

                $formulacionesMesActual = collect($this->odoo->getFormulacionPorDocumento($medico->documento, $periodoBInicio->format('Y-m-d')))
                    ->filter(function($l) use ($periodoBInicio, $periodoBFin) {
                        $fecha = Carbon::parse($l['fecha'] ?? now());
                        $estado = strtoupper($l['estado'] ?? '');
                        return $fecha->between($periodoBInicio, $periodoBFin) && !in_array($estado, ['CANCEL', 'CANCELADO', 'CANCELADA']);
                    })->groupBy('codigo');

                $productosAlertas = [];
                if ($odooResult['encontrado']) {
                    $codigosProductos = collect($odooResult['productos'])->pluck('codigo')->filter()->unique()->toArray();

                    $laboratoriosLocales = DB::table('productos')
                        ->whereIn('codigo', $codigosProductos)
                        ->pluck('laboratorio', 'codigo')
                        ->toArray();

                    // ── 2. MAPEO DE UNIDADES FORMULADAS ──
                    $productosAlertas = collect($odooResult['productos'])->map(function($p) use ($laboratoriosLocales, $formulacionesMesAnterior, $formulacionesMesActual) {
                        $codigo = $p['codigo'];

                        $cantFormAnterior = $formulacionesMesAnterior->has($codigo) ? (int)$formulacionesMesAnterior->get($codigo)->sum('cantidad') : 0;
                        $cantFormActual   = $formulacionesMesActual->has($codigo) ? (int)$formulacionesMesActual->get($codigo)->sum('cantidad') : 0;
                        $diffFormulado    = $cantFormActual - $cantFormAnterior;

                        $tendenciaFormulado = 'igual';
                        if ($diffFormulado > 0) $tendenciaFormulado = 'subio';
                        if ($diffFormulado < 0) $tendenciaFormulado = 'bajo';

                        return [
                            'codigo'                 => $codigo,
                            'nombre'                 => $p['nombre'],
                            'laboratorio'            => $laboratoriosLocales[$codigo] ?? '—',
                            'comprado_mes_anterior'  => (int) $p['comp_a'],
                            'comprado_mes_actual'    => (int) $p['comp_b'],
                            'comprado_diferencia'    => (int) $p['diferencia'],
                            'comprado_tendencia'     => $p['tendencia'],
                            'formulado_mes_anterior' => $cantFormAnterior,
                            'formulado_mes_actual'   => $cantFormActual,
                            'formulado_diferencia'   => $diffFormulado,
                            'formulado_tendencia'    => $tendenciaFormulado,
                        ];
                    })->all();

                    usort($productosAlertas, function ($a, $b) {
                        $growthA = $a['comprado_mes_actual'] - $a['comprado_mes_anterior'];
                        $growthB = $b['comprado_mes_actual'] - $b['comprado_mes_anterior'];
                        return $growthA <=> $growthB;
                    });
                }
                return $productosAlertas;
            }),

            'puestoReal' => Inertia::lazy(function () use ($visitador, $medico) {
                $todosLosDocs = $visitador->medicos()->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

                $mesInicio = Carbon::now()->startOfMonth();
                $mesFin    = Carbon::now()->endOfMonth();

                $kpisGrupales = $this->odoo->getKpisGrupales($todosLosDocs->toArray(), $mesInicio->format('Y-m-d'), $mesFin->format('Y-m-d'));

                $rankingGlobal = collect($kpisGrupales)->map(fn($k, $doc) => [
                    'documento' => $doc,
                    'suma'      => (float)($k['total_comprado'] ?? 0),
                ])->sortByDesc('suma')->values();

                $puestoReal = $rankingGlobal->search(fn($r) => (string) $r['documento'] === (string) $medico->documento);
                return $puestoReal !== false ? $puestoReal + 1 : null;
            }),
        ]);
    }

    /**
     * Formatea una fecha en "mes de año" en español (ej. "julio de 2026").
     */
    private function formatMesEs(Carbon $fecha): string
    {
        $meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        return $meses[$fecha->month - 1] . ' de ' . $fecha->year;
    }
    
}