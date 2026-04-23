<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Visita;
use App\Models\Medico;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class VisitasController extends Controller
{
    /**
     * Muestra la lista de visitas.
     */
    public function index()
    {
        return Inertia::render('ADMINISTRADOR/Gvisitas', [
            // Cargamos relaciones para que la tabla sea legible
            'visitas' => Visita::with(['medico', 'visitador'])->orderBy('id', 'desc')->get(),
            // Enviamos los médicos con su visitador_id para poder filtrarlos en el JS
            'medicos' => Medico::select('id', 'nombre', 'visitador_id')->get(),
            'visitadores' => Visitador::select('id', 'nombre')->get(),
        ]);
    }

    /**
     * Almacena una nueva visita con validación de relación.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'visitador_id'     => 'required|exists:visitadores,id',
            'medico_id'        => [
                'required',
                // Validamos que el médico pertenezca al visitador seleccionado
                Rule::exists('medicos', 'id')->where(function ($query) use ($request) {
                    $query->where('visitador_id', $request->visitador_id);
                }),
            ],
            'fecha_programada' => 'required|date',
            'fecha_realizada'  => 'nullable|date',
            'estado'           => 'required|in:sin programar,programada,efectiva,No contactado,reprogramada,cancelada',
            'comentarios'      => 'nullable|string',
        ]);

        Visita::create($validated);

        return Redirect::route('Gvisitas.index')->with('success', 'Visita creada correctamente.');
    }

    /**
     * Actualiza una visita existente.
     */
    public function update(Request $request, $id)
    {
        $visita = Visita::findOrFail($id);

        $validated = $request->validate([
            'visitador_id'     => 'required|exists:visitadores,id',
            'medico_id'        => [
                'required',
                Rule::exists('medicos', 'id')->where(function ($query) use ($request) {
                    $query->where('visitador_id', $request->visitador_id);
                }),
            ],
            'fecha_programada' => 'required|date',
            'fecha_realizada'  => 'nullable|date',
            'estado'           => 'required|in:sin programar,programada,efectiva,No contactado,reprogramada,cancelada',
            'comentarios'      => 'nullable|string',
        ]);

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
}