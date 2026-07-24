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

    // 1. Mes seleccionado por el usuario en el filtro (por defecto, el mes actual)
    $mesFiltroStr = $request->input('mes', Carbon::now()->format('Y-m'));
    $mesSeleccionadoInicio = Carbon::parse($mesFiltroStr . '-01')->startOfMonth();
    $mesSeleccionadoFin    = $mesSeleccionadoInicio->copy()->endOfMonth();

    // 2. Mes actual real (hoy)
    $mesActualInicio = Carbon::now()->startOfMonth();
    $mesActualFin    = Carbon::now()->endOfMonth();

    // 3. Regla de negocio: comparamos "mes actual real" vs "mes seleccionado".
    //    periodoA siempre es el mes cronológicamente más antiguo (para que
    //    'comprado_mes_anterior'/'comprado_mes_actual' del OdooService y las
    //    columnas "Ant"/"Act" del front sigan siendo coherentes).
    $esMesActual = $mesSeleccionadoInicio->isSameMonth($mesActualInicio);

    if ($esMesActual) {
        // No se puede comparar el mes actual contra sí mismo: caemos al mes anterior
        $periodoAInicio = $mesActualInicio->copy()->subMonth()->startOfMonth();
        $periodoAFin    = $mesActualInicio->copy()->subMonth()->endOfMonth();
        $periodoBInicio = $mesActualInicio;
        $periodoBFin    = $mesActualFin;
    } elseif ($mesSeleccionadoInicio->lt($mesActualInicio)) {
        // Caso normal: el mes seleccionado es anterior al actual
        $periodoAInicio = $mesSeleccionadoInicio;
        $periodoAFin    = $mesSeleccionadoFin;
        $periodoBInicio = $mesActualInicio;
        $periodoBFin    = $mesActualFin;
    } else {
        // Caso borde: seleccionaron un mes futuro
        $periodoAInicio = $mesActualInicio;
        $periodoAFin    = $mesActualFin;
        $periodoBInicio = $mesSeleccionadoInicio;
        $periodoBFin    = $mesSeleccionadoFin;
    }

    return Inertia::render('VISITADOR/ALERTAS/Alerta', [
        'mesActual'             => $mesFiltroStr,
        'mesHoy'                => $mesActualInicio->format('Y-m'),
        'comparaConMesAnterior' => $esMesActual,
        'periodoALabel'         => $this->formatMesEs($periodoAInicio),
        'periodoBLabel'         => $this->formatMesEs($periodoBInicio),

        'medicosAlertas' => Inertia::lazy(function () use ($visitador, $periodoAInicio, $periodoAFin, $periodoBInicio, $periodoBFin) {
            $medicos = $visitador->medicos()->get();
            $todosMedicosDoc = $medicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

            $medicosAlertas = [];

            if ($todosMedicosDoc->isNotEmpty()) {
                // Periodo A = mes más antiguo | Periodo B = mes más reciente
                $periodoA = ['desde' => $periodoAInicio->format('Y-m-d'), 'hasta' => $periodoAFin->format('Y-m-d')];
                $periodoB = ['desde' => $periodoBInicio->format('Y-m-d'), 'hasta' => $periodoBFin->format('Y-m-d')];

                $odooAlerts = $this->odoo->getProductosComparativoGrupal(
                    $todosMedicosDoc->toArray(),
                    $periodoA,
                    $periodoB
                );

                $formulacionGrupal = $this->odoo->getFormulacionGrupalPorDocumentos(
                    $todosMedicosDoc->toArray(),
                    $periodoA,
                    $periodoB
                );

                $especialidades = $this->odoo->getEspecialidadesPorDocumentos($todosMedicosDoc->toArray());

                foreach ($medicos as $medico) {
                    $doc = (string) $medico->documento;

                    $medAlert = $odooAlerts[$doc] ?? [
                        'totales' => [
                            'comprado_mes_anterior'  => 0.0,
                            'comprado_mes_actual'    => 0.0,
                            'comprado_diferencia'    => 0.0,
                            'comprado_tendencia'     => 'igual',
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

            return $medicosAlertas;
        })
    ]);
}

    public function detalle(Request $request, string $documento)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('panel')->with('error', 'Visitador no encontrado.');
        }

        $medico = $visitador->medicos()->with('tipoDocumento')->where('documento', $documento)->firstOrFail();

        $mesFiltroStr = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));
        $mesCompararInicio = Carbon::parse($mesFiltroStr . '-01')->startOfMonth();
        $mesCompararFin = $mesCompararInicio->copy()->endOfMonth();

        $mesActualInicio = Carbon::now()->startOfMonth();
        $mesActualFin = Carbon::now()->endOfMonth();

        return Inertia::render('VISITADOR/ALERTAS/ProductosAlerta', [
            'mesActual'  => $mesFiltroStr,
            'medico'     => [
                'id'                 => $medico->id,
                'documento'          => $medico->documento,
                'nombre'             => trim($medico->nombre),
                'especialidad'       => $this->odoo->resolverEspecialidadPorDocumento($medico->documento) ?? 'General',
                'telefono_contacto'  => $medico->telefono_contacto,
                'direccion_detalles' => $medico->direccion_detalles,
                'horario_atencion'   => $medico->horario_atencion,
                'geolocalizacion'    => $medico->geolocalizacion,
                'tipo_documento'     => $medico->tipoDocumento ? ['nombre' => $medico->tipoDocumento->nombre] : null,
            ],

            'productosAlertas' => Inertia::lazy(function () use ($medico, $mesCompararInicio, $mesCompararFin, $mesActualInicio, $mesActualFin) {
                $odooResult = $this->odoo->getProductosComparativo(
                    $medico->documento,
                    ['desde' => $mesCompararInicio->format('Y-m-d'), 'hasta' => $mesCompararFin->format('Y-m-d')],
                    ['desde' => $mesActualInicio->format('Y-m-d'),   'hasta' => $mesActualFin->format('Y-m-d')]
                );

                // ── 1. CARGA Y FILTRADO DE FORMULACIONES LOCALES/ODOO POR MES ──
                $formulacionesMesAnterior = collect($this->odoo->getFormulacionPorDocumento($medico->documento, $mesCompararInicio->format('Y-m-d')))
                    ->filter(function($l) use ($mesCompararInicio, $mesCompararFin) {
                        $fecha = Carbon::parse($l['fecha'] ?? now());
                        $estado = strtoupper($l['estado'] ?? '');
                        return $fecha->between($mesCompararInicio, $mesCompararFin) && $estado !== 'CANCEL' && $estado !== 'CANCELADO' && $estado !== 'CANCELADA';
                    })->groupBy('codigo');

                $formulacionesMesActual = collect($this->odoo->getFormulacionPorDocumento($medico->documento, $mesActualInicio->format('Y-m-d')))
                    ->filter(function($l) use ($mesActualInicio, $mesActualFin) {
                        $fecha = Carbon::parse($l['fecha'] ?? now());
                        $estado = strtoupper($l['estado'] ?? '');
                        return $fecha->between($mesActualInicio, $mesActualFin) && $estado !== 'CANCEL' && $estado !== 'CANCELADO' && $estado !== 'CANCELADA';
                    })->groupBy('codigo');

                $productosAlertas = [];
                if ($odooResult['encontrado']) {
                    
                    $codigosProductos = collect($odooResult['productos'])->pluck('codigo')->filter()->unique()->toArray();

                    $laboratoriosLocales = DB::table('productos')
                        ->whereIn('codigo', $codigosProductos)
                        ->pluck('laboratorio', 'codigo')
                        ->toArray();

                    // ── 2. MAPEO E INYECCIÓN DE UNIDADES FORMULADAS POR PRODUCTO ──
                    $productosAlertas = collect($odooResult['productos'])->map(function($p) use ($laboratoriosLocales, $formulacionesMesAnterior, $formulacionesMesActual) {
                        $codigo = $p['codigo'];

                        // Obtenemos las sumas de las cantidades para este código de producto específico
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
                            // Reemplazamos los ceros por las cantidades y tendencias reales calculadas
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