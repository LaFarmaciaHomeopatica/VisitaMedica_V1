<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Evento;
use App\Models\Visita;
use App\Models\Visitador;
use App\Models\Productos;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class EventosController extends Controller
{
    /**
     * Muestra la lista de eventos.
     */
    public function index()
    {
        return Inertia::render('ADMINISTRADOR/EVENTOS/Geventos', [
            'eventos' => Evento::select(
                'id',
                'visitador_id',
                'nombre_evento',
                'comentario',
                'ubicacion',
                'latitud',
                'longitud',
                'fecha_programada',
                'fecha_fin_programada',
                'fecha_realizada',
                'fecha_fin_real',
                'estado',
                'etiquetas'
            )
            ->with('visitador:id,nombre')
            ->orderBy('id', 'desc')
            ->get(),

            'visitas' => Visita::select(
                'id',
                'visitador_id',
                'medico_id',
                'fecha_programada',
                'fecha_realizada',
                'fecha_fin_real',
                'latitud',
                'longitud',
                'estado',
                'comentarios',
                'muestras',
                'comentario_muestra'
            )
            ->with([
                'medico:id,nombre,documento,direccion_detalles,geolocalizacion',
                'visitador:id,nombre'
            ])
            ->orderBy('id', 'desc')
            ->get(),

            'visitadores' => Visitador::select('id', 'nombre')
                ->orderBy('nombre', 'asc')
                ->get(),

            'productos' => Productos::select('id', 'codigo', 'nombre')
                ->orderBy('nombre', 'asc')
                ->get(),
        ]);
    }

    /**
     * Crea el evento para varios visitadores (o todos) a la vez sin validar cruce de horarios.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'todos'                => 'nullable|boolean',
            'visitadores_ids'      => 'nullable|array',
            'visitadores_ids.*'    => 'integer|exists:visitadores,id',
            'nombre_evento'        => 'required|string|max:255',
            'comentario'           => 'nullable|string',
            'ubicacion'            => 'nullable|string|max:255',
            'latitud'              => 'nullable|numeric|between:-90,90',
            'longitud'             => 'nullable|numeric|between:-180,180',
            'fecha_programada'     => 'required|date',
            'fecha_fin_programada' => 'required|date|after:fecha_programada',
            'estado'               => 'required|in:programado,realizado,cancelado',
            'etiquetas'            => 'nullable|array',
            'etiquetas.*'          => 'nullable|string|max:50',
        ]);

        $ids = $request->boolean('todos')
            ? Visitador::pluck('id')->all()
            : ($validated['visitadores_ids'] ?? []);

        if (empty($ids)) {
            return back()->withErrors([
                'visitadores_ids' => 'Selecciona al menos un visitador o marca "Todos".'
            ])->withInput();
        }

        $etiquetas = [];
        if (!empty($validated['etiquetas']) && is_array($validated['etiquetas'])) {
            $etiquetas = array_values(array_filter(array_map('trim', $validated['etiquetas'])));
        }

        $datos = collect($validated)->only([
            'nombre_evento',
            'comentario',
            'ubicacion',
            'latitud',
            'longitud',
            'fecha_programada',
            'fecha_fin_programada',
            'estado',
        ])->all();
        $datos['etiquetas'] = $etiquetas;

        DB::transaction(function () use ($ids, $datos) {
            foreach ($ids as $visitadorId) {
                Evento::create($datos + ['visitador_id' => $visitadorId]);
            }
        });

        $total = count($ids);

        return back()->with(
            'success',
            $total === 1 ? 'Actividad creada correctamente.' : "Actividad asignada a {$total} visitadores."
        );
    }

    /**
     * Actualiza un evento individual sin validar cruce de horarios.
     */
    public function update(Request $request, $id)
    {
        $evento = Evento::findOrFail($id);

        $validated = $request->validate([
            'visitador_id'         => 'required|exists:visitadores,id',
            'nombre_evento'        => 'required|string|max:255',
            'comentario'           => 'nullable|string',
            'ubicacion'            => 'nullable|string|max:255',
            'latitud'              => 'nullable|numeric|between:-90,90',
            'longitud'             => 'nullable|numeric|between:-180,180',
            'fecha_programada'     => 'required|date',
            'fecha_fin_programada' => 'required|date|after:fecha_programada',
            'fecha_realizada'      => 'nullable|date',
            'fecha_fin_real'       => 'nullable|date',
            'estado'               => 'required|in:programado,realizado,cancelado',
            'etiquetas'            => 'nullable|array',
            'etiquetas.*'          => 'nullable|string|max:50',
        ]);

        $etiquetas = [];
        if (!empty($validated['etiquetas']) && is_array($validated['etiquetas'])) {
            $etiquetas = array_values(array_filter(array_map('trim', $validated['etiquetas'])));
        }
        $validated['etiquetas'] = $etiquetas;

        $evento->update($validated);

        return back()->with('success', 'Actividad actualizada correctamente.');
    }

    /**
     * Elimina un evento.
     */
    public function destroy($id)
    {
        Evento::findOrFail($id)->delete();

        return back()->with('success', 'Actividad eliminada correctamente.');
    }

    public function destroyBulk(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer|exists:eventos,id',
        ]);

        Evento::whereIn('id', $request->ids)->delete();

        return back()->with('success', 'Actividades eliminadas correctamente.');
    }
}