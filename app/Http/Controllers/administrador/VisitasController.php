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

            'visitadores' => Visitador::select('id', 'nombre')->get(),

            'productos' => Productos::select('id', 'codigo', 'nombre')
                ->orderBy('nombre', 'asc')
                ->get(),
        ]);
    }

    /**
     * Devuelve los médicos de un visitador específico (carga bajo demanda).
     */
    public function medicosPorVisitador($visitadorId)
    {
        $medicos = Medico::where('visitador_id', $visitadorId)
            ->select(
                'id',
                'nombre',
                'documento',
                'visitador_id',
                'direccion_detalles',
                'geolocalizacion'
            )
            ->orderBy('nombre', 'asc')
            ->get();

        return response()->json($medicos);
    }

    /**
     * Almacena una nueva visita.
     */
    public function store(Request $request)
    {
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

        Visita::create($validated);

        return back()->with('success', 'Visita creada correctamente.');
    }

    /**
     * Actualiza una visita existente.
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

        $visita->update($validated);

        return back()->with('success', 'Visita actualizada correctamente.');
    }

    /**
     * Elimina una visita.
     */
    public function destroy($id)
    {
        $visita = Visita::findOrFail($id);
        $visita->delete();

        return back()->with('success', 'Visita eliminada correctamente.');
    }

    public function destroyBulk(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer|exists:visitas,id']);
        Visita::whereIn('id', $request->ids)->delete();

        return back()->with('success', 'Visitas eliminadas correctamente.');
    }

    /**
     * Muestra la vista del mapa de calor con las coordenadas registradas.
     */
    public function mapaCalor()
    {
        $puntos = Visita::whereNotNull('latitud')
            ->whereNotNull('longitud')
            ->select('id', 'latitud', 'longitud', 'fecha_programada', 'fecha_realizada', 'visitador_id', 'medico_id')
            ->with([
                'medico:id,nombre',
                'visitador:id,nombre'
            ])
            ->get()
            ->map(function ($v) {
                return [
                    'id'               => $v->id,
                    'lat'              => (float) $v->latitud,
                    'lng'              => (float) $v->longitud,
                    'visitador_id'     => $v->visitador_id,
                    'medico'           => $v->medico ? $v->medico->nombre : 'Sin médico',
                    'visitador'        => $v->visitador ? $v->visitador->nombre : 'Sin visitador',
                    'fecha_programada' => $v->fecha_programada,
                    'fecha_realizada'  => $v->fecha_realizada,
                ];
            });

        return Inertia::render('ADMINISTRADOR/VISITAS/MapaCalorVisitas', [
            'puntos'      => $puntos,
            'visitadores' => \App\Models\Visitador::select('id', 'nombre')->orderBy('nombre', 'asc')->get(),
        ]);
    }
}