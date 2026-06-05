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

class AlertaController extends Controller
{
    public function index(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('panel')->with('error', 'Visitador no encontrado.');
        }

        // 1. El mes seleccionado en el filtro es el mes con el que queremos COMPARAR (el pasado)
        $mesFiltroStr = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));
        $mesCompararInicio = Carbon::parse($mesFiltroStr . '-01')->startOfMonth();
        $mesCompararFin = $mesCompararInicio->copy()->endOfMonth();

        // 2. El mes actual siempre será el mes real en curso (Junio 2026)
        $mesActualInicio = Carbon::now()->startOfMonth();
        $mesActualFin = Carbon::now()->endOfMonth();

        $medicos = $visitador->medicos()->get();
        $todosMedicosDoc = $medicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

        $medicosAlertas = [];

        if ($todosMedicosDoc->isNotEmpty()) {
            // Rango SQL que cubre desde el mes más viejo (filtro) hasta el mes de hoy
            $fechaMinima = min($mesCompararInicio->format('Y-m-d'), $mesActualInicio->format('Y-m-d'));
            $fechaMaxima = max($mesCompararFin->format('Y-m-d'), $mesActualFin->format('Y-m-d'));

            $transacciones = DB::table('transacciones as t')
                ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
                ->select(
                    't.medico_documento',
                    't.producto_codigo',
                    'p.nombre as producto_nombre',
                    'p.laboratorio as producto_laboratorio',
                    't.fecha',
                    't.unidades_compradas',
                    't.unidades_formuladas'
                )
                ->whereIn('t.medico_documento', $todosMedicosDoc)
                ->whereBetween('t.fecha', [$fechaMinima, $fechaMaxima])
                ->get();

            $datosPorMedico = [];

            foreach ($medicos as $medico) {
                $doc = (string) $medico->documento;
                $datosPorMedico[$doc] = [
                    'documento'    => $doc,
                    'nombre'       => trim($medico->nombre . ' ' . $medico->apellido),
                    'especialidad' => $medico->especialidad ?? 'General',
                    'totales'      => [
                        'formulado_mes_anterior' => 0, // Actuará como mes del filtro
                        'formulado_mes_actual'   => 0, // Mes real actual (Junio)
                        'formulado_diferencia'   => 0,
                        'formulado_tendencia'    => 'igual',
                        'comprado_mes_anterior'  => 0, // Actuará como mes del filtro
                        'comprado_mes_actual'    => 0, // Mes real actual (Junio)
                        'comprado_diferencia'    => 0,
                        'comprado_tendencia'     => 'igual',
                    ],
                    'productos' => []
                ];
            }

            foreach ($transacciones as $t) {
                $doc = (string) $t->medico_documento;
                if (!isset($datosPorMedico[$doc])) continue;

                $prodCod    = $t->producto_codigo ?? 'SIN_CODIGO';
                $prodNombre = $t->producto_nombre ?? ('Producto ' . $prodCod);
                $prodLab    = $t->producto_laboratorio ?? 'Sin Laboratorio';

                $fecha         = Carbon::parse($t->fecha);
                $esMesActual   = $fecha->between($mesActualInicio, $mesActualFin);
                $esMesFiltro   = $fecha->between($mesCompararInicio, $mesCompararFin);

                $compradas  = (int) ($t->unidades_compradas ?? 0);
                $formuladas = (int) ($t->unidades_formuladas ?? 0);

                if ($esMesActual) {
                    $datosPorMedico[$doc]['totales']['comprado_mes_actual']  += $compradas;
                    $datosPorMedico[$doc]['totales']['formulado_mes_actual'] += $formuladas;
                } elseif ($esMesFiltro) {
                    $datosPorMedico[$doc]['totales']['comprado_mes_anterior']  += $compradas;
                    $datosPorMedico[$doc]['totales']['formulado_mes_anterior'] += $formuladas;
                }

                if (!isset($datosPorMedico[$doc]['productos'][$prodCod])) {
                    $datosPorMedico[$doc]['productos'][$prodCod] = [
                        'codigo'                 => $prodCod,
                        'nombre'                 => $prodNombre,
                        'laboratorio'            => $prodLab,
                        'formulado_mes_anterior' => 0,
                        'formulado_mes_actual'   => 0,
                        'formulado_diferencia'   => 0,
                        'formulado_tendencia'    => 'igual',
                        'comprado_mes_anterior'  => 0,
                        'comprado_mes_actual'    => 0,
                        'comprado_diferencia'    => 0,
                        'comprado_tendencia'     => 'igual',
                    ];
                }

                if ($esMesActual) {
                    $datosPorMedico[$doc]['productos'][$prodCod]['comprado_mes_actual']  += $compradas;
                    $datosPorMedico[$doc]['productos'][$prodCod]['formulado_mes_actual'] += $formuladas;
                } elseif ($esMesFiltro) {
                    $datosPorMedico[$doc]['productos'][$prodCod]['comprado_mes_anterior']  += $compradas;
                    $datosPorMedico[$doc]['productos'][$prodCod]['formulado_mes_anterior'] += $formuladas;
                }
            }

            foreach ($datosPorMedico as $doc => &$info) {
                $t = &$info['totales'];
                $t['formulado_diferencia'] = $t['formulado_mes_actual'] - $t['formulado_mes_anterior'];
                $t['formulado_tendencia']  = $t['formulado_diferencia'] > 0 ? 'subio' : ($t['formulado_diferencia'] < 0 ? 'bajo' : 'igual');
                $t['comprado_diferencia']  = $t['comprado_mes_actual'] - $t['comprado_mes_anterior'];
                $t['comprado_tendencia']   = $t['comprado_diferencia'] > 0 ? 'subio' : ($t['comprado_diferencia'] < 0 ? 'bajo' : 'igual');

                $prods = [];
                foreach ($info['productos'] as $prodCod => $pInfo) {
                    $pInfo['formulado_diferencia'] = $pInfo['formulado_mes_actual'] - $pInfo['formulado_mes_anterior'];
                    $pInfo['formulado_tendencia']  = $pInfo['formulado_diferencia'] > 0 ? 'subio' : ($pInfo['formulado_diferencia'] < 0 ? 'bajo' : 'igual');
                    $pInfo['comprado_diferencia']  = $pInfo['comprado_mes_actual'] - $pInfo['comprado_mes_anterior'];
                    $pInfo['comprado_tendencia']   = $pInfo['comprado_diferencia'] > 0 ? 'subio' : ($pInfo['comprado_diferencia'] < 0 ? 'bajo' : 'igual');

                    $totalUnidades = $pInfo['formulado_mes_anterior'] + $pInfo['formulado_mes_actual'] + 
                                     $pInfo['comprado_mes_anterior']  + $pInfo['comprado_mes_actual'];

                    if ($totalUnidades > 0) {
                        $prods[] = $pInfo;
                    }
                }

                $info['productos'] = $prods;
            }
            unset($info);

            $medicosAlertas = array_values($datosPorMedico);

            usort($medicosAlertas, function ($a, $b) {
                $diffA = $a['totales']['formulado_diferencia'] + $a['totales']['comprado_diferencia'];
                $diffB = $b['totales']['formulado_diferencia'] + $b['totales']['comprado_diferencia'];
                return $diffA <=> $diffB;
            });
        }

        return Inertia::render('VISITADOR/ALERTAS/Alerta', [
            'medicosAlertas' => $medicosAlertas,
            'mesActual'      => $mesFiltroStr, // Sostiene el mes seleccionado en la UI
        ]);
    }

    public function detalle(Request $request, string $documento)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('panel')->with('error', 'Visitador no encontrado.');
        }

        $medico = $visitador->medicos()->with('tipoDocumento')->where('documento', $documento)->firstOrFail();

        // 1. Mes del selector
        $mesFiltroStr = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));
        $mesCompararInicio = Carbon::parse($mesFiltroStr . '-01')->startOfMonth();
        $mesCompararFin = $mesCompararInicio->copy()->endOfMonth();

        // 2. Mes de hoy (Junio)
        $mesActualInicio = Carbon::now()->startOfMonth();
        $mesActualFin = Carbon::now()->endOfMonth();

        $fechaMinima = min($mesCompararInicio->format('Y-m-d'), $mesActualInicio->format('Y-m-d'));
        $fechaMaxima = max($mesCompararFin->format('Y-m-d'), $mesActualFin->format('Y-m-d'));

        $transacciones = DB::table('transacciones as t')
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                't.medico_documento',
                't.producto_codigo',
                'p.nombre as producto_nombre',
                'p.laboratorio as producto_laboratorio',
                't.fecha',
                't.unidades_compradas',
                't.unidades_formuladas'
            )
            ->where('t.medico_documento', $medico->documento)
            ->whereBetween('t.fecha', [$fechaMinima, $fechaMaxima])
            ->get();

        $productosMap = [];

        foreach ($transacciones as $t) {
            $prodCod    = $t->producto_codigo ?? 'SIN_CODIGO';
            $prodNombre = $t->producto_nombre ?? ('Producto ' . $prodCod);
            $prodLab    = $t->producto_laboratorio ?? 'Sin Laboratorio';

            $fecha         = Carbon::parse($t->fecha);
            $esMesActual   = $fecha->between($mesActualInicio, $mesActualFin);
            $esMesFiltro   = $fecha->between($mesCompararInicio, $mesCompararFin);

            $compradas  = (int) ($t->unidades_compradas ?? 0);
            $formuladas = (int) ($t->unidades_formuladas ?? 0);

            if (!isset($productosMap[$prodCod])) {
                $productosMap[$prodCod] = [
                    'codigo'                 => $prodCod,
                    'nombre'                 => $prodNombre,
                    'laboratorio'            => $prodLab,
                    'formulado_mes_anterior' => 0,
                    'formulado_mes_actual'   => 0,
                    'formulado_diferencia'   => 0,
                    'formulado_tendencia'    => 'igual',
                    'comprado_mes_anterior'  => 0,
                    'comprado_mes_actual'    => 0,
                    'comprado_diferencia'    => 0,
                    'comprado_tendencia'     => 'igual',
                ];
            }

            if ($esMesActual) {
                $productosMap[$prodCod]['comprado_mes_actual']  += $compradas;
                $productosMap[$prodCod]['formulado_mes_actual'] += $formuladas;
            } elseif ($esMesFiltro) {
                $productosMap[$prodCod]['comprado_mes_anterior']  += $compradas;
                $productosMap[$prodCod]['formulado_mes_anterior'] += $formuladas;
            }
        }

        $productosAlertas = [];
        foreach ($productosMap as $prodCod => $pInfo) {
            $pInfo['formulado_diferencia'] = $pInfo['formulado_mes_actual'] - $pInfo['formulado_mes_anterior'];
            $pInfo['formulado_tendencia']  = $pInfo['formulado_diferencia'] > 0 ? 'subio' : ($pInfo['formulado_diferencia'] < 0 ? 'bajo' : 'igual');
            $pInfo['comprado_diferencia']  = $pInfo['comprado_mes_actual'] - $pInfo['comprado_mes_anterior'];
            $pInfo['comprado_tendencia']   = $pInfo['comprado_diferencia'] > 0 ? 'subio' : ($pInfo['comprado_diferencia'] < 0 ? 'bajo' : 'igual');

            $totalUnidades = $pInfo['formulado_mes_anterior'] + $pInfo['formulado_mes_actual'] + 
                             $pInfo['comprado_mes_anterior']  + $pInfo['comprado_mes_actual'];

            if ($totalUnidades > 0) {
                $productosAlertas[] = $pInfo;
            }
        }

        usort($productosAlertas, function ($a, $b) {
            $diffA = $a['formulado_diferencia'] + $a['comprado_diferencia'];
            $diffB = $b['formulado_diferencia'] + $b['comprado_diferencia'];
            return $diffA <=> $diffB;
        });

        // ── Puesto real en el ranking ──
        $todosLosDocs = $visitador->medicos()
            ->pluck('documento')
            ->filter()
            ->unique()
            ->map(fn($d) => (string) $d)
            ->values();

        $rankingGlobal = DB::table('transacciones')
            ->select(
                'medico_documento',
                DB::raw('SUM(valor_comprado)  as total_comprado'),
                DB::raw('SUM(valor_formulado) as total_formulado')
            )
            ->whereIn('medico_documento', $todosLosDocs)
            ->whereBetween('fecha', [$fechaMinima, $fechaMaxima])
            ->groupBy('medico_documento')
            ->get()
            ->map(fn($r) => [
                'documento' => $r->medico_documento,
                'suma'      => (float) $r->total_comprado + (float) $r->total_formulado,
            ])
            ->sortByDesc('suma')
            ->values();

        $puestoReal = $rankingGlobal->search(fn($r) => (string) $r['documento'] === (string) $medico->documento);
        $puestoReal = $puestoReal !== false ? $puestoReal + 1 : null;

        return Inertia::render('VISITADOR/ALERTAS/ProductosAlerta', [
            'medico' => [
                'id'                 => $medico->id,
                'documento'          => $medico->documento,
                'nombre'             => trim($medico->nombre . ' ' . $medico->apellido),
                'especialidad'       => $medico->especialidad ?? 'General',
                'telefono_contacto'  => $medico->telefono_contacto,
                'direccion_detalles' => $medico->direccion_detalles,
                'horario_atencion'   => $medico->horario_atencion,
                'geolocalizacion'    => $medico->geolocalizacion,
                'tipo_documento'     => $medico->tipoDocumento
                    ? ['nombre' => $medico->tipoDocumento->nombre]
                    : null,
            ],
            'productosAlertas' => $productosAlertas,
            'mesActual'        => $mesFiltroStr,
            'puestoReal'       => $puestoReal,
        ]);
    }
}