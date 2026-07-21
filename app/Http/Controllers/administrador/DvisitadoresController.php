<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\User;
use App\Models\TipoDocumento;
use App\Models\Zona;
use Illuminate\Http\Request;
use App\Services\OdooService;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DvisitadoresController extends Controller
{
    private OdooService $odooService;

    public function __construct(OdooService $odooService)
    {
        $this->odooService = $odooService;
    }

    public function index()
    {
        $visitadores = Visitador::with(['tipoDocumento', 'user', 'metas' => function ($query) {
            $query->latest('fecha_meta')->limit(1);
        }])->get();

        $usuariosOcupados = Visitador::pluck('usuario_id')->filter()->values();
        $usuariosLibres = User::whereNotIn('id', $usuariosOcupados)
            ->select('id', 'username')
            ->orderBy('username')
            ->get();

        return Inertia::render('ADMINISTRADOR/VISITADORES/Gvisitadores', [
            'visitadores'    => $visitadores,
            'tiposDocumento' => TipoDocumento::all(['id', 'codigo', 'nombre']),
            'usuariosLibres' => $usuariosLibres,
            'zonas'          => Zona::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function buscarUsuario($id)
    {
        $usuario = User::find($id);
        
        if ($usuario) {
            return response()->json([
                'success' => true,
                'nombre' => $usuario->username 
            ]);
        }

        return response()->json([
            'success' => false,
            'nombre' => null
        ], 404);
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'usuario_id' => 'required|exists:usuarios,id|unique:visitadores,usuario_id',
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento_id' => 'required|exists:tipo_documento,id',
            'documento' => 'required|string|unique:visitadores,documento',
            'zona_id' => 'required|exists:zonas,id',
            'estado' => 'required|in:Habilitado,Inhabilitado',
        ]);

        Visitador::create($datos);

        return Redirect::route('Gvisitadores.index')->with('message', 'Registrado con éxito');
    }

    public function update(Request $request, $id)
    {
        $visitador = Visitador::findOrFail($id);

        $datos = $request->validate([
            'usuario_id' => 'required|exists:usuarios,id|unique:visitadores,usuario_id,' . $visitador->id,
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento_id' => 'required|exists:tipo_documento,id',
            'documento' => 'required|string|unique:visitadores,documento,' . $visitador->id,
            'zona_id' => 'required|exists:zonas,id',
            'estado' => 'required|in:Habilitado,Inhabilitado',
        ]);

        $visitador->update($datos);

        return Redirect::back()->with('message', 'Registro actualizado');
    }

    public function toggleEstado($id)
    {
        $visitador = Visitador::findOrFail($id);
        $visitador->estado = $visitador->estado === 'Habilitado' ? 'Inhabilitado' : 'Habilitado';
        $visitador->save();

        return Redirect::back()->with('success', 'Estado actualizado.');
    }

    public function show($id, Request $request)
{
    $visitador = Visitador::with(['tipoDocumento', 'user'])->findOrFail($id);
    $mesParam   = $request->input('mes', Carbon::now()->format('Y-m'));
    $mesInicio  = Carbon::parse($mesParam . '-01')->startOfMonth();
    $mesFin     = $mesInicio->copy()->endOfMonth();

    // 1. KPIs de visitas locales del mes seleccionado
    $visitasStats = DB::table('visitas')
        ->where('visitador_id', $id)
        ->whereBetween('fecha_programada', [$mesInicio, $mesFin])
        ->select(
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN estado = 'efectiva'      THEN 1 ELSE 0 END) as efectivas"),
            DB::raw("SUM(CASE WHEN estado = 'programada'    THEN 1 ELSE 0 END) as programadas"),
            DB::raw("SUM(CASE WHEN estado = 'cancelada'     THEN 1 ELSE 0 END) as canceladas"),
            DB::raw("SUM(CASE WHEN estado = 'reprogramada'  THEN 1 ELSE 0 END) as reprogramadas"),
            DB::raw("SUM(CASE WHEN estado = 'No contactado' THEN 1 ELSE 0 END) as no_contactados")
        )->first();

    // 2. Documentos de todos los médicos asignados a este visitador
    $todosMedicosDoc = DB::table('medicos')
        ->where('visitador_id', $id)
        ->pluck('documento')
        ->filter()
        ->unique()
        ->values()
        ->all();

    $totalMedicosAsignados = count($todosMedicosDoc);

    // 3. Médicos asignados y sus visitas en el mes
    $medicos = DB::table('medicos')
        ->where('medicos.visitador_id', $id)
        ->leftJoin('visitas', function($join) use ($mesInicio, $mesFin) {
            $join->on('medicos.id', '=', 'visitas.medico_id')
                 ->whereBetween('visitas.fecha_programada', [$mesInicio, $mesFin]);
        })
        ->select(
            'medicos.id',
            'medicos.documento',
            'medicos.nombre as nombre',
            'medicos.especialidad',
            DB::raw('COUNT(visitas.id) as total_visitas'),
            DB::raw("SUM(CASE WHEN visitas.estado = 'efectiva' THEN 1 ELSE 0 END) as efectivas"),
            DB::raw('MAX(visitas.fecha_programada) as ultima_visita')
        )
        ->groupBy('medicos.id', 'medicos.documento', 'medicos.nombre', 'medicos.especialidad')
        ->orderByDesc('total_visitas')
        ->get();

    // 4. Placeholders de Odoo: se cargan aparte, de forma asíncrona, desde
    //    /Gvisitadores/{id}/odoo-stats (ver método odooStats abajo). Así el
    //    show() responde de inmediato solo con datos locales de la BD.
    $txStats = [
        'total_valor_comprado'  => 0,
        'total_valor_formulado' => 0,
        'total_unidades'        => 0,
        'total_transacciones'   => 0,
    ];
    $topProductos = [];
    $tendencia = [
        [
            'mes'             => $mesInicio->translatedFormat('M Y'),
            'valor_comprado'  => 0,
            'valor_formulado' => 0,
        ]
    ];

    // 5. Historial de visitas del mes seleccionado
    $visitas = DB::table('visitas')
        ->where('visitas.visitador_id', $id)
        ->whereBetween('visitas.fecha_programada', [$mesInicio, $mesFin])
        ->leftJoin('medicos', 'visitas.medico_id', '=', 'medicos.id')
        ->select(
            'visitas.id',
            'visitas.estado',
            'visitas.fecha_programada',
            'visitas.fecha_realizada',
            'visitas.comentarios',
            'medicos.nombre as nombre_medico',
            'medicos.especialidad'
        )
        ->orderByDesc('visitas.fecha_programada')
        ->take(20)->get();

    // 6. Meta y Progreso del mes seleccionado (la parte de $ se completa luego con Odoo)
    $metaActiva = DB::table('metas')
        ->where('visitador_id', $id)
        ->whereYear('fecha_meta',  $mesInicio->year)
        ->whereMonth('fecha_meta', $mesInicio->month)
        ->first();

    $visitasEfectivasMes = DB::table('visitas')
        ->where('visitador_id', $id)
        ->where('estado', 'efectiva')
        ->whereBetween('fecha_realizada', [$mesInicio, $mesFin])
        ->count();

    $progresoMeta = [
        'visitas_efectivas' => $visitasEfectivasMes,
        'valor_comprado'    => 0,
        'valor_formulado'   => 0,
        'valor_total'       => 0,
    ];

    return Inertia::render('ADMINISTRADOR/VISITADORES/VisitadorDetalle', [
        'visitador'             => $visitador,
        'visitasStats'          => $visitasStats,
        'medicos'               => $medicos,
        'totalMedicosAsignados' => $totalMedicosAsignados,
        'txStats'               => $txStats,
        'topProductos'          => $topProductos,
        'tendencia'             => $tendencia,
        'visitas'               => $visitas,
        'metaActiva'            => $metaActiva,
        'progresoMeta'          => $progresoMeta,
        'mesActual'             => $mesParam,
    ]);
}

    /**
     * Trae ÚNICAMENTE los datos de Odoo (comprado/formulado, top productos,
     * tendencia) de este visitador para el mes indicado. Se llama aparte
     * desde el frontend (no bloquea el show()) y se cachea 4 horas por
     * visitador+mes. Pasando ?forzar=1 se ignora la caché.
     */
    public function odooStats(Request $request, $id)
    {
        $mes    = $request->input('mes', Carbon::now()->format('Y-m'));
        $forzar = $request->boolean('forzar');

        $mesInicio = Carbon::parse($mes . '-01')->startOfMonth();
        $mesFin    = $mesInicio->copy()->endOfMonth();

        $cacheKey = "odoo_stats_visitador_{$id}_{$mes}";

        if ($forzar) {
            Cache::forget($cacheKey);
        }

        $yaEnCache = Cache::has($cacheKey);

        $payload = Cache::remember($cacheKey, now()->addHours(4), function () use ($id, $mesInicio, $mesFin) {
            $todosMedicosDoc = DB::table('medicos')
                ->where('visitador_id', $id)
                ->pluck('documento')
                ->filter()
                ->unique()
                ->values()
                ->all();

            $fechaDesde = $mesInicio->format('Y-m-d');
            $fechaHasta = $mesFin->format('Y-m-d');

            $resumenOdoo = $this->odooService->obtenerResumenAdmin($todosMedicosDoc, $fechaDesde, $fechaHasta);

            $valorComprado  = (float) ($resumenOdoo['total_valor_comprado'] ?? 0);
            $valorFormulado = (float) ($resumenOdoo['total_valor_formulado'] ?? 0);

            $txStats = [
                'total_valor_comprado'  => $valorComprado,
                'total_valor_formulado' => $valorFormulado,
                'total_unidades'        => $resumenOdoo['total_unidades_compradas'] ?? 0,
                'total_transacciones'   => $resumenOdoo['total_transacciones'] ?? 0,
            ];

            $topProductos = collect($resumenOdoo['productos'] ?? [])
                ->take(5)
                ->map(fn($p) => [
                    'nombre'         => $p['nombre'] ?? '',
                    'valor_comprado' => $p['valor_comprado'] ?? 0,
                    'unidades'       => $p['unidades'] ?? 0,
                ])->values()->toArray();

            $tendencia = array_values($resumenOdoo['tendencia'] ?? [
                [
                    'mes'             => $mesInicio->translatedFormat('M Y'),
                    'valor_comprado'  => $valorComprado,
                    'valor_formulado' => $valorFormulado,
                ]
            ]);

            return [
                'txStats'         => $txStats,
                'topProductos'    => $topProductos,
                'tendencia'       => $tendencia,
                'valor_comprado'  => $valorComprado,
                'valor_formulado' => $valorFormulado,
                'valor_total'     => $valorComprado + $valorFormulado,
                'actualizado_en'  => now()->toIso8601String(),
            ];
        });

        return response()->json($payload + ['desde_cache' => $yaEnCache]);
    }
}