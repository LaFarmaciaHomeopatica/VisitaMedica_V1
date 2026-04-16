<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico; // 👈 asegúrate de tener este modelo
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class VisitadorController extends Controller
{
    /**
     * Perfil del visitador + médicos
     */
    public function index()
    {
        // Obtener visitador del usuario logueado
        $visitador = Visitador::where('usuario_id', Auth::id())->first();

        // Médicos asociados (ajusta según tu relación)
        $medicos = Medico::where('visitador_id', $visitador->id ?? null)->get();

        return Inertia::render('VISITADOR/visitador', [
            'visitador' => $visitador,
            'medicos'   => $medicos
        ]);
    }

    /**
     * Ver detalle de un visitador (opcional)
     */
    public function show($id)
    {
        $visitador = Visitador::findOrFail($id);

        $medicos = Medico::where('visitador_id', $visitador->id)->get();

        return Inertia::render('VISITADOR/Visitador', [
            'visitador' => $visitador,
            'medicos'   => $medicos
        ]);
    }
}