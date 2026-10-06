<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Etiqueta;
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
                'estado'
            )
            ->with([
                'visitador:id,nombre',
                'etiquetas:id,nombre,color' // Cargar las etiquetas relacionadas
            ])
            ->orderBy('id', 'desc')
            ->get(),

            'etiquetas' => Etiqueta::select('id', 'nombre', 'color') // Catálogo para los selects/comboboxes
                ->orderBy('nombre', 'asc')
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
     * Resuelve y crea etiquetas si no existen, retornando sus IDs.
     */
    private function resolverEtiquetaIds($input): array
    {
        if (empty($input) || !is_array($input)) {
            return [];
        }

        $ids = [];
        foreach ($input as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } elseif (is_string($item) && trim($item) !== '') {
                $nombre = trim($item);
                $etiqueta = Etiqueta::firstOrCreate(['nombre' => $nombre]);
                $ids[] = $etiqueta->id;
            } elseif (is_array($item) && !empty($item['nombre'])) {
                $nombre = trim($item['nombre']);
                $etiqueta = Etiqueta::firstOrCreate(['nombre' => $nombre]);
                $ids[] = $etiqueta->id;
            }
        }

        return array_values(array_unique($ids));
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
            'etiqueta_ids'         => 'nullable|array',
        ]);

        $ids = $request->boolean('todos')
            ? Visitador::pluck('id')->all()
            : ($validated['visitadores_ids'] ?? []);

        if (empty($ids)) {
            return back()->withErrors([
                'visitadores_ids' => 'Selecciona al menos un visitador o marca "Todos".'
            ])->withInput();
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

        $etiquetaIds = $this->resolverEtiquetaIds(
            $request->input('etiquetas', $request->input('etiqueta_ids', []))
        );

        DB::transaction(function () use ($ids, $datos, $etiquetaIds) {
            foreach ($ids as $visitadorId) {
                $evento = Evento::create($datos + ['visitador_id' => $visitadorId]);
                
                // Asignar las etiquetas en la tabla pivote
                if (!empty($etiquetaIds)) {
                    $evento->etiquetas()->sync($etiquetaIds);
                }
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
            'etiqueta_ids'         => 'nullable|array',
        ]);

        $etiquetaIds = $this->resolverEtiquetaIds(
            $request->input('etiquetas', $request->input('etiqueta_ids', []))
        );

        DB::transaction(function () use ($evento, $validated, $etiquetaIds) {
            $evento->update(collect($validated)->except(['etiquetas', 'etiqueta_ids'])->all());

            // Actualizar la relación en la tabla pivote
            $evento->etiquetas()->sync($etiquetaIds);
        });

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