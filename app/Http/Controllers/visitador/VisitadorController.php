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

    // 1️⃣ Visitas del mes actual (Para las barras de porcentaje y estadísticas)
    $visitas = $visitador
        ? Visita::where('visitador_id', $visitador->id)
            ->whereYear('fecha_programada', $inicio->year)
            ->whereMonth('fecha_programada', $inicio->month)
            ->get()
        : collect();

    // 2️⃣ 📌 NUEVO: Visitas Pendientes Reales sin límite de mes
    // Trae todas las que estén agendadas y que NO se hayan gestionado todavía (Ayer, hoy o mañana)
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

    // 3️⃣ Cálculo de Ventas Totales del Mes
    $ventasActuales = $todosMedicosDoc->isNotEmpty()
        ? DB::table('transacciones')
            ->whereIn('medico_documento', $todosMedicosDoc)
            ->whereYear('fecha', $inicio->year)
            ->whereMonth('fecha', $inicio->month)
            ->sum('valor_comprado')
        : 0;

    // 4️⃣ 📌 NUEVO: Top 5 Médicos Formuladores / Compradores
    // Agrupa las transacciones de los médicos asignados en el mes actual
    $topMedicos = $todosMedicosDoc->isNotEmpty()
        ? DB::table('transacciones')
            ->select('medico_documento', DB::raw('SUM(valor_comprado) as total_comprado'))
            ->whereIn('medico_documento', $todosMedicosDoc)
            ->whereYear('fecha', $inicio->year)
            ->whereMonth('fecha', $inicio->month)
            ->groupBy('medico_documento')
            ->orderByDesc('total_comprado')
            ->get()
            ->map(function ($transaccion) use ($medicos) {
                // Le acoplamos el Nombre y Especialidad del modelo Medico para que React los pinte bien
                $medicoModel = $medicos->firstWhere('documento', $transaccion->medico_documento);
                return [
                    'documento'      => $transaccion->medico_documento,
                    'total_comprado' => (float) $transaccion->total_comprado,
                    'nombre'         => $medicoModel ? $medicoModel->nombre . ' ' . $medicoModel->apellido : 'Médico No Registrado',
                    'especialidad'   => $medicoModel ? $medicoModel->especialidad : 'General'
                ];
            })
        : collect();

    // Enviar todos los datos requeridos por la vista panel.jsx
    return Inertia::render('VISITADOR/PANEL/panel', [
        'visitador'         => $visitador,
        'medicos'           => $medicos,
        'visitasData'       => $visitas,
        'visitasPendientes' => $visitasPendientes, //  Enviado al Front
        'topMedicos'        => $topMedicos,        //  Enviado al Front
        'ventasActuales'    => (float) $ventasActuales,
        'mesActual'         => $mes,
    ]);
}

   
}