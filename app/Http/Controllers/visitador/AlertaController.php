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
        // 1. Obtener visitador logueado
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('panel')->with('error', 'Visitador no encontrado.');
        }

        // 2. Obtener mes del filtro (por defecto el actual)
        $mesStr = $request->input('mes', Carbon::now()->format('Y-m'));
        $mesActualInicio = Carbon::parse($mesStr . '-01')->startOfMonth();
        $mesActualFin = $mesActualInicio->copy()->endOfMonth();

        $mesAnteriorInicio = $mesActualInicio->copy()->subMonth()->startOfMonth();
        $mesAnteriorFin = $mesAnteriorInicio->copy()->endOfMonth();

        // 3. Obtener médicos asignados
        $medicos = $visitador->medicos()->get();
        $todosMedicosDoc = $medicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

        $medicosAlertas = [];

        if ($todosMedicosDoc->isNotEmpty()) {
            // 4. Consultar transacciones de los últimos 2 meses para estos médicos
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
                ->whereBetween('t.fecha', [$mesAnteriorInicio->format('Y-m-d'), $mesActualFin->format('Y-m-d')])
                ->get();

            // 5. Agrupar datos en PHP
            $datosPorMedico = [];

            foreach ($medicos as $medico) {
                $doc = (string) $medico->documento;
                $datosPorMedico[$doc] = [
                    'documento'    => $doc,
                    'nombre'       => trim($medico->nombre . ' ' . $medico->apellido),
                    'especialidad' => $medico->especialidad ?? 'General',
                    'totales'      => [
                        'formulado_mes_anterior' => 0,
                        'formulado_mes_actual'   => 0,
                        'formulado_diferencia'   => 0,
                        'formulado_tendencia'    => 'igual',
                        'comprado_mes_anterior'  => 0,
                        'comprado_mes_actual'    => 0,
                        'comprado_diferencia'    => 0,
                        'comprado_tendencia'     => 'igual',
                    ],
                    'productos'    => []
                ];
            }

            foreach ($transacciones as $t) {
                $doc = (string) $t->medico_documento;
                if (!isset($datosPorMedico[$doc])) {
                    continue;
                }

                $prodCod = $t->producto_codigo ?? 'SIN_CODIGO';
                $prodNombre = $t->producto_nombre ?? ('Producto ' . $prodCod);
                $prodLab = $t->producto_laboratorio ?? 'Sin Laboratorio';

                $fecha = Carbon::parse($t->fecha);
                $esMesActual = $fecha->between($mesActualInicio, $mesActualFin);
                $esMesAnterior = $fecha->between($mesAnteriorInicio, $mesAnteriorFin);

                $compradas = (int) ($t->unidades_compradas ?? 0);
                $formuladas = (int) ($t->unidades_formuladas ?? 0);

                if ($esMesActual) {
                    $datosPorMedico[$doc]['totales']['comprado_mes_actual'] += $compradas;
                    $datosPorMedico[$doc]['totales']['formulado_mes_actual'] += $formuladas;
                } elseif ($esMesAnterior) {
                    $datosPorMedico[$doc]['totales']['comprado_mes_anterior'] += $compradas;
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
                    $datosPorMedico[$doc]['productos'][$prodCod]['comprado_mes_actual'] += $compradas;
                    $datosPorMedico[$doc]['productos'][$prodCod]['formulado_mes_actual'] += $formuladas;
                } elseif ($esMesAnterior) {
                    $datosPorMedico[$doc]['productos'][$prodCod]['comprado_mes_anterior'] += $compradas;
                    $datosPorMedico[$doc]['productos'][$prodCod]['formulado_mes_anterior'] += $formuladas;
                }
            }

            // 6. Calcular diferencias, tendencias y aplanar productos
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

                    if (
                        $pInfo['formulado_mes_anterior'] > 0 ||
                        $pInfo['formulado_mes_actual'] > 0 ||
                        $pInfo['comprado_mes_anterior'] > 0 ||
                        $pInfo['comprado_mes_actual'] > 0
                    ) {
                        $prods[] = $pInfo;
                    }
                }

                $info['productos'] = $prods;
            }
            unset($info);

            $medicosAlertas = array_values($datosPorMedico);

            // Ordenar médicos por peor desempeño primero (menor diferencia sumada)
            usort($medicosAlertas, function ($a, $b) {
                $diffA = $a['totales']['formulado_diferencia'] + $a['totales']['comprado_diferencia'];
                $diffB = $b['totales']['formulado_diferencia'] + $b['totales']['comprado_diferencia'];
                return $diffA <=> $diffB;
            });
        }

        return Inertia::render('VISITADOR/ALERTAS/Alerta', [
            'medicosAlertas' => $medicosAlertas,
            'mesActual'      => $mesStr,
        ]);
    }

    public function detalle(Request $request, string $documento)
    {
        // 1. Obtener visitador logueado
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('panel')->with('error', 'Visitador no encontrado.');
        }

        // 2. Obtener médico por documento
        $medico = $visitador->medicos()->where('documento', $documento)->firstOrFail();

        // 3. Obtener mes del filtro (por defecto el actual)
        $mesStr = $request->input('mes', Carbon::now()->format('Y-m'));
        $mesActualInicio = Carbon::parse($mesStr . '-01')->startOfMonth();
        $mesActualFin = $mesActualInicio->copy()->endOfMonth();

        $mesAnteriorInicio = $mesActualInicio->copy()->subMonth()->startOfMonth();
        $mesAnteriorFin = $mesAnteriorInicio->copy()->endOfMonth();

        // 4. Consultar transacciones de los últimos 2 meses para este médico y sus productos
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
            ->whereBetween('t.fecha', [$mesAnteriorInicio->format('Y-m-d'), $mesActualFin->format('Y-m-d')])
            ->get();

        // 5. Agrupar productos
        $productosMap = [];

        foreach ($transacciones as $t) {
            $prodCod = $t->producto_codigo ?? 'SIN_CODIGO';
            $prodNombre = $t->producto_nombre ?? ('Producto ' . $prodCod);
            $prodLab = $t->producto_laboratorio ?? 'Sin Laboratorio';

            $fecha = Carbon::parse($t->fecha);
            $esMesActual = $fecha->between($mesActualInicio, $mesActualFin);
            $esMesAnterior = $fecha->between($mesAnteriorInicio, $mesAnteriorFin);

            $compradas = (int) ($t->unidades_compradas ?? 0);
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
                $productosMap[$prodCod]['comprado_mes_actual'] += $compradas;
                $productosMap[$prodCod]['formulado_mes_actual'] += $formuladas;
            } elseif ($esMesAnterior) {
                $productosMap[$prodCod]['comprado_mes_anterior'] += $compradas;
                $productosMap[$prodCod]['formulado_mes_anterior'] += $formuladas;
            }
        }

        // 6. Calcular diferencias, tendencias y filtrar/ordenar
        $productosAlertas = [];
        foreach ($productosMap as $prodCod => $pInfo) {
            $pInfo['formulado_diferencia'] = $pInfo['formulado_mes_actual'] - $pInfo['formulado_mes_anterior'];
            $pInfo['formulado_tendencia']  = $pInfo['formulado_diferencia'] > 0 ? 'subio' : ($pInfo['formulado_diferencia'] < 0 ? 'bajo' : 'igual');

            $pInfo['comprado_diferencia']  = $pInfo['comprado_mes_actual'] - $pInfo['comprado_mes_anterior'];
            $pInfo['comprado_tendencia']   = $pInfo['comprado_diferencia'] > 0 ? 'subio' : ($pInfo['comprado_diferencia'] < 0 ? 'bajo' : 'igual');

            if (
                $pInfo['formulado_mes_anterior'] > 0 ||
                $pInfo['formulado_mes_actual'] > 0 ||
                $pInfo['comprado_mes_anterior'] > 0 ||
                $pInfo['comprado_mes_actual'] > 0
            ) {
                $productosAlertas[] = $pInfo;
            }
        }

        // Ordenar productos por peor desempeño primero (menor diferencia sumada)
        usort($productosAlertas, function ($a, $b) {
            $diffA = $a['formulado_diferencia'] + $a['comprado_diferencia'];
            $diffB = $b['formulado_diferencia'] + $b['comprado_diferencia'];
            return $diffA <=> $diffB;
        });

        return Inertia::render('VISITADOR/ALERTAS/ProductosAlerta', [
            'medico'           => [
                'documento'    => $medico->documento,
                'nombre'       => trim($medico->nombre . ' ' . $medico->apellido),
                'especialidad' => $medico->especialidad ?? 'General',
            ],
            'productosAlertas' => $productosAlertas,
            'mesActual'        => $mesStr,
        ]);
    }
}
