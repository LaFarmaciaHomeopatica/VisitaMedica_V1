<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Meta;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Services\OdooService; // 👈 1. Importamos el servicio de Odoo

class MetasController extends Controller
{
    private OdooService $odooService; // 👈 2. Propiedad privada para el servicio

    // 👈 3. Inyección de dependencia en el constructor
    public function __construct(OdooService $odooService)
    {
        $this->odooService = $odooService;
    }

    public function index(Request $request)
{
    // Aumentar el tiempo límite de PHP para la petición por seguridad
    set_time_limit(120);

    // 1. Manejo del mes e intervalos de fecha
    $mes    = $request->input('mes', Carbon::now()->format('Y-m'));
    $inicio = Carbon::parse($mes . '-01')->startOfMonth();
    $fin    = $inicio->copy()->endOfMonth();

    $fechaDesde = $inicio->format('Y-m-d');
    $fechaHasta = $fin->format('Y-m-d');

    // 2. Traer visitadores y buscar la meta correspondiente al mes en la BD local
$visitadores = Visitador::with(['user'])->get()->map(function ($v) use ($inicio) {
    // Consulta directa y segura de la meta del visitador para el mes seleccionado
    $meta = Meta::where('visitador_id', $v->id)
        ->whereYear('fecha_meta', $inicio->year)
        ->whereMonth('fecha_meta', $inicio->month)
        ->first();

    return [
        'id'       => $v->id,
        'nombre'   => $v->nombre,
        'apellido' => $v->apellido,
        'zona_id'  => $v->zona_id,
        'estado'   => $v->estado,
        'meta'     => $meta ? [
            'id'           => $meta->id,
            'meta_visitas' => $meta->meta_visitas,
            'meta_dinero'  => $meta->meta_dinero,
        ] : null,
    ];
});

    // 3. Visitas efectivas por visitador en el mes (Consulta agrupada rápida)
    $visitasEfectivas = DB::table('visitas')
        ->where('estado', 'efectiva')
        ->whereYear('fecha_realizada', $inicio->year)
        ->whereMonth('fecha_realizada', $inicio->month)
        ->select('visitador_id', DB::raw('COUNT(*) as visitas_efectivas'))
        ->groupBy('visitador_id')
        ->pluck('visitas_efectivas', 'visitador_id');
// 4. Mapear estructura de progreso individual para React (SOLO datos locales)
        //    Los valores de Odoo (valor_comprado / valor_formulado) se dejan en 0 y se
        //    cargan después, uno por uno, desde el frontend vía /Gmetas/odoo-stats/{visitador}
        $progreso = $visitadores->mapWithKeys(function ($v) use ($visitasEfectivas) {
            return [
                $v['id'] => (object)[
                    'id'                => $v['id'],
                    'visitas_efectivas' => $visitasEfectivas[$v['id']] ?? 0,
                    'valor_comprado'    => 0,
                    'valor_formulado'   => 0,
                ]
            ];
        });

    // 5. Obtener meses que ya tienen metas
    $mesesConMetas = DB::table('metas')
        ->select(DB::raw("DATE_FORMAT(fecha_meta, '%Y-%m') as mes"))
        ->groupBy('mes')
        ->orderByDesc('mes')
        ->pluck('mes');

    // 6. Retornar a Inertia React
    return Inertia::render('ADMINISTRADOR/METAS/Gmetas', [
        'visitadores'   => $visitadores,
        'progreso'      => $progreso,
        'mesActual'     => $mes,
        'mesesConMetas' => $mesesConMetas,
    ]);
}

    /**
     * Devuelve las ventas de Odoo (comprado / formulado) de UN solo visitador
     * para el mes indicado. Pensado para ser llamado uno por uno desde el
     * frontend (no en el index()) y así evitar que la carga de la página
     * se demore esperando a todos los visitadores.
     *
     * El resultado se cachea 4 horas por visitador+mes para no golpear Odoo
     * en cada visita a la pantalla. Pasando ?forzar=1 se ignora/limpia la
     * caché y se vuelve a consultar Odoo (botón "Actualizar" en el front).
     */
    public function odooStats(Request $request, $visitadorId)
    {
        $mes    = $request->input('mes', Carbon::now()->format('Y-m'));
        $forzar = $request->boolean('forzar');

        $cacheKey = "odoo_stats_meta_{$visitadorId}_{$mes}";

        if ($forzar) {
            Cache::forget($cacheKey);
        }

        $yaEnCache = Cache::has($cacheKey);

        $payload = Cache::remember($cacheKey, now()->addHours(4), function () use ($visitadorId, $mes) {
            $inicio = Carbon::parse($mes . '-01')->startOfMonth();
            $fin    = $inicio->copy()->endOfMonth();

            $fechaDesde = $inicio->format('Y-m-d');
            $fechaHasta = $fin->format('Y-m-d');

            $documentos = DB::table('medicos')
                ->where('visitador_id', $visitadorId)
                ->whereNotNull('documento')
                ->where('documento', '!=', '')
                ->pluck('documento')
                ->filter()
                ->unique()
                ->values()
                ->all();

            $valorComprado  = 0;
            $valorFormulado = 0;

            if (!empty($documentos)) {
                $resumenOdoo = $this->odooService->obtenerResumenAdmin($documentos, $fechaDesde, $fechaHasta);
                $valorComprado  = (float) ($resumenOdoo['total_valor_comprado'] ?? 0);
                $valorFormulado = (float) ($resumenOdoo['total_valor_formulado'] ?? 0);
            }

            return [
                'visitador_id'    => (int) $visitadorId,
                'valor_comprado'  => $valorComprado,
                'valor_formulado' => $valorFormulado,
                'actualizado_en'  => now()->toIso8601String(),
            ];
        });

        return response()->json($payload + ['desde_cache' => $yaEnCache]);
    }

    public function upsert(Request $request)
    {
        $request->validate([
            'visitador_id'  => 'required|exists:visitadores,id',
            'mes'           => 'required|date_format:Y-m',
            'meta_visitas'  => 'nullable|integer|min:0',
            'meta_dinero'   => 'nullable|numeric|min:0',
        ]);

        $inicio = Carbon::parse($request->mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        Meta::updateOrCreate(
            [
                'visitador_id' => $request->visitador_id,
                'fecha_meta'   => $inicio->format('Y-m-d'),
            ],
            [
                'meta_visitas'   => $request->input('meta_visitas', 0),
                'meta_dinero'    => $request->input('meta_dinero', 0),
                'fecha_fin_meta' => $fin->format('Y-m-d'),
            ]
        );

        return back()->with('message', 'Meta guardada');
    }

    public function masivo(Request $request)
    {
        $request->validate([
            'mes'          => 'required|date_format:Y-m',
            'meta_visitas' => 'nullable|integer|min:0',
            'meta_dinero'  => 'nullable|numeric|min:0',
        ]);

        $inicio = Carbon::parse($request->mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        foreach (Visitador::all('id') as $v) {
            Meta::updateOrCreate(
                [
                    'visitador_id' => $v->id,
                    'fecha_meta'   => $inicio->format('Y-m-d'),
                ],
                [
                    'meta_visitas'   => $request->input('meta_visitas', 0),
                    'meta_dinero'    => $request->input('meta_dinero', 0),
                    'fecha_fin_meta' => $fin->format('Y-m-d'),
                ]
            );
        }

        return back()->with('message', 'Metas masivas aplicadas');
    }

    public function destroy($id)
    {
        Meta::findOrFail($id)->delete();
        return back()->with('message', 'Meta eliminada');
    }
}