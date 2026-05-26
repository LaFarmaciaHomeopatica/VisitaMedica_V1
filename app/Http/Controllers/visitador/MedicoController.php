<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller; 
use App\Models\Medico;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MedicoController extends Controller
{
    public function index(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();

        $query = Medico::with('tipoDocumento')
                       ->where('visitador_id', $visitador->id ?? null);

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('nombre', 'like', '%' . $searchTerm . '%')
                  ->orWhere('apellido', 'like', '%' . $searchTerm . '%')
                  ->orWhere('especialidad', 'like', '%' . $searchTerm . '%')
                  ->orWhere('documento', 'like', '%' . $searchTerm . '%');
            });
        }

        // Registros por página: mínimo 10, máximo 100
        $perPage = max((int) $request->input("per_page", 10), 1);

        $medicos = $query->orderBy('nombre')->paginate($perPage)->withQueryString();

        return Inertia::render('VISITADOR/ListadoMedicos', [
            'medicosDb' => $medicos,
            'filters'   => $request->only(['search', 'per_page'])
        ]);
    }

    public function show($id)
    {
        $medico = Medico::with('tipoDocumento')->findOrFail($id);

        return Inertia::render('VISITADOR/MedicoDetalle', [
            'medico' => $medico
        ]);
    }
}