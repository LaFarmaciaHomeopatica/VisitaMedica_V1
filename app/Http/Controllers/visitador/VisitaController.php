<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visita;
use App\Models\Medico;
use App\Models\Visitador;
use App\Models\Evento;
use App\Models\Productos;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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

        $medicosDisponibles = $visitador->medicos()->get(['id', 'visitador_id', 'nombre', 'geolocalizacion', 'direccion_detalles']);

        return Inertia::render('VISITADOR/MVISITAS/MisVisitas', [
            'visitas' => Visita::with('medico')
                ->where('visitador_id', $visitador->id)
                ->orderBy('fecha_programada', 'asc')
                ->get()
                ->map(function ($visita) {
                    $visita->hora_12h = date('g:i A', strtotime($visita->fecha_programada));
                    $visita->hora_cierre_12h = $visita->fecha_fin_real 
                        ? date('g:i A', strtotime($visita->fecha_fin_real)) 
                        : null;
                    return $visita;
                }),
            'eventos' => Evento::where('visitador_id', $visitador->id)
                ->orderBy('fecha_programada', 'asc')
                ->get()
                ->map(function ($evento) {
                    $evento->hora_12h = date('g:i A', strtotime($evento->fecha_programada));
                    $evento->hora_fin_12h = $evento->fecha_fin_programada
                        ? date('g:i A', strtotime($evento->fecha_fin_programada))
                        : null;
                    $evento->hora_cierre_12h = $evento->fecha_fin_real
                        ? date('g:i A', strtotime($evento->fecha_fin_real))
                        : null;
                    return $evento;
                }),
            'medicosDisponibles' => $medicosDisponibles,
            'productos'          => Productos::select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
            'estadosDisponibles' => ['sin programar', 'programada', 'efectiva', 'No contactado', 'reprogramada', 'cancelada']
        ]);
    }

    public function store(Request $request)
    {
        $visitador = $this->getVisitador();
        if (!$visitador) {
            return back()->withErrors(['error' => 'Tu usuario no tiene un perfil de visitador vinculado.']);
        }

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
            'comentarios'        => 'nullable|string',
        ]);

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
        if (!$visitador) {
            return back()->withErrors(['error' => 'Tu usuario no tiene un perfil de visitador vinculado.']);
        }
        $visita = Visita::where('id', $id)->where('visitador_id', $visitador->id)->firstOrFail();

        // No permitir modificar si ya está efectiva
        if ($visita->estado === 'efectiva') {
            return back()->withErrors(['estado' => 'Esta visita ya fue completada como efectiva y no puede ser modificada.']);
        }

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

        return redirect()->back()->with([
            'message' => 'Actualizado.',
            'fecha_fin_fresca' => date('g:i A', strtotime($ahora))
        ]);
    }

    public function reprogramar(Request $request, $id)
    {
        $visitador = $this->getVisitador();
        if (!$visitador) {
            return back()->withErrors(['error' => 'Tu usuario no tiene un perfil de visitador vinculado.']);
        }

        $visita = Visita::where('id', $id)->where('visitador_id', $visitador->id)->firstOrFail();

        if ($visita->estado === 'efectiva') {
            return back()->withErrors(['estado' => 'Esta visita ya fue completada como efectiva y no puede ser reprogramada.']);
        }

        $request->validate([
            'fecha_programada' => 'required|date',
            'fecha_realizada'  => 'nullable|date',
        ]);

        $visita->update([
            'fecha_programada' => $request->fecha_programada,
            'fecha_realizada'  => $request->fecha_realizada ?? $request->fecha_programada,
            'estado'           => 'reprogramada'
        ]);

        return redirect()->back()->with('message', 'Reprogramada.');
    }

    /**
     * Agendar una nueva actividad / evento para el visitador autenticado.
     */
    public function storeEvento(Request $request)
    {
        $visitador = $this->getVisitador();
        if (!$visitador) {
            return back()->withErrors(['error' => 'Tu usuario no tiene un perfil de visitador vinculado.']);
        }

        $validated = $request->validate([
            'nombre_evento'        => 'required|string|max:255',
            'comentario'           => 'nullable|string',
            'ubicacion'            => 'nullable|string|max:255',
            'latitud'              => 'nullable|numeric|between:-90,90',
            'longitud'             => 'nullable|numeric|between:-180,180',
            'fecha_programada'     => 'required|date',
            'fecha_fin_programada' => 'required|date|after:fecha_programada',
            'etiquetas'            => 'nullable|array',
            'etiquetas.*'          => 'nullable|string|max:50',
        ]);

        $etiquetas = [];
        if (!empty($validated['etiquetas']) && is_array($validated['etiquetas'])) {
            $etiquetas = array_values(array_filter(array_map('trim', $validated['etiquetas'])));
        }

        Evento::create([
            'visitador_id'         => $visitador->id,
            'nombre_evento'        => $validated['nombre_evento'],
            'comentario'           => $validated['comentario'] ?? null,
            'ubicacion'            => $validated['ubicacion'] ?? null,
            'latitud'              => $validated['latitud'] ?? null,
            'longitud'             => $validated['longitud'] ?? null,
            'fecha_programada'     => $validated['fecha_programada'],
            'fecha_fin_programada' => $validated['fecha_fin_programada'],
            'estado'               => 'programado',
            'etiquetas'            => $etiquetas,
        ]);

        return redirect()->back()->with('success', 'Actividad agendada correctamente.');
    }

    /**
     * Gestionar (marcar realizada, reprogramar, cancelar) una actividad del visitador.
     */
    public function gestionarEvento(Request $request, $id)
    {
        $visitador = $this->getVisitador();
        if (!$visitador) {
            return back()->withErrors(['error' => 'Tu usuario no tiene un perfil de visitador vinculado.']);
        }

        $evento = Evento::where('id', $id)->where('visitador_id', $visitador->id)->firstOrFail();

        // No permitir modificar si ya está realizada
        if ($evento->estado === 'realizado') {
            return back()->withErrors(['estado' => 'Esta actividad ya fue completada y no puede ser modificada.']);
        }

        $validated = $request->validate([
            'nombre_evento'        => 'nullable|string|max:255',
            'estado'               => 'required|in:programado,realizado,cancelado,reprogramada',
            'comentario'           => 'nullable|string',
            'ubicacion'            => 'nullable|string|max:255',
            'latitud'              => 'nullable|numeric|between:-90,90',
            'longitud'             => 'nullable|numeric|between:-180,180',
            'fecha_programada'     => 'required|date',
            'fecha_fin_programada' => 'required|date|after:fecha_programada',
            'fecha_realizada'      => 'nullable|date',
            'fecha_fin_real'       => 'nullable|date',
            'etiquetas'            => 'nullable|array',
            'etiquetas.*'          => 'nullable|string|max:50',
        ]);

        $etiquetas = [];
        if (!empty($validated['etiquetas']) && is_array($validated['etiquetas'])) {
            $etiquetas = array_values(array_filter(array_map('trim', $validated['etiquetas'])));
        }

        $ahora = now();
        $updateData = [
            'comentario'           => $validated['comentario'] ?? null,
            'ubicacion'            => $validated['ubicacion'] ?? null,
            'fecha_programada'     => $validated['fecha_programada'],
            'fecha_fin_programada' => $validated['fecha_fin_programada'],
            'etiquetas'            => $etiquetas,
        ];

        if (!empty($validated['nombre_evento'])) {
            $updateData['nombre_evento'] = $validated['nombre_evento'];
        }

        if ($validated['estado'] === 'realizado') {
            $updateData['estado']          = 'realizado';
            $updateData['fecha_realizada'] = $validated['fecha_realizada'] ?: $ahora;
            $updateData['fecha_fin_real']  = $validated['fecha_fin_real'] ?: $ahora;
            if ($request->latitud && $request->longitud) {
                $updateData['latitud']  = $request->latitud;
                $updateData['longitud'] = $request->longitud;
            }
        } elseif ($validated['estado'] === 'cancelado') {
            $updateData['estado'] = 'cancelado';
        } elseif ($validated['estado'] === 'reprogramada' || $validated['estado'] === 'programado') {
            $updateData['estado'] = 'programado';
        }

        $evento->update($updateData);

        return redirect()->back()->with('success', 'Actividad actualizada.');
    }
}