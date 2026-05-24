<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\MedicoTemporal;
use App\Models\Medico;
use App\Models\Categoria;
use App\Models\TipoDocumento;
use App\Models\Visitador; // Cambiado de User a Visitador
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MedicoTemporalController extends Controller
{
    public function index()
    {
        return Inertia::render('ADMINISTRADOR/MEDICOSTEMP/GmedicosTemporales', [
            'medicosTemporales' => MedicoTemporal::all(),
            'categorias'        => Categoria::all(),
            'tiposDocumento'    => TipoDocumento::all(),
            // Consultamos directamente a la tabla visitadores con sus campos correspondientes
            'visitadores'       => Visitador::all(['id', 'nombre', 'apellido']),
        ]);
    }

    public function promover(Request $request, $id)
    {
        $temporal = MedicoTemporal::findOrFail($id);

        $validated = $request->validate([
            'tipo_documento_id'     => 'required|exists:tipo_documento,id',
            'documento'             => 'required|string|unique:medicos,documento',
            'nombre'                => 'required|string|max:255',
            'apellido'              => 'required|string|max:255',
            'especialidad'          => 'nullable|string|max:255',
            'telefono_contacto'     => 'nullable|string|max:50',
            'horario_atencion'      => 'nullable|string|max:255',
            'direccion_detalles'    => 'nullable|string|max:500',
            'geolocalizacion'       => 'nullable|string|max:255',
            'categoria_id'          => 'nullable|exists:categoria,id',
            // Corregido: Ahora valida que el ID exista en la tabla 'visitadores'
            'visitador_id'          => 'nullable|exists:visitadores,id', 
            'fecha_inicio_relacion' => 'nullable|date',
        ]);

        DB::transaction(function () use ($validated, $temporal) {
            Medico::create($validated);
            $temporal->delete();
        });

        return redirect()->back()->with('success', 'Médico oficializado correctamente.');
    }

    public function destroy($id)
    {
        MedicoTemporal::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Registro eliminado.');
    }

    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:medicos_temporales,id',
        ]);

        MedicoTemporal::whereIn('id', $request->ids)->delete();
        return redirect()->back()->with('success', 'Registros eliminados.');
    }
}