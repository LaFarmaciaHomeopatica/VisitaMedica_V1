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
use Illuminate\Support\Facades\Cache; // 👈 necesario para el cacheo 4h
use Carbon\Carbon;
use App\Services\OdooService;

class VisitadorController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    public function index(Request $request)
    {
        $visitador = Visitador::with(['tipoDocumento'])
            ->where('usuario_id', Auth::id())
            ->first();

        // 1️⃣ Lógica de determinación de Mes y Año
        if ($request->has('mes') && $request->has('anio')) {
            // Viene de la interacción del usuario cambiando de mes/año en la vista
            $mesNumero = str_pad($request->input('mes'), 2, '0', STR_PAD_LEFT);
            $anioNumero = $request->input('anio');
        } else {
            // Busca la meta más reciente/activa si no se seleccionó fecha
            $metaActiva = $visitador
                ? \App\Models\Meta::where('visitador_id', $visitador->id)
                    ->orderByDesc('fecha_meta')
                    ->first()
                : null;

            if ($metaActiva) {
                $fechaCarbon = Carbon::parse($metaActiva->fecha_meta);
                $mesNumero   = $fechaCarbon->format('m');
                $anioNumero  = $fechaCarbon->format('Y');
            } else {
                $mesNumero  = Carbon::now()->format('m');
                $anioNumero = Carbon::now()->format('Y');
            }
        }

        // Definir rango de fechas para el mes y año evaluado
        $inicio = Carbon::createFromDate($anioNumero, $mesNumero, 1)->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        // Recarga el visitador con la meta del mes/año seleccionado
        if ($visitador) {
            $visitador->load(['metas' => function ($query) use ($inicio) {
                $query->whereYear('fecha_meta', $inicio->year)
                      ->whereMonth('fecha_meta', $inicio->month)
                      ->limit(1);
            }]);
        }

        $medicos = $visitador ? $visitador->medicos()->get() : collect();

        // 2️⃣ Visitas del mes/año seleccionado
        $visitas = $visitador
            ? Visita::where('visitador_id', $visitador->id)
                ->whereYear('fecha_programada', $inicio->year)
                ->whereMonth('fecha_programada', $inicio->month)
                ->get()
            : collect();

        // 3️⃣ Visitas pendientes sin límite de mes
        $visitasPendientes = $visitador
            ? Visita::where('visitador_id', $visitador->id)
                ->where('estado', 'programada')
                ->orderBy('fecha_programada', 'asc')
                ->get()
            : collect();

        // 4️⃣ Actividades / Eventos próximos del visitador (solo pendientes / programados)
        $actividadesProximas = $visitador
            ? \App\Models\Evento::where('visitador_id', $visitador->id)
                ->whereNotIn('estado', ['realizado', 'cancelado', 'completado'])
                ->where('fecha_programada', '>=', now()->startOfDay())
                ->orderBy('fecha_programada', 'asc')
                ->select('id', 'nombre_evento', 'comentario', 'ubicacion', 'fecha_programada', 'fecha_fin_programada', 'estado', 'etiquetas')
                ->get()
            : collect();

        $todosMedicosDoc = $medicos->pluck('documento')
            ->filter()
            ->unique()
            ->map(fn($d) => (string) $d)
            ->values();

        // Especialidad resuelta desde Odoo
        $especialidades = $this->odoo->getEspecialidadesPorDocumentos($todosMedicosDoc->toArray());
        foreach ($medicos as $medico) {
            $medico->especialidad = $especialidades[trim((string) $medico->documento)] ?? 'General';
        }

        // 5️⃣ Visitas efectivas del mes/año seleccionado
        $visitasEfectivas = $visitador
            ? Visita::where('visitador_id', $visitador->id)
                ->where('estado', 'efectiva')
                ->whereYear('fecha_realizada', $inicio->year)
                ->whereMonth('fecha_realizada', $inicio->month)
                ->count()
            : 0;

        $progreso = [
            'visitas_efectivas' => $visitasEfectivas,
            'valor_comprado'    => 0,
            'valor_formulado'   => 0,
        ];

        return Inertia::render('VISITADOR/PANEL/panel', [
            'visitador'           => $visitador,
            'medicos'             => $medicos,
            'visitasData'         => $visitas,
            'visitasPendientes'   => $visitasPendientes,
            'actividadesProximas' => $actividadesProximas,
            'progreso'            => $progreso,
            'mesActual'           => $mesNumero,  // 👈 Ej: "03"
            'anioActual'          => $anioNumero, // 👈 Ej: "2026"
        ]);
    }

    /**
     * Devuelve las ventas de Odoo (comprado / formulado) del visitador
     * autenticado, para el mes indicado.
     */
    public function odooStats(Request $request)
{
    $visitador = Visitador::where('usuario_id', Auth::id())->first();

    if (!$visitador) {
        return response()->json(['error' => 'Visitador no encontrado'], 404);
    }

    $mesInput = $request->input('mes', Carbon::now()->format('m'));
    $anioInput = $request->input('anio', Carbon::now()->format('Y'));

    // Si viene en formato "07", le anteponemos el año actual/seleccionado para formar "YYYY-MM"
    if (strlen($mesInput) <= 2) {
        $mes = "{$anioInput}-" . str_pad($mesInput, 2, '0', STR_PAD_LEFT);
    } else {
        $mes = $mesInput;
    }

    $forzar = $request->boolean('forzar');
    $cacheKey = "odoo_stats_panel_{$visitador->id}_{$mes}";

    if ($forzar) {
        Cache::forget($cacheKey);
    }

    $yaEnCache = Cache::has($cacheKey);

    $payload = Cache::remember($cacheKey, now()->addHours(4), function () use ($visitador, $mes) {
        // Ahora $mes siempre es 'YYYY-MM', por lo que Carbon::parse no fallará
        $inicio = Carbon::parse($mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        $documentos = $visitador->medicos()
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
            $resumenOdoo = $this->odoo->obtenerResumenAdmin(
                $documentos,
                $inicio->format('Y-m-d'),
                $fin->format('Y-m-d')
            );
            $valorComprado  = (float) ($resumenOdoo['total_valor_comprado'] ?? 0);
            $valorFormulado = (float) ($resumenOdoo['total_valor_formulado'] ?? 0);
        }

        return [
            'valor_comprado'  => $valorComprado,
            'valor_formulado' => $valorFormulado,
            'actualizado_en'  => now()->toIso8601String(),
        ];
    });

    return response()->json($payload + ['desde_cache' => $yaEnCache]);
}
}