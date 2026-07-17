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

        $mesFiltroStr = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));
        $mesCompararInicio = Carbon::parse($mesFiltroStr . '-01')->startOfMonth();
        $mesCompararFin = $mesCompararInicio->copy()->endOfMonth();

        $mesActualInicio = Carbon::now()->startOfMonth();
        $mesActualFin = Carbon::now()->endOfMonth();

        return Inertia::render('VISITADOR/ALERTAS/Alerta', [
            'mesActual'      => $mesFiltroStr,
            'medicosAlertas' => Inertia::lazy(function () use ($visitador, $mesCompararInicio, $mesCompararFin, $mesActualInicio, $mesActualFin) {
                $medicos = $visitador->medicos()->get();
                $todosMedicosDoc = $medicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

                $medicosAlertas = [];

                if ($todosMedicosDoc->isNotEmpty()) {
                    $periodoA = ['desde' => $mesCompararInicio->format('Y-m-d'), 'hasta' => $mesCompararFin->format('Y-m-d')];
                    $periodoB = ['desde' => $mesActualInicio->format('Y-m-d'),   'hasta' => $mesActualFin->format('Y-m-d')];

                    // ── ANTES: 2 llamadas a Odoo POR CADA médico dentro de un foreach
                    // (getFormulacionPorDocumento x2), lo que con 40 médicos eran ~80
                    // peticiones XML-RPC secuenciales. AHORA: 1 sola llamada grupal para
                    // el "comprado" + 1 sola llamada grupal para el "formulado", sin
                    // importar cuántos médicos tenga el visitador.
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

                        // Unificamos con los totales calculados de formulación
                        $totalesUnificados = array_merge($medAlert['totales'], $formulacion);

                        $medicosAlertas[] = [
                            'documento'    => $doc,
                            'nombre'       => trim($medico->nombre),
                            'especialidad' => $medico->especialidad ?? 'General',
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
                'especialidad'       => $medico->especialidad ?? 'General',
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
}