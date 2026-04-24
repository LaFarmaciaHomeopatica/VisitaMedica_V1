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
use Carbon\Carbon;

class VisitasController extends Controller
{
    /**
     * Muestra la lista de visitas.
     */
    public function index()
    {
        return Inertia::render('ADMINISTRADOR/Gvisitas', [
            'visitas' => Visita::with(['medico', 'visitador'])->orderBy('id', 'desc')->get(),
            'medicos' => Medico::select('id', 'nombre', 'visitador_id')->get(),
            'visitadores' => Visitador::select('id', 'nombre')->get(),
        ]);
    }

    /**
     * Almacena una nueva visita con validación de relación, disponibilidad y horario.
     */
    public function store(Request $request)
    {
        // 1. Validaciones básicas de Laravel
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

        // 2. Validación de Horario Laboral (8:00 AM a 6:00 PM) y Fines de Semana
        $fechaCarbon = Carbon::parse($request->fecha_programada);
        $horaInicio = '08:00';
        $horaFin = '18:00';

        if ($fechaCarbon->isWeekend()) {
            return back()->withErrors([
                'fecha_programada' => 'No se pueden programar visitas los fines de semana.'
            ]);
        }

        if (!$fechaCarbon->between($horaInicio, $horaFin)) {
            return back()->withErrors([
                'fecha_programada' => "La hora debe estar entre las $horaInicio y las $horaFin."
            ]);
        }

        // 3. Validación de Disponibilidad (Cruce de horarios)
        $existeCruce = Visita::where('fecha_programada', $request->fecha_programada)
            ->where(function($query) use ($request) {
                $query->where('visitador_id', $request->visitador_id)
                      ->orWhere('medico_id', $request->medico_id);
            })
            ->exists();

        if ($existeCruce) {
            return back()->withErrors([
                'fecha_programada' => 'El visitador o el médico ya tienen una cita en esta fecha y hora exacta.'
            ]);
        }

        Visita::create($validated);

        return Redirect::route('Gvisitas.index')->with('success', 'Visita creada correctamente.');
    }

    /**
     * Actualiza una visita existente con validación de disponibilidad y horario.
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

        // Validación de Horario Laboral y Fines de Semana
        $fechaCarbon = Carbon::parse($request->fecha_programada);
        if ($fechaCarbon->isWeekend()) {
            return back()->withErrors(['fecha_programada' => 'No se pueden programar visitas en fin de semana.']);
        }
        if (!$fechaCarbon->between('08:00', '18:00')) {
            return back()->withErrors(['fecha_programada' => 'La hora debe ser entre las 08:00 y las 18:00.']);
        }

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
}