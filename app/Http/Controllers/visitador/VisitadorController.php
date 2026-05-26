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
    /**
     * MÉTODOS DEL PANEL PRINCIPAL UNIFICADO
     */
    public function index()
    {
        $visitador = Visitador::with(['tipoDocumento', 'metas' => function ($query) {
            $query->latest()->limit(1);
        }])
        ->where('usuario_id', Auth::id())
        ->first();

        $medicos = $visitador ? $visitador->medicos : [];

        // Solo visitas del mes actual
        $visitas = $visitador
            ? Visita::where('visitador_id', $visitador->id)
                ->whereMonth('fecha_programada', now()->month)
                ->whereYear('fecha_programada', now()->year)
                ->get()
            : [];

        // Documentos de TODOS los médicos históricos del visitador
        // (igual que el admin — un médico puede comprar aunque no haya visita ese mes)
        $todosMedicosDoc = $visitador
            ? DB::table('visitas')
                ->where('visitas.visitador_id', $visitador->id)
                ->join('medicos', 'visitas.medico_id', '=', 'medicos.id')
                ->pluck('medicos.documento')
                ->unique()
                ->values()
            : collect();

        // Valor comprado real del mes actual desde transacciones
        $ventasActuales = $todosMedicosDoc->isNotEmpty()
            ? DB::table('transacciones')
                ->whereIn('medico_documento', $todosMedicosDoc)
                ->whereMonth('fecha', now()->month)
                ->whereYear('fecha', now()->year)
                ->sum('valor_comprado')
            : 0;

        return Inertia::render('VISITADOR/panel', [
            'visitador'      => $visitador,
            'medicos'        => $medicos,
            'visitasData'    => $visitas,
            'ventasActuales' => (float) $ventasActuales,
        ]);
    }

    /**
     * VISTA DEL PERFIL
     */
    public function perfil()
    {
        $visitador = Visitador::with(['tipoDocumento', 'metas'])
            ->where('usuario_id', Auth::id())
            ->first();

        return Inertia::render('VISITADOR/visitador', [
            'visitador' => $visitador
        ]);
    }

    public function show($id)
    {
        $visitador = Visitador::with(['tipoDocumento', 'metas'])->findOrFail($id);
        $medicos = Medico::where('visitador_id', $visitador->id)->get();

        return Inertia::render('VISITADOR/visitador', [
            'visitador' => $visitador,
            'medicos'   => $medicos
        ]);
    }
}