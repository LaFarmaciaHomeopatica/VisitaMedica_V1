<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Visita;
use App\Models\Medico;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class VisitasController extends Controller
{
    /**
     * Muestra la lista de visitas.
     */
    public function index()
    {
        return Inertia::render('ADMINISTRADOR/Gvisitas', [
            // CAMBIO AQUÍ: Usamos orderBy('id', 'desc') en lugar de latest()
            'visitas' => Visita::orderBy('id', 'desc')->get(),
            'medicos' => Medico::select('id', 'nombre')->get(),
            'visitadores' => Visitador::select('id', 'nombre')->get(),
        ]);
    }

    /**
     * Almacena una nueva visita.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'medico_id'        => 'required|exists:medicos,id',
            'visitador_id'     => 'required|exists:visitadores,id',
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
            'medico_id'        => 'required|exists:medicos,id',
            'visitador_id'     => 'required|exists:visitadores,id',
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