<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visita;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VisitaController extends Controller
{
    /**
     * Obtener el visitador logueado
     */
    private function getVisitador()
    {
        return Visitador::where('usuario_id', Auth::id())->first();
    }

    /**
     * Listar visitas del visitador logueado
     */
    public function index()
    {
        $visitador = $this->getVisitador();

        if (!$visitador) {
            return response()->json([]);
        }

        $visitas = Visita::with('medico')
            ->where('visitador_id', $visitador->id)
            ->orderBy('fecha_programada', 'asc')
            ->get();

        return response()->json($visitas);
    }

    /**
     * Crear nueva visita
     */
    public function store(Request $request)
    {
        $visitador = $this->getVisitador();

        if (!$visitador) {
            return response()->json(['error' => 'Visitador no encontrado'], 404);
        }

        $request->validate([
            'medico_id' => 'required|exists:medicos,id',
            'fecha_programada' => 'required|date',
        ]);

        $visita = Visita::create([
            'medico_id' => $request->medico_id,
            'visitador_id' => $visitador->id,
            'fecha_programada' => $request->fecha_programada,
            'estado' => 'programada',
        ]);

        return response()->json($visita);
    }

    /**
     * Marcar visita como efectiva
     */
    public function marcarEfectiva($id)
    {
        $visitador = $this->getVisitador();

        $visita = Visita::where('id', $id)
            ->where('visitador_id', $visitador->id)
            ->firstOrFail();

        $visita->update([
            'estado' => 'efectiva',
            'fecha_realizada' => now()
        ]);

        return response()->json([
            'message' => 'Visita marcada como efectiva',
            'visita' => $visita
        ]);
    }

    /**
     * Reprogramar visita
     */
    public function reprogramar(Request $request, $id)
    {
        $visitador = $this->getVisitador();

        $request->validate([
            'fecha_programada' => 'required|date'
        ]);

        $visita = Visita::where('id', $id)
            ->where('visitador_id', $visitador->id)
            ->firstOrFail();

        $visita->update([
            'fecha_programada' => $request->fecha_programada,
            'estado' => 'reprogramada'
        ]);

        return response()->json($visita);
    }

    /**
     * Cancelar visita
     */
    public function cancelar($id)
    {
        $visitador = $this->getVisitador();

        $visita = Visita::where('id', $id)
            ->where('visitador_id', $visitador->id)
            ->firstOrFail();

        $visita->update([
            'estado' => 'cancelada'
        ]);

        return response()->json($visita);
    }
}