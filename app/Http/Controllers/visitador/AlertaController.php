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

    // ── RETORNO INMEDIATO CON LAZY PROPS ──
    return Inertia::render('VISITADOR/ALERTAS/Alerta', [
        'mesActual'      => $mesFiltroStr,
        // Al envolverlo en una función, Inertia no lo ejecuta en la carga inicial si se solicita diferido
        'medicosAlertas' => Inertia::lazy(function () use ($visitador, $mesCompararInicio, $mesCompararFin, $mesActualInicio, $mesActualFin) {
            $medicos = $visitador->medicos()->get();
            $todosMedicosDoc = $medicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

            $medicosAlertas = [];

            if ($todosMedicosDoc->isNotEmpty()) {
                $odooAlerts = $this->odoo->getProductosComparativoGrupal(
                    $todosMedicosDoc->toArray(),
                    ['desde' => $mesCompararInicio->format('Y-m-d'), 'hasta' => $mesCompararFin->format('Y-m-d')],
                    ['desde' => $mesActualInicio->format('Y-m-d'),   'hasta' => $mesActualFin->format('Y-m-d')]
                );

                foreach ($medicos as $medico) {
                    $doc = (string)$medico->documento;
                    $medAlert = $odooAlerts[$doc] ?? [
                        'totales' => [
                            'comprado_mes_anterior'  => 0.0,
                            'comprado_mes_actual'    => 0.0,
                            'comprado_diferencia'    => 0.0,
                            'comprado_tendencia'     => 'igual',
                            'formulado_mes_anterior' => 0.0,
                            'formulado_mes_actual'   => 0.0,
                            'formulado_diferencia'   => 0.0,
                            'formulado_tendencia'    => 'igual',
                        ],
                        'productos' => []
                    ];

                    $medicosAlertas[] = [
                        'documento'    => $doc,
                        'nombre'       => trim($medico->nombre),
                        'especialidad' => $medico->especialidad ?? 'General',
                        'totales'      => $medAlert['totales'],
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

    // Buscamos el médico de inmediato (es rápido porque es base de datos local)
    $medico = $visitador->medicos()->with('tipoDocumento')->where('documento', $documento)->firstOrFail();

    $mesFiltroStr = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));
    $mesCompararInicio = Carbon::parse($mesFiltroStr . '-01')->startOfMonth();
    $mesCompararFin = $mesCompararInicio->copy()->endOfMonth();

    $mesActualInicio = Carbon::now()->startOfMonth();
    $mesActualFin = Carbon::now()->endOfMonth();

    // ── RETORNO INMEDIATO DE LA ESTRUCTURA DE LA VISTA ──
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

        // Propiedad diferida para el listado de productos
        'productosAlertas' => Inertia::lazy(function () use ($medico, $mesCompararInicio, $mesCompararFin, $mesActualInicio, $mesActualFin) {
            $odooResult = $this->odoo->getProductosComparativo(
                $medico->documento,
                ['desde' => $mesCompararInicio->format('Y-m-d'), 'hasta' => $mesCompararFin->format('Y-m-d')],
                ['desde' => $mesActualInicio->format('Y-m-d'),   'hasta' => $mesActualFin->format('Y-m-d')]
            );

            $productosAlertas = [];
            if ($odooResult['encontrado']) {
                $productosAlertas = collect($odooResult['productos'])->map(fn($p) => [
                    'codigo'                 => $p['codigo'],
                    'nombre'                 => $p['nombre'],
                    'laboratorio'            => $p['laboratorio'] ?? '—',
                    'comprado_mes_anterior'  => (int) $p['comp_a'],
                    'comprado_mes_actual'    => (int) $p['comp_b'],
                    'comprado_diferencia'    => (int) $p['diferencia'],
                    'comprado_tendencia'     => $p['tendencia'],
                    'formulado_mes_anterior' => 0,
                    'formulado_mes_actual'   => 0,
                    'formulado_diferencia'   => 0,
                    'formulado_tendencia'    => 'igual',
                ])->all();

                usort($productosAlertas, function ($a, $b) {
                    $growthA = $a['comprado_mes_actual'] - $a['comprado_mes_anterior'];
                    $growthB = $b['comprado_mes_actual'] - $b['comprado_mes_anterior'];
                    return $growthA <=> $growthB;
                });
            }
            return $productosAlertas;
        }),

        // Propiedad diferida para calcular el puesto en el ranking mundial
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