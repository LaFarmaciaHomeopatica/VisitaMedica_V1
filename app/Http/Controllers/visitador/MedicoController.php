<?php

namespace App\Http\Controllers\visitador;

// Esta es la línea clave que faltaba para corregir el error:
use App\Http\Controllers\Controller; 
use App\Models\Medico;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MedicoController extends Controller
{
    /**
     * Muestra el listado de médicos con filtro de búsqueda.
     */
    public function index(Request $request)
    {
        // Filtramos por el visitador logueado
        $query = Medico::where('visitador_id', Auth::id());

        // Buscador funcional para React
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('nombre_completo', 'like', '%' . $searchTerm . '%')
                  ->orWhere('especialidad', 'like', '%' . $searchTerm . '%')
                  ->orWhere('documento', 'like', '%' . $searchTerm . '%');
            });
        }

        $medicos = $query->get();

        $stats = [
            'visitados' => 0, 
            'total' => $medicos->count()
        ];

        return Inertia::render('VISITADOR/ListadoMedicos', [
            'medicosDb' => $medicos,
            'stats'     => $stats,
            'filters'   => $request->only(['search'])
        ]);
    }

   
    public function show($id)
    {
        $medico = Medico::findOrFail($id);

        return Inertia::render('VISITADOR/MedicoDetalle', [
            'medico' => $medico
        ]);
    }
}