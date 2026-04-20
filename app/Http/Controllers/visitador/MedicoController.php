<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller; 
use App\Models\Medico;
use App\Models\Visitador; // Necesario para buscar el visitador_id
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MedicoController extends Controller
{
    public function index(Request $request)
    {
        // 1. Buscamos primero el ID del visitador asociado al usuario logueado
        $visitador = Visitador::where('usuario_id', Auth::id())->first();

        // 2. Cargamos los médicos filtrando por ese visitador e incluyendo su tipo de documento
        $query = Medico::with('tipoDocumento')
                       ->where('visitador_id', $visitador->id ?? null);

        // Buscador funcional
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('nombre', 'like', '%' . $searchTerm . '%')
                  ->orWhere('apellido', 'like', '%' . $searchTerm . '%')
                  ->orWhere('especialidad', 'like', '%' . $searchTerm . '%')
                  ->orWhere('documento', 'like', '%' . $searchTerm . '%');
            });
        }

        $medicos = $query->get();

        return Inertia::render('VISITADOR/ListadoMedicos', [
            'medicosDb' => $medicos,
            'filters'   => $request->only(['search'])
        ]);
    }

    public function show($id)
    {
        // También cargamos la relación en el detalle
        $medico = Medico::with('tipoDocumento')->findOrFail($id);

        return Inertia::render('VISITADOR/MedicoDetalle', [
            'medico' => $medico
        ]);
    }
}