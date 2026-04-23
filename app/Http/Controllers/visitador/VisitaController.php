<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visita;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class VisitaController extends Controller
{
    /**
     * Obtener el visitador logueado con sus relaciones necesarias
     */
    private function getVisitador()
    {
        return Visitador::with(['tipodocumento', 'medicos'])
            ->where('usuario_id', Auth::id())
            ->first();
    }

    /**
     * VISTA DE PERFIL (Renderiza Visitador.jsx)
     */
    public function perfil()
    {
        $visitador = $this->getVisitador();
        $medicos = $visitador ? $visitador->medicos : [];

        return Inertia::render('VISITADOR/Visitador', [
            'visitador' => $visitador,
            'medicos' => $medicos
        ]);
    }

    /**
     * ENDPOINT PARA AXIOS (Actualiza la alerta en tiempo real)
     */
    public function getVisitasJson()
{
    $visitador = $this->getVisitador();
    if (!$visitador) return response()->json([]);

    // Obtenemos visitas del MES ACTUAL para calcular cumplimiento mensual y diario
    $visitas = Visita::where('visitador_id', $visitador->id)
        ->whereMonth('fecha_programada', now()->month)
        ->whereYear('fecha_programada', now()->year)
        ->get();

    return response()->json($visitas);
}

    /**
     * VISTA DE GESTIÓN (Renderiza GestionVisita.jsx)
     */
    public function index()
    {
        $visitador = $this->getVisitador();

        return Inertia::render('VISITADOR/GestionVisita', [
            'visitas' => Visita::with('medico')
                ->where('visitador_id', $visitador->id)
                ->get(),
            'estadosDisponibles' => Visita::getPossibleStatuses()
        ]);
    }

    /**
     * Crear nueva visita
     */
    public function store(Request $request)
    {
        $visitador = $this->getVisitador();

        $request->validate([
            'medico_id' => 'required|exists:medicos,id',
            'fecha_programada' => 'required|date',
        ]);

        Visita::create([
            'medico_id' => $request->medico_id,
            'visitador_id' => $visitador->id,
            'fecha_programada' => $request->fecha_programada,
            'estado' => 'programada',
        ]);

        return redirect()->back();
    }

    /**
     * Reportar resultado de visita
     */
    public function marcarEfectiva(Request $request, $id)
    {
        $visitador = $this->getVisitador();

        $request->validate([
            'estado' => 'required|string',
            'comentarios' => 'nullable|string',
        ]);

        $visita = Visita::where('id', $id)
            ->where('visitador_id', $visitador->id)
            ->firstOrFail();

        $visita->update([
            'estado' => $request->estado,
            'comentarios' => $request->comentarios,
            'fecha_realizada' => $request->estado === 'efectiva' ? now() : $visita->fecha_realizada,
        ]);

        return redirect()->back()->with('message', 'Reporte guardado');
    }

    /**
     * Reprogramar
     */
    public function reprogramar(Request $request, $id)
    {
        $visitador = $this->getVisitador();

        $request->validate(['fecha_programada' => 'required|date']);

        $visita = Visita::where('id', $id)
            ->where('visitador_id', $visitador->id)
            ->firstOrFail();

        $visita->update([
            'fecha_programada' => $request->fecha_programada,
            'estado' => 'reprogramada'
        ]);

        return redirect()->back();
    }

    public function calendario()
    {
        // Obtener las visitas para el calendario
        $visitas = Visita::with('medico')->get();

        return Inertia::render('VISITADOR/CalendarioVisitas', [
            'visitas' => $visitas
        ]);
    }
}