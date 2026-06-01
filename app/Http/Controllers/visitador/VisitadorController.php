<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico;
use App\Models\Visita;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VisitadorController extends Controller
{

    public function index(Request $request)
    {
        $visitador = Visitador::with(['tipoDocumento'])
            ->where('usuario_id', Auth::id())
            ->first();

        // ✅ Busca la meta más reciente/activa del visitador
        $metaActiva = $visitador
            ? \App\Models\Meta::where('visitador_id', $visitador->id)
                ->orderByDesc('fecha_meta')
                ->first()
            : null;

        // ✅ Si tiene meta activa usa ese mes, si no usa el mes actual
        $mes    = $metaActiva
            ? Carbon::parse($metaActiva->fecha_meta)->format('Y-m')
            : Carbon::now()->format('Y-m');

        $inicio = Carbon::parse($mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        // Recarga el visitador con la meta del mes correcto
        if ($visitador) {
            $visitador->load(['metas' => function ($query) use ($inicio) {
                $query->whereYear('fecha_meta', $inicio->year)
                      ->whereMonth('fecha_meta', $inicio->month)
                      ->limit(1);
            }]);
        }

        $medicos = $visitador ? $visitador->medicos()->get() : collect();

        // 1️⃣ Visitas del mes actual
        $visitas = $visitador
            ? Visita::where('visitador_id', $visitador->id)
                ->whereYear('fecha_programada', $inicio->year)
                ->whereMonth('fecha_programada', $inicio->month)
                ->get()
            : collect();

        // 2️⃣ Visitas pendientes sin límite de mes
        $visitasPendientes = $visitador
            ? Visita::where('visitador_id', $visitador->id)
                ->where('estado', 'programada')
                ->orderBy('fecha_programada', 'asc')
                ->get()
            : collect();

        $todosMedicosDoc = $medicos->pluck('documento')
            ->filter()
            ->unique()
            ->map(fn($d) => (string) $d)
            ->values();

        // 3️⃣ Ventas totales del mes
        $ventasActuales = $todosMedicosDoc->isNotEmpty()
            ? DB::table('transacciones')
                ->whereIn('medico_documento', $todosMedicosDoc)
                ->whereYear('fecha', $inicio->year)
                ->whereMonth('fecha', $inicio->month)
                ->sum('valor_comprado')
            : 0;

        // 4️⃣ Top Médicos: comprado + formulado + producto más comprado + producto más formulado
        $topMedicos = collect();

        if ($todosMedicosDoc->isNotEmpty()) {

            // ── Totales por médico (comprado + formulado) ──────────────────────────
            $totalesPorMedico = DB::table('transacciones')
                ->select(
                    'medico_documento',
                    DB::raw('SUM(valor_comprado)  as total_comprado'),
                    DB::raw('SUM(valor_formulado) as total_formulado')   // ← columna real en tu tabla
                )
                ->whereIn('medico_documento', $todosMedicosDoc)
                ->whereYear('fecha',  $inicio->year)
                ->whereMonth('fecha', $inicio->month)
                ->groupBy('medico_documento')
                ->get()
                ->keyBy('medico_documento');

            // ── Producto más comprado por médico (por unidades_compradas) ────────────
            $productosMasComprados = DB::table('transacciones as t')
                ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
                ->select(
                    't.medico_documento',
                    't.producto_codigo',
                    'p.nombre as producto_nombre',
                    'p.laboratorio as producto_laboratorio',
                    DB::raw('SUM(t.unidades_compradas) as total_cantidad')
                )
                ->whereIn('t.medico_documento', $todosMedicosDoc)
                ->whereYear('t.fecha',  $inicio->year)
                ->whereMonth('t.fecha', $inicio->month)
                ->whereNotNull('t.producto_codigo')
                ->where('t.unidades_compradas', '>', 0)
                ->groupBy('t.medico_documento', 't.producto_codigo', 'p.nombre', 'p.laboratorio')
                ->orderBy('t.medico_documento')
                ->orderByDesc('total_cantidad')
                ->get()
                ->groupBy('medico_documento');

            // ── Producto más formulado por médico (por unidades_formuladas) ───────────
            $productosMasFormulados = DB::table('transacciones as t')
                ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
                ->select(
                    't.medico_documento',
                    't.producto_codigo',
                    'p.nombre as producto_nombre',
                    'p.laboratorio as producto_laboratorio',
                    DB::raw('SUM(t.unidades_formuladas) as total_cantidad')
                )
                ->whereIn('t.medico_documento', $todosMedicosDoc)
                ->whereYear('t.fecha',  $inicio->year)
                ->whereMonth('t.fecha', $inicio->month)
                ->whereNotNull('t.producto_codigo')
                ->where('t.unidades_formuladas', '>', 0)
                ->groupBy('t.medico_documento', 't.producto_codigo', 'p.nombre', 'p.laboratorio')
                ->orderBy('t.medico_documento')
                ->orderByDesc('total_cantidad')
                ->get()
                ->groupBy('medico_documento');

            $laboratoriosMasComprados = DB::table('transacciones as t')
                ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
                ->select(
                    't.medico_documento',
                    DB::raw("COALESCE(NULLIF(p.laboratorio, ''), 'Sin laboratorio') as laboratorio"),
                    DB::raw('SUM(t.unidades_compradas) as total_cantidad'),
                    DB::raw('COUNT(DISTINCT t.producto_codigo) as total_productos')
                )
                ->whereIn('t.medico_documento', $todosMedicosDoc)
                ->whereYear('t.fecha',  $inicio->year)
                ->whereMonth('t.fecha', $inicio->month)
                ->whereNotNull('t.producto_codigo')
                ->where('t.unidades_compradas', '>', 0)
                ->groupBy('t.medico_documento', 'laboratorio')
                ->orderBy('t.medico_documento')
                ->orderByDesc('total_cantidad')
                ->get()
                ->groupBy('medico_documento')
                ->map(fn($rows) => $rows->first());

            $laboratoriosMasFormulados = DB::table('transacciones as t')
                ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
                ->select(
                    't.medico_documento',
                    DB::raw("COALESCE(NULLIF(p.laboratorio, ''), 'Sin laboratorio') as laboratorio"),
                    DB::raw('SUM(t.unidades_formuladas) as total_cantidad'),
                    DB::raw('COUNT(DISTINCT t.producto_codigo) as total_productos')
                )
                ->whereIn('t.medico_documento', $todosMedicosDoc)
                ->whereYear('t.fecha',  $inicio->year)
                ->whereMonth('t.fecha', $inicio->month)
                ->whereNotNull('t.producto_codigo')
                ->where('t.unidades_formuladas', '>', 0)
                ->groupBy('t.medico_documento', 'laboratorio')
                ->orderBy('t.medico_documento')
                ->orderByDesc('total_cantidad')
                ->get()
                ->groupBy('medico_documento')
                ->map(fn($rows) => $rows->first());

            // ── Armar el array final ───────────────────────────────────────────────
            $topMedicos = $totalesPorMedico
                ->sortByDesc('total_comprado')
                ->map(function ($fila) use (
                    $medicos,
                    $productosMasComprados,
                    $productosMasFormulados,
                    $laboratoriosMasComprados,
                    $laboratoriosMasFormulados
                ) {

                    $doc         = $fila->medico_documento;
                    $medicoModel = $medicos->firstWhere('documento', $doc);

                    $productosCompra  = $productosMasComprados->get($doc, collect())->values();
                    $productosFormula = $productosMasFormulados->get($doc, collect())->values();
                    $topCompra  = $productosCompra->first();
                    $topFormula = $productosFormula->first();
                    $topLabCompra  = $laboratoriosMasComprados->get($doc);
                    $topLabFormula = $laboratoriosMasFormulados->get($doc);

                    return [
                        'documento'              => $doc,
                        'nombre'                 => $medicoModel
                                                       ? $medicoModel->nombre . ' ' . $medicoModel->apellido
                                                       : 'Médico No Registrado',
                        'especialidad'           => $medicoModel?->especialidad ?? 'General',

                        'total_comprado'         => (float) $fila->total_comprado,
                        'total_formulado'        => (float) $fila->total_formulado,

                        // Producto top comprado (código del producto)
                        'producto_mas_comprado'              => $topCompra?->producto_nombre ?? $topCompra?->producto_codigo,
                        'producto_mas_comprado_codigo'       => $topCompra?->producto_codigo,
                        'producto_mas_comprado_laboratorio'  => $topCompra?->producto_laboratorio,
                        'cantidad_mas_comprado'  => $topCompra ? (int) $topCompra->total_cantidad : null,

                        // Producto top formulado (código del producto)
                        'producto_mas_formulado'             => $topFormula?->producto_nombre ?? $topFormula?->producto_codigo,
                        'producto_mas_formulado_codigo'      => $topFormula?->producto_codigo,
                        'producto_mas_formulado_laboratorio' => $topFormula?->producto_laboratorio,
                        'cantidad_mas_formulado' => $topFormula ? (int) $topFormula->total_cantidad : null,

                        'laboratorio_mas_comprado'            => $topLabCompra?->laboratorio,
                        'cantidad_laboratorio_mas_comprado'   => $topLabCompra ? (int) $topLabCompra->total_cantidad : null,
                        'productos_laboratorio_mas_comprado'  => $topLabCompra ? (int) $topLabCompra->total_productos : null,
                        'laboratorio_mas_formulado'           => $topLabFormula?->laboratorio,
                        'cantidad_laboratorio_mas_formulado'  => $topLabFormula ? (int) $topLabFormula->total_cantidad : null,
                        'productos_laboratorio_mas_formulado' => $topLabFormula ? (int) $topLabFormula->total_productos : null,

                        'top_productos_comprados' => $productosCompra
                            ->map(fn($producto) => [
                                'nombre'      => $producto->producto_nombre ?? $producto->producto_codigo,
                                'codigo'      => $producto->producto_codigo,
                                'laboratorio' => $producto->producto_laboratorio,
                                'cantidad'    => (int) $producto->total_cantidad,
                            ])
                            ->values(),
                        'top_productos_formulados' => $productosFormula
                            ->map(fn($producto) => [
                                'nombre'      => $producto->producto_nombre ?? $producto->producto_codigo,
                                'codigo'      => $producto->producto_codigo,
                                'laboratorio' => $producto->producto_laboratorio,
                                'cantidad'    => (int) $producto->total_cantidad,
                            ])
                            ->values(),
                    ];
                })
                ->values();
        }

        return Inertia::render('VISITADOR/PANEL/panel', [
            'visitador'         => $visitador,
            'medicos'           => $medicos,
            'visitasData'       => $visitas,
            'visitasPendientes' => $visitasPendientes,
            'topMedicos'        => $topMedicos,
            'ventasActuales'    => (float) $ventasActuales,
            'mesActual'         => $mes,
        ]);
    }

    public function detalleTop(Request $request, string $documento)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->firstOrFail();

        $medico = $visitador->medicos()
            ->where('documento', $documento)
            ->firstOrFail();

        $metaActiva = \App\Models\Meta::where('visitador_id', $visitador->id)
            ->orderByDesc('fecha_meta')
            ->first();

        $mes = $request->input('mes')
            ?: ($metaActiva ? Carbon::parse($metaActiva->fecha_meta)->format('Y-m') : Carbon::now()->format('Y-m'));

        $inicio = Carbon::parse($mes . '-01')->startOfMonth();

        $base = DB::table('transacciones as t')
            ->where('t.medico_documento', $medico->documento)
            ->whereYear('t.fecha', $inicio->year)
            ->whereMonth('t.fecha', $inicio->month);

        $totales = (clone $base)
            ->select(
                DB::raw('COALESCE(SUM(t.valor_comprado), 0) as total_comprado'),
                DB::raw('COALESCE(SUM(t.valor_formulado), 0) as total_formulado'),
                DB::raw('COALESCE(SUM(t.unidades_compradas), 0) as unidades_compradas'),
                DB::raw('COALESCE(SUM(t.unidades_formuladas), 0) as unidades_formuladas'),
                DB::raw('COUNT(*) as transacciones')
            )
            ->first();

        $productosComprados = (clone $base)
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                't.producto_codigo as codigo',
                DB::raw('COALESCE(p.nombre, t.producto_codigo) as nombre'),
                DB::raw("COALESCE(NULLIF(p.laboratorio, ''), 'Sin laboratorio') as laboratorio"),
                DB::raw('SUM(t.unidades_compradas) as cantidad'),
                DB::raw('SUM(t.valor_comprado) as valor')
            )
            ->whereNotNull('t.producto_codigo')
            ->where('t.unidades_compradas', '>', 0)
            ->groupBy('t.producto_codigo', 'p.nombre', 'p.laboratorio')
            ->orderByDesc('cantidad')
            ->get();

        $productosFormulados = (clone $base)
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                't.producto_codigo as codigo',
                DB::raw('COALESCE(p.nombre, t.producto_codigo) as nombre'),
                DB::raw("COALESCE(NULLIF(p.laboratorio, ''), 'Sin laboratorio') as laboratorio"),
                DB::raw('SUM(t.unidades_formuladas) as cantidad'),
                DB::raw('SUM(t.valor_formulado) as valor')
            )
            ->whereNotNull('t.producto_codigo')
            ->where('t.unidades_formuladas', '>', 0)
            ->groupBy('t.producto_codigo', 'p.nombre', 'p.laboratorio')
            ->orderByDesc('cantidad')
            ->get();

        $laboratoriosComprados = (clone $base)
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                DB::raw("COALESCE(NULLIF(p.laboratorio, ''), 'Sin laboratorio') as laboratorio"),
                DB::raw('SUM(t.unidades_compradas) as cantidad'),
                DB::raw('SUM(t.valor_comprado) as valor'),
                DB::raw('COUNT(DISTINCT t.producto_codigo) as productos')
            )
            ->whereNotNull('t.producto_codigo')
            ->where('t.unidades_compradas', '>', 0)
            ->groupBy('laboratorio')
            ->orderByDesc('cantidad')
            ->get();

        $laboratoriosFormulados = (clone $base)
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                DB::raw("COALESCE(NULLIF(p.laboratorio, ''), 'Sin laboratorio') as laboratorio"),
                DB::raw('SUM(t.unidades_formuladas) as cantidad'),
                DB::raw('SUM(t.valor_formulado) as valor'),
                DB::raw('COUNT(DISTINCT t.producto_codigo) as productos')
            )
            ->whereNotNull('t.producto_codigo')
            ->where('t.unidades_formuladas', '>', 0)
            ->groupBy('laboratorio')
            ->orderByDesc('cantidad')
            ->get();

        return Inertia::render('VISITADOR/PANEL/DetallesTop', [
            'medico' => [
                'id'           => $medico->id,
                'documento'    => $medico->documento,
                'nombre'       => trim($medico->nombre . ' ' . $medico->apellido),
                'especialidad' => $medico->especialidad ?? 'General',
            ],
            'mesActual' => $mes,
            'totales' => [
                'total_comprado'      => (float) ($totales->total_comprado ?? 0),
                'total_formulado'     => (float) ($totales->total_formulado ?? 0),
                'unidades_compradas'  => (int) ($totales->unidades_compradas ?? 0),
                'unidades_formuladas' => (int) ($totales->unidades_formuladas ?? 0),
                'transacciones'       => (int) ($totales->transacciones ?? 0),
            ],
            'productosComprados'     => $productosComprados,
            'productosFormulados'    => $productosFormulados,
            'laboratoriosComprados'  => $laboratoriosComprados,
            'laboratoriosFormulados' => $laboratoriosFormulados,
        ]);
    }
}
