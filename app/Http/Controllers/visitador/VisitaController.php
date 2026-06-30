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

        $medicosDisponibles = $visitador->medicos()->get(['id', 'visitador_id', 'nombre', 'apellido', 'geolocalizacion', 'direccion_detalles']);

        return Inertia::render('VISITADOR/MVISITAS/MisVisitas', [
            'visitas' => Visita::with('medico')
                ->where('visitador_id', $visitador->id)
                ->orderBy('fecha_programada', 'asc')
                ->get()
                ->map(function ($visita) {
                    $visita->hora_12h = date('g:i A', strtotime($visita->fecha_programada));
                    
                    // 1. CAMBIO AQUÍ: Aseguramos que todas las visitas cargadas tengan su hora de cierre formateada en 12h
                    $visita->hora_cierre_12h = $visita->fecha_fin_real 
                        ? date('g:i A', strtotime($visita->fecha_fin_real)) 
                        : null;

                    return $visita;
                }),
            'medicosDisponibles' => $medicosDisponibles,
            'productos'          => Productos::select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
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
           
            'fecha_programada'   => 'required|date',
            'fecha_realizada'    => 'nullable|date',
            'estado'             => 'required|in:sin programar,programada,efectiva,No contactado,reprogramada,cancelada',
            'muestras'           => 'nullable|string|max:255',
            'comentario_muestra' => 'nullable|string',
        ]);

        // --- DETECCIÓN DE CRUCES ---
        $inicioRango = date('Y-m-d H:i:s', strtotime($request->fecha_programada . ' -29 minutes'));
        $finRango    = date('Y-m-d H:i:s', strtotime($request->fecha_programada . ' +29 minutes'));

        $cruce = Visita::with('medico')
            ->whereBetween('fecha_programada', [$inicioRango, $finRango])
            ->where(function($q) use ($visitador, $request) {
                $q->where('visitador_id', $visitador->id)
                  ->orWhere('medico_id', $request->medico_id);
            })
            ->first();

        if ($cruce) {
            $nombreConflicto = $cruce->medico->nombre . ' ' . $cruce->medico->apellido;
            $horaConflicto = date('g:i A', strtotime($cruce->fecha_programada));
            
            return back()->withErrors([
                'fecha_programada' => "Conflicto de horario: Ya existe una cita a las {$horaConflicto} con el Dr. {$nombreConflicto}."
            ]);
        }

        Visita::create([
            'medico_id'          => $request->medico_id,
            'visitador_id'       => $visitador->id,
            'fecha_programada'   => $request->fecha_programada,
            'fecha_realizada'    => $request->fecha_realizada,  
            'estado'             => 'programada', 
            'comentarios'        => $request->comentarios,
            'muestras'           => $request->muestras,           
            'comentario_muestra' => $request->comentario_muestra, 
        ]);

        return redirect()->back()->with('success', 'Visita agendada.');
    }

    public function marcarEfectiva(Request $request, $id)
    {
        $visitador = $this->getVisitador();
        $visita = Visita::where('id', $id)->where('visitador_id', $visitador->id)->firstOrFail();

        $request->validate([
            'estado'             => 'required|in:efectiva,No contactado,reprogramada,cancelada,programada',
            'comentarios'        => 'nullable|string',
            'muestras'           => 'nullable|string|max:255',
            'comentario_muestra' => 'nullable|string',
            'fecha_programada'   => 'nullable|date',
            'fecha_realizada'    => 'nullable|date',
            'fecha_fin_real'     => 'nullable|date', 
            'latitud'            => 'nullable|numeric|between:-90,90',  
            'longitud'           => 'nullable|numeric|between:-180,180', 
        ]);

        $updateData = [
            'estado'             => $request->estado,
            'comentarios'        => $request->comentarios,
            'muestras'           => $request->muestras,
            'comentario_muestra' => $request->comentario_muestra,
            'fecha_programada'   => $request->fecha_programada,
            'fecha_realizada'    => $request->fecha_realizada,
        ];

        // Guardamos la hora del servidor exacta
        $ahora = now();

        if (in_array($request->estado, ['efectiva', 'No contactado', 'cancelada'])) {
            $updateData['fecha_fin_real'] = $ahora; 
        }

        if ($request->estado === 'efectiva' && $request->latitud && $request->longitud) {
            $updateData['latitud']  = $request->latitud;
            $updateData['longitud'] = $request->longitud;
        }

        $visita->update($updateData);

        // 2. CAMBIO AQUÍ: Retornamos la hora formateada directamente en el flash session 
        // para que React la pinte en tiempo récord sin recargar el modal entero.
        return redirect()->back()->with([
            'message' => 'Actualizado.',
            'fecha_fin_fresca' => date('g:i A', strtotime($ahora))
        ]);
    }

    public function reprogramar(Request $request, $id)
    {
        $visitador = $this->getVisitador();
        
        $visita = Visita::where('id', $id)->where('visitador_id', $visitador->id)->firstOrFail();
        
        $visita->update([
            'fecha_programada' => $request->fecha_programada,
            'estado'           => 'reprogramada'
        ]);

        return redirect()->back()->with('message', 'Reprogramada.');
    }
}