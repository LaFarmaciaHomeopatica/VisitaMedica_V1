<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class VisitadorController extends Controller
{
    /**
     * Perfil del visitador con su relación cargada + médicos
     */
    public function index()
    {
        // Cargamos la relación 'tipoDocumento' definida en el modelo
        $visitador = Visitador::with('tipoDocumento')
            ->where('usuario_id', Auth::id())
            ->first();

        // Médicos asociados al visitador encontrado
        $medicos = $visitador 
            ? Medico::where('visitador_id', $visitador->id)->get() 
            : [];

        return Inertia::render('VISITADOR/visitador', [
            'visitador' => $visitador, // Ahora este objeto incluye 'tipo_documento'
            'medicos'   => $medicos
        ]);
    }

    /**
     * Ver detalle de un visitador (opcional)
     */
    public function show($id)
    {
        // También cargamos la relación aquí para ver el nombre del documento
        $visitador = Visitador::with('tipoDocumento')->findOrFail($id);

        $medicos = Medico::where('visitador_id', $visitador->id)->get();

        return Inertia::render('VISITADOR/Visitador', [
            'visitador' => $visitador,
            'medicos'   => $medicos
        ]);
    }
}