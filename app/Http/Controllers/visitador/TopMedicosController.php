<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\Transaccion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TopMedicosController extends Controller
{
    public function index(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('dashboard')->with('error', 'Visitador no encontrado.');
        }

        $metaActiva = \App\Models\Meta::where('visitador_id', $visitador->id)
            ->orderByDesc('fecha_meta')
            ->first();

        $mesDefault = $metaActiva
            ? Carbon::parse($metaActiva->fecha_meta)->format('Y-m')
            : Carbon::now()->format('Y-m');

        $mes    = $request->input('mes', $mesDefault);
        $inicio = Carbon::parse($mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        $medicos         = $visitador->medicos()->get();
        $todosMedicosDoc = $medicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

        $topMedicos = collect();

        if ($todosMedicosDoc->isNotEmpty()) {

            $totalesPorMedico = DB::table('transacciones')
                ->select(
                    'medico_documento',
                    DB::raw('SUM(valor_comprado)  as total_comprado'),
                    DB::raw('SUM(valor_formulado) as total_formulado')
                )
                ->whereIn('medico_documento', $todosMedicosDoc)
                ->whereBetween('fecha', [$inicio->format('Y-m-d'), $fin->format('Y-m-d')])
                ->groupBy('medico_documento')
                ->get()
                ->keyBy('medico_documento');

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
                ->whereBetween('t.fecha', [$inicio->format('Y-m-d'), $fin->format('Y-m-d')])
                ->whereNotNull('t.producto_codigo')
                ->where('t.unidades_compradas', '>', 0)
                ->groupBy('t.medico_documento', 't.producto_codigo', 'p.nombre', 'p.laboratorio')
                ->orderBy('t.medico_documento')->orderByDesc('total_cantidad')
                ->get()->groupBy('medico_documento');

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
                ->whereBetween('t.fecha', [$inicio->format('Y-m-d'), $fin->format('Y-m-d')])
                ->whereNotNull('t.producto_codigo')
                ->where('t.unidades_formuladas', '>', 0)
                ->groupBy('t.medico_documento', 't.producto_codigo', 'p.nombre', 'p.laboratorio')
                ->orderBy('t.medico_documento')->orderByDesc('total_cantidad')
                ->get()->groupBy('medico_documento');

            $topMedicos = $totalesPorMedico->sortByDesc('total_comprado')
                ->map(function ($fila) use ($medicos, $productosMasComprados, $productosMasFormulados) {
                    $doc          = $fila->medico_documento;
                    $medicoModel  = $medicos->firstWhere('documento', $doc);
                    $topCompra    = $productosMasComprados->get($doc, collect())->first();
                    $topFormula   = $productosMasFormulados->get($doc, collect())->first();

                    return [
                        'documento'              => $doc,
                        'nombre'                 => $medicoModel ? $medicoModel->nombre . ' ' . $medicoModel->apellido : 'Médico No Registrado',
                        'especialidad'           => $medicoModel?->especialidad ?? 'General',
                        'total_comprado'         => (float) $fila->total_comprado,
                        'total_formulado'        => (float) $fila->total_formulado,
                        'producto_mas_comprado'  => $topCompra?->producto_nombre ?? $topCompra?->producto_codigo,
                        'producto_mas_formulado' => $topFormula?->producto_nombre ?? $topFormula?->producto_codigo,
                    ];
                })->values();
        }

        return Inertia::render('VISITADOR/TOPMEDICOS/TopMedicos', [
            'topMedicos' => $topMedicos,
            'mesActual'  => $mes,
        ]);
    }

    public function detalleTop(Request $request, string $documento)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->firstOrFail();
        $medico    = $visitador->medicos()->where('documento', $documento)->firstOrFail();

        $mes    = $request->input('mes', Carbon::now()->format('Y-m'));
        $inicio = Carbon::parse($mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        // Query base reutilizable
        $base = DB::table('transacciones as t')
            ->where('t.medico_documento', $medico->documento)
            ->whereBetween('t.fecha', [$inicio->format('Y-m-d'), $fin->format('Y-m-d')]);

        // ── Totales ──────────────────────────────────────────────────────────
        $totales = (clone $base)
            ->select(
                DB::raw('COALESCE(SUM(t.valor_comprado), 0)    as total_comprado'),
                DB::raw('COALESCE(SUM(t.valor_formulado), 0)   as total_formulado'),
                DB::raw('COALESCE(SUM(t.unidades_compradas), 0) as unidades_compradas'),
                DB::raw('COALESCE(SUM(t.unidades_formuladas), 0) as unidades_formuladas'),
                DB::raw('COUNT(*) as transacciones')
            )->first();

        // ── Productos comprados ───────────────────────────────────────────────
        $productosComprados = (clone $base)
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                't.producto_codigo                              as codigo',
                DB::raw('COALESCE(p.nombre, t.producto_codigo) as nombre'),
                DB::raw("COALESCE(p.laboratorio, '')           as laboratorio"),
                DB::raw('SUM(t.unidades_compradas)             as cantidad_comprada'),
                DB::raw('SUM(t.valor_comprado)                 as valor_comprado')
            )
            ->where('t.unidades_compradas', '>', 0)
            ->groupBy('t.producto_codigo', 'p.nombre', 'p.laboratorio')
            ->orderByDesc('cantidad_comprada')
            ->get();

        // ── Productos formulados ──────────────────────────────────────────────
        $productosFormulados = (clone $base)
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                't.producto_codigo                              as codigo',
                DB::raw('COALESCE(p.nombre, t.producto_codigo) as nombre'),
                DB::raw("COALESCE(p.laboratorio, '')           as laboratorio"),
                DB::raw('SUM(t.unidades_formuladas)            as cantidad_formulada'),
                DB::raw('SUM(t.valor_formulado)                as valor_formulado')
            )
            ->where('t.unidades_formuladas', '>', 0)
            ->groupBy('t.producto_codigo', 'p.nombre', 'p.laboratorio')
            ->orderByDesc('cantidad_formulada')
            ->get();

        // ── Laboratorios comprados ────────────────────────────────────────────
        $laboratoriosComprados = (clone $base)
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                DB::raw("COALESCE(p.laboratorio, 'Sin laboratorio') as laboratorio"),
                DB::raw('SUM(t.unidades_compradas)                  as cantidad_comprada'),
                DB::raw('SUM(t.valor_comprado)                      as valor_comprado'),
                DB::raw('COUNT(DISTINCT t.producto_codigo)          as productos')
            )
            ->where('t.unidades_compradas', '>', 0)
            ->groupBy('p.laboratorio')
            ->orderByDesc('cantidad_comprada')
            ->get();

        // ── Laboratorios formulados ───────────────────────────────────────────
        $laboratoriosFormulados = (clone $base)
            ->leftJoin('productos as p', 't.producto_codigo', '=', 'p.codigo')
            ->select(
                DB::raw("COALESCE(p.laboratorio, 'Sin laboratorio') as laboratorio"),
                DB::raw('SUM(t.unidades_formuladas)                 as cantidad_formulada'),
                DB::raw('SUM(t.valor_formulado)                     as valor_formulado'),
                DB::raw('COUNT(DISTINCT t.producto_codigo)          as productos')
            )
            ->where('t.unidades_formuladas', '>', 0)
            ->groupBy('p.laboratorio')
            ->orderByDesc('cantidad_formulada')
            ->get();

        // ── Puesto real del médico en el ranking según modo ──────────────────
        $vistaParam = $request->input('vista', 'general');

        $todosLosDocs = $visitador->medicos()->pluck('documento')->filter()->unique()->map(fn($d) => (string)$d)->values();

        $rankingGlobal = DB::table('transacciones')
            ->select(
                'medico_documento',
                DB::raw('SUM(valor_comprado)  as total_comprado'),
                DB::raw('SUM(valor_formulado) as total_formulado')
            )
            ->whereIn('medico_documento', $todosLosDocs)
            ->whereBetween('fecha', [$inicio->format('Y-m-d'), $fin->format('Y-m-d')])
            ->groupBy('medico_documento')
            ->get()
            ->map(fn($r) => [
                'documento' => $r->medico_documento,
                'suma'      => match($vistaParam) {
                    'compradores'  => (float)$r->total_comprado,
                    'formuladores' => (float)$r->total_formulado,
                    default        => (float)$r->total_comprado + (float)$r->total_formulado,
                },
            ])
            ->sortByDesc('suma')
            ->values();

       $puestoReal = $rankingGlobal->search(fn($r) => (string)$r['documento'] === (string)$medico->documento);
        $puestoReal = $puestoReal !== false ? $puestoReal + 1 : null;

        return Inertia::render('VISITADOR/TOPMEDICOS/DetallesTop', [
            'medico' => [
                'id'          => $medico->id,
                'documento'   => $medico->documento,
                'nombre'      => trim($medico->nombre . ' ' . $medico->apellido),
                'especialidad'=> $medico->especialidad ?? 'General',
            ],
            'mesActual'              => $mes,
            'totales'                => [
                'total_comprado'      => (float) ($totales->total_comprado      ?? 0),
                'total_formulado'     => (float) ($totales->total_formulado     ?? 0),
                'unidades_compradas'  => (int)   ($totales->unidades_compradas  ?? 0),
                'unidades_formuladas' => (int)   ($totales->unidades_formuladas ?? 0),
                'transacciones'       => (int)   ($totales->transacciones       ?? 0),
            ],
            'productosComprados'     => $productosComprados,
            'productosFormulados'    => $productosFormulados,
            'laboratoriosComprados'  => $laboratoriosComprados,
            'laboratoriosFormulados' => $laboratoriosFormulados,
            'vistaAnterior'          => $vistaParam,
            'limitAnterior'          => (int) $request->input('limit',  10),
            'searchAnterior'         => $request->input('search', ''),
            'puestoReal'             => $puestoReal,
        ]);
    }
}