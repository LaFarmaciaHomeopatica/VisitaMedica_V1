<?php

namespace App\Http\Controllers\Administrador;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Models\Visitador; // IMPORTANTE: Importa el modelo de Visitadores
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class Medico2Controller extends Controller
{
    /**
     * Mostrar listado de médicos.
     */
    public function index()
    {
        return Inertia::render('ADMINISTRADOR/Gmedicos', [
            // Enviamos los médicos con su relación
            'medicos' => Medico::with('visitador')->get(),
            // IMPORTANTE: Enviamos los visitadores para que el buscador del modal funcione
            'visitadores' => Visitador::all(['id', 'nombre', 'apellido']) 
        ]);
    }

    /**
     * Almacenar un nuevo médico.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'documento' => 'required|numeric|unique:medicos,documento',
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'especialidad' => 'nullable|string|max:100',
            'geolocalizacion' => 'nullable|string|max:300',
            'direccion_detalles' => 'nullable|string',
            'telefono_contacto' => 'nullable|string|max:50',
            'horario_atencion' => 'nullable|string|max:100',
            'visitador_id' => 'required|exists:visitadores,id',
            'fecha_inicio_relacion' => 'nullable|date',
            'tipo_documento_id' => 'required|integer',
        ]);

        Medico::create($validated);

        // Usamos el nombre de ruta que definiste en web.php
        return Redirect::route('medicos.index')->with('message', 'Médico creado con éxito.');
    }

    /**
     * Actualizar el médico en la base de datos.
     */
    public function update(Request $request, Medico $medico)
    {
        $validated = $request->validate([
            'documento' => 'required|numeric|unique:medicos,documento,' . $medico->id,
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'especialidad' => 'nullable|string|max:100',
            'geolocalizacion' => 'nullable|string|max:300',
            'direccion_detalles' => 'nullable|string',
            'telefono_contacto' => 'nullable|string|max:50',
            'horario_atencion' => 'nullable|string|max:100',
            'visitador_id' => 'required|exists:visitadores,id',
            'fecha_inicio_relacion' => 'nullable|date',
            'tipo_documento_id' => 'required|integer',
        ]);

        $medico->update($validated);

        return Redirect::route('medicos.index')->with('message', 'Médico actualizado con éxito.');
    }

    /**
     * Eliminar el médico.
     */
    public function destroy(Medico $medico)
    {
        $medico->delete();

        return Redirect::route('medicos.index')->with('message', 'Médico eliminado correctamente.');
    }
}