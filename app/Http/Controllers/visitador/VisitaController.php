<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visita;
use App\Models\Medico;
use App\Models\Visitador;
use Illuminate\Http\Request;
use App\Models\Productos;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Validation\Rule;

class VisitaController extends Controller
{
    private function getVisitador()
    {
        return Visitador::with(['medicos'])
            ->where('usuario_id', Auth::id())
            ->first();
    }

    public function index()
{
    $visitador = $this->getVisitador();
    if (!$visitador) return redirect()->route('login');

    return Inertia::render('VISITADOR/MVISITAS/MisVisitas', [
        'visitas' => Visita::with('medico')
            ->where('visitador_id', $visitador->id)
            ->orderBy('fecha_programada', 'asc')
            ->get()
            ->map(function ($visita) {
                $visita->hora_12h = Carbon::parse($visita->fecha_programada)->format('g:i A');
                return $visita;
            }),
        'medicosDisponibles' => $visitador->medicos,
        'productos'          => Productos::select('id', 'nombre', 'codigo')->orderBy('nombre')->get(), // 👈
        'estadosDisponibles' => ['sin programar', 'programada', 'efectiva', 'No contactado', 'reprogramada', 'cancelada']
    ]);
}

    public function store(Request $request)
    {
        $visitador = $this->getVisitador();

        $request->validate([
            'medico_id' => [
                'required',
                Rule::exists('medicos', 'id')->where(fn ($q) => $q->where('visitador_id', $visitador->id)),
            ],
            'fecha_programada' => 'required|date',
            'fecha_realizada' => 'nullable|date',
            'estado'           => 'required|in:sin programar,programada,efectiva,No contactado,reprogramada,cancelada',
            'muestras'           => 'nullable|string|max:255', // 👈
    'comentario_muestra' => 'nullable|string',         // 👈
        ]);

        $fechaNueva = Carbon::parse($request->fecha_programada);

        // --- VALIDACIONES DE TIEMPO ---
        if ($fechaNueva->isPast() && !$fechaNueva->isToday()) {
            return back()->withErrors(['fecha_programada' => 'La fecha no puede ser anterior a hoy.']);
        }

        if ($fechaNueva->isWeekend()) {
            return back()->withErrors(['fecha_programada' => 'No se atiende fines de semana.']);
        }

        $hora = $fechaNueva->format('H:i');
        if ($hora < '08:00' || $hora > '18:00') {
            return back()->withErrors(['fecha_programada' => 'Horario laboral: 08:00 AM - 06:00 PM.']);
        }

        // --- DETECCIÓN DE CRUCES ---
        // Definimos un margen de 30 minutos para considerar un "espacio ocupado"
        $inicioRango = (clone $fechaNueva)->subMinutes(29);
        $finRango = (clone $fechaNueva)->addMinutes(29);

        $cruce = Visita::with('medico')
            ->whereBetween('fecha_programada', [$inicioRango, $finRango])
            ->where(function($q) use ($visitador, $request) {
                $q->where('visitador_id', $visitador->id) // El visitador está ocupado
                  ->orWhere('medico_id', $request->medico_id); // El médico ya tiene cita
            })
            ->first();

        if ($cruce) {
            $nombreConflicto = $cruce->medico->nombre . ' ' . $cruce->medico->apellido;
            $horaConflicto = Carbon::parse($cruce->fecha_programada)->format('g:i A');
            
            return back()->withErrors([
                'fecha_programada' => "Conflicto de horario: Ya existe una cita a las {$horaConflicto} con el Dr. {$nombreConflicto}."
            ]);
        }

        Visita::create([
            'medico_id'        => $request->medico_id,
            'visitador_id'     => $visitador->id,
            'fecha_programada' => $request->fecha_programada,
            'fecha_realizada'    => $request->fecha_realizada,  
             'estado'             => 'programada', 
            'comentarios'      => $request->comentarios,
             'muestras'           => $request->muestras,           // 👈
    'comentario_muestra' => $request->comentario_muestra, // 👈
        ]);

        return redirect()->back()->with('success', 'Visita agendada.');
    }

    public function marcarEfectiva(Request $request, $id)
    {
        $visitador = $this->getVisitador();
        $visita = Visita::where('id', $id)->where('visitador_id', $visitador->id)->firstOrFail();

        $updateData = [
            'estado'      => $request->estado,
            'comentarios' => $request->comentarios,
        ];

        if ($request->estado === 'efectiva' && !$visita->fecha_realizada) {
            $updateData['fecha_realizada'] = now();
        }

        $visita->update($updateData);
        return redirect()->back()->with('message', 'Actualizado.');
    }

    public function reprogramar(Request $request, $id)
    {
        $visitador = $this->getVisitador();
        $fechaNueva = Carbon::parse($request->fecha_programada);

        // Validar horario laboral en reprogramación
        if ($fechaNueva->format('H:i') < '08:00' || $fechaNueva->format('H:i') > '18:00') {
            return back()->withErrors(['fecha_programada' => 'Fuera de horario laboral (08:00 - 18:00).']);
        }

        // Opcional: Podrías añadir aquí también la validación de cruce si deseas
        $visita = Visita::where('id', $id)->where('visitador_id', $visitador->id)->firstOrFail();
        
        $visita->update([
            'fecha_programada' => $request->fecha_programada,
            'estado'           => 'reprogramada'
        ]);

        return redirect()->back()->with('message', 'Reprogramada.');
    }

   
}