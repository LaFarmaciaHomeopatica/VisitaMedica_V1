<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Evento;
use App\Models\Visita;
use App\Models\Visitador;
use App\Models\Productos;
use Illuminate\Http\Request;
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
     * Crea el evento para varios visitadores (o todos) a la vez.
     * Se crea un registro por visitador. Si alguno tiene el horario ocupado,
     * no se crea ninguno y se informa quiénes están ocupados.
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

        if ($validated['estado'] !== 'cancelado') {
            $ocupados = $this->visitadoresOcupados(
                $ids,
                $validated['fecha_programada'],
                $validated['fecha_fin_programada']
            );

            if (!empty($ocupados)) {
                $nombres = Visitador::whereIn('id', $ocupados)->orderBy('nombre')->pluck('nombre')->implode(', ');

                return back()->withErrors([
                    'fecha_programada' => "Estos visitadores ya tienen una actividad en ese horario: {$nombres}. "
                        . 'Quítalos de la selección, cambia el horario o reprograma/cancela su actividad.'
                ])->withInput();
            }
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
     * Actualiza un evento individual (de un solo visitador).
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

        // Un evento cancelado libera el horario, por eso no se valida cruce.
        if ($validated['estado'] !== 'cancelado') {
            $ocupados = $this->visitadoresOcupados(
                [(int) $validated['visitador_id']],
                $validated['fecha_programada'],
                $validated['fecha_fin_programada'],
                $evento->id
            );

            if (!empty($ocupados)) {
                return back()->withErrors([
                    'fecha_programada' => 'El visitador ya tiene una actividad en ese horario. '
                        . 'Cambia el horario o reprograma/cancela la otra actividad.'
                ]);
            }
        }

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

    /**
     * IDs de visitadores ocupados en el rango: con otro evento activo
     * o con una visita programada dentro del rango.
     * Las visitas canceladas o reprogramadas no bloquean.
     */
    private function visitadoresOcupados(array $ids, $inicio, $fin, $ignorarEventoId = null): array
    {
        $porEventos = Evento::visitadoresOcupados($ids, $inicio, $fin, $ignorarEventoId);

        $porVisitas = Visita::whereIn('visitador_id', $ids)
            ->whereNotIn('estado', ['cancelada', 'reprogramada'])
            ->where('fecha_programada', '>=', $inicio)
            ->where('fecha_programada', '<', $fin)
            ->pluck('visitador_id')
            ->unique()
            ->all();

        return array_values(array_unique(array_merge($porEventos, $porVisitas)));
    }
}