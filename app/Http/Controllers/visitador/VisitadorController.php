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

        // 3️⃣ Ventas totales del mes
        $ventasActuales = $todosMedicosDoc->isNotEmpty()
            ? DB::table('transacciones')
                ->whereIn('medico_documento', $todosMedicosDoc)
                ->whereYear('fecha', $inicio->year)
                ->whereMonth('fecha', $inicio->month)
                ->sum('valor_comprado')
            : 0;

        return Inertia::render('VISITADOR/PANEL/panel', [
            'visitador'         => $visitador,
            'medicos'           => $medicos,
            'visitasData'       => $visitas,
            'visitasPendientes' => $visitasPendientes,
            'ventasActuales'    => (float) $ventasActuales,
            'mesActual'         => $mes,
        ]);
    }
}