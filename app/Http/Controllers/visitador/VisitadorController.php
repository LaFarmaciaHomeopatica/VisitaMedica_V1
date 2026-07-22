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

        // Especialidad resuelta desde Odoo (igual que el admin), no la
        // columna local 'especialidad' (legado).
        $especialidades = $this->odoo->getEspecialidadesPorDocumentos($todosMedicosDoc->toArray());
        foreach ($medicos as $medico) {
            $medico->especialidad = $especialidades[trim((string) $medico->documento)] ?? 'General';
        }

        // 3️⃣ Visitas efectivas del mes (para la barra de "Cumplimiento de visitas")
        $visitasEfectivas = $visitador
            ? Visita::where('visitador_id', $visitador->id)
                ->where('estado', 'efectiva')
                ->whereYear('fecha_realizada', $inicio->year)
                ->whereMonth('fecha_realizada', $inicio->month)
                ->count()
            : 0;

        // 👇 4️⃣ NO se consulta Odoo aquí. Igual que en Gmetas/MetasController,
        //    valor_comprado y valor_formulado se cargan aparte, de forma
        //    asíncrona, desde /panel/odoo-stats (ver método odooStats abajo).
        //    Esto evita que la carga del panel se demore esperando a Odoo.
        $progreso = [
            'visitas_efectivas' => $visitasEfectivas,
            'valor_comprado'    => 0,
            'valor_formulado'   => 0,
        ];

        return Inertia::render('VISITADOR/PANEL/panel', [
            'visitador'         => $visitador,
            'medicos'           => $medicos,
            'visitasData'       => $visitas,
            'visitasPendientes' => $visitasPendientes,
            'progreso'          => $progreso,
            'mesActual'         => $mes,
        ]);
    }

    /**
     * Devuelve las ventas de Odoo (comprado / formulado) del visitador
     * autenticado, para el mes indicado. Espejo de
     * MetasController::odooStats pero acotado al propio visitador logueado
     * (no recibe id por URL, usa Auth::id()).
     *
     * Cacheado 4h por visitador+mes. ?forzar=1 limpia la caché y vuelve a
     * consultar Odoo (botón "Actualizar" en el front).
     */
    public function odooStats(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();

        if (!$visitador) {
            return response()->json(['error' => 'Visitador no encontrado'], 404);
        }

        $mes    = $request->input('mes', Carbon::now()->format('Y-m'));
        $forzar = $request->boolean('forzar');

        $cacheKey = "odoo_stats_panel_{$visitador->id}_{$mes}";

        if ($forzar) {
            Cache::forget($cacheKey);
        }

        $yaEnCache = Cache::has($cacheKey);

        $payload = Cache::remember($cacheKey, now()->addHours(4), function () use ($visitador, $mes) {
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