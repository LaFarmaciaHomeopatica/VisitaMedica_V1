<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico;
use App\Models\Visita; // 👈 Importamos Visita para el conteo del panel
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class VisitadorController extends Controller
{
    /**
     * MÉTODOS DEL PANEL PRINCIPAL UNIFICADO
     */
    public function index()
    {
        $visitador = Visitador::with('tipoDocumento')
            ->where('usuario_id', Auth::id())
            ->first();

        $medicos = $visitador ? $visitador->medicos : [];

        // Obtener las visitas para los cálculos métricos directamente mediante Inertia
        $visitas = $visitador 
            ? Visita::where('visitador_id', $visitador->id)->get() 
            : [];

        return Inertia::render('VISITADOR/panel', [
            'visitador' => $visitador,
            'medicos'   => $medicos,
            'visitasData' => $visitas // 👈 Enviamos las visitas de forma nativa
        ]);
    }

    /**
     * VISTA DEL PERFIL (Simplificada)
     */
    public function perfil()
    {
        $visitador = Visitador::with('tipoDocumento')
            ->where('usuario_id', Auth::id())
            ->first();

        return Inertia::render('VISITADOR/visitador', [
            'visitador' => $visitador
        ]);
    }

    public function show($id)
    {
        $visitador = Visitador::with('tipoDocumento')->findOrFail($id);
        $medicos = Medico::where('visitador_id', $visitador->id)->get();

        return Inertia::render('VISITADOR/visitador', [
            'visitador' => $visitador,
            'medicos'   => $medicos
        ]);
    }
}