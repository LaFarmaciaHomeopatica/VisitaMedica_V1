<?php

namespace App\Http\Controllers\administrador;
use App\Http\Controllers\Controller;

use App\Models\MedicoTemporal;
use App\Models\Medico;
use App\Models\Categoria; // Ajusta según tus modelos     // Para los visitadores
use App\Models\TipoDocumento; 
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MedicoTemporalController extends Controller
{
   public function index()
{
    return Inertia::render('ADMINISTRADOR/MEDICOSTEMP/GmedicosTemporales', [
        'medicosTemporales' => MedicoTemporal::all(),
        'categorias' => Categoria::all(),
        'tiposDocumento' => TipoDocumento::all(),
        // Eliminamos la carga de visitadores para evitar el error de la relación roles()
    ]);
}

    public function promover(Request $request, $id)
    {
        $temporal = MedicoTemporal::findOrFail($id);

        $validated = $request->validate([
            'documento' => 'required|unique:medicos,documento',
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento_id' => 'required|exists:tipo_documentos,id',
            'categoria_id' => 'required|exists:categorias,id',
            'visitador_id' => 'required|exists:users,id',
            'especialidad' => 'nullable|string',
            // ... demás validaciones
        ]);

        DB::transaction(function () use ($validated, $temporal) {
            // 1. Crear el médico oficial
            Medico::create($validated);

            // 2. Eliminar el registro temporal (ya no es necesario)
            $temporal->delete();
        });

        return redirect()->back()->with('success', 'Médico oficializado correctamente.');
    }
}