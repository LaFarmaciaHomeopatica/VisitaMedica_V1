<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Visita;
use App\Models\Medico;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Productos;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class VisitasController extends Controller
{
    /**
     * Muestra la lista de visitas.
     */
 public function index()
    {
        return Inertia::render('ADMINISTRADOR/VISITAS/Gvisitas', [
            // Al traer la relación 'medico' en las visitas, por defecto se traen todos sus campos, 
            // asegurando que las tarjetas y listas del Admin también tengan las coordenadas guardadas.
            'visitas' => Visita::with(['medico', 'visitador'])->orderBy('id', 'desc')->get(),
            
            // Añadimos 'direccion_detalles' y 'geolocalizacion' al select para que los formularios de creación/edición del Admin accedan a ellas.
            'medicos' => Medico::select('id', 'nombre', 'apellido', 'visitador_id', 'direccion_detalles', 'geolocalizacion')->get(),
            
            'visitadores' => Visitador::select('id', 'nombre')->get(),
            'productos' => Productos::select('id', 'codigo', 'nombre')->orderBy('nombre', 'asc')->get(),
        ]);
    }

    /**
     * Almacena una nueva visita con validación de relación y disponibilidad.
     */
    public function store(Request $request)
    {
        // 1. Validaciones básicas de Laravel
        $validated = $request->validate([
            'visitador_id'       => 'required|exists:visitadores,id',
            'medico_id'          => [
                'required',
                Rule::exists('medicos', 'id')->where(function ($query) use ($request) {
                    $query->where('visitador_id', $request->visitador_id);
                }),
            ],
            'fecha_programada'   => 'required|date',
            'fecha_realizada'    => 'nullable|date',
            'estado'             => 'required|in:sin programar,programada,efectiva,No contactado,reprogramada,cancelada',
            'comentarios'        => 'nullable|string',
            'muestras'           => 'nullable|string',
            'comentario_muestra' => 'nullable|string',
        ]);

        // 2. Validación de Disponibilidad (Se mantiene para evitar choques exactos)
        $existeCruce = Visita::where('fecha_programada', $request->fecha_programada)
            ->where(function($query) use ($request) {
                $query->where('visitador_id', $request->visitador_id)
                      ->orWhere('medico_id', $request->medico_id);
            })
            ->exists();

        if ($existeCruce) {
            return back()->withErrors([
                'fecha_programada' => 'El visitador o el médico ya tienen una cita programada para este momento.'
            ])->withInput();
        }

        // 3. Crear la visita
        Visita::create($validated);

        return Redirect::route('Gvisitas.index')->with('success', 'Visita creada correctamente.');
    }

    /**
     * Actualiza una visita existente con validación de disponibilidad.
     */
    public function update(Request $request, $id)
    {
        $visita = Visita::findOrFail($id);

        $validated = $request->validate([
            'visitador_id'       => 'required|exists:visitadores,id',
            'medico_id'          => [
                'required',
                Rule::exists('medicos', 'id')->where(function ($query) use ($request) {
                    $query->where('visitador_id', $request->visitador_id);
                }),
            ],
            'fecha_programada'   => 'required|date',
            'fecha_realizada'    => 'nullable|date',
            'estado'             => 'required|in:sin programar,programada,efectiva,No contactado,reprogramada,cancelada',
            'comentarios'        => 'nullable|string',
            'muestras'           => 'nullable|string',
            'comentario_muestra' => 'nullable|string',
        ]);

        // Validación de Disponibilidad (Excluyendo la visita actual)
        $existeCruce = Visita::where('id', '!=', $id)
            ->where('fecha_programada', $request->fecha_programada)
            ->where(function($query) use ($request) {
                $query->where('visitador_id', $request->visitador_id)
                      ->orWhere('medico_id', $request->medico_id);
            })
            ->exists();

        if ($existeCruce) {
            return back()->withErrors([
                'fecha_programada' => 'Esta fecha y hora ya están ocupadas.'
            ]);
        }

        $visita->update($validated);

        return Redirect::route('Gvisitas.index')->with('success', 'Visita actualizada correctamente.');
    }

    /**
     * Elimina una visita.
     */
    public function destroy($id)
    {
        $visita = Visita::findOrFail($id);
        $visita->delete();

        return Redirect::route('Gvisitas.index')->with('success', 'Visita eliminada correctamente.');
    }

    public function destroyBulk(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer|exists:visitas,id']);
        Visita::whereIn('id', $request->ids)->delete();

        return Redirect::route('Gvisitas.index')->with('success', 'Visitas eliminadas correctamente.');
    }
}