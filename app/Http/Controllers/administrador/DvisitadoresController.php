<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\User;
use App\Models\TipoDocumento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Carbon\Carbon;

class DvisitadoresController extends Controller
{
    public function index()
    {
        $visitadores = Visitador::with(['tipoDocumento', 'user', 'metas' => function ($query) {
            $query->latest('fecha_meta')->limit(1);
        }])->get();

        return Inertia::render('ADMINISTRADOR/VISITADORES/Gvisitadores', [
            'visitadores' => $visitadores,
            'tiposDocumento' => TipoDocumento::all(['id', 'nombre']),
        ]);
    }

    public function buscarUsuario($id)
    {
        $usuario = User::find($id);
        
        if ($usuario) {
            return response()->json([
                'success' => true,
                'nombre' => $usuario->username 
            ]);
        }

        return response()->json([
            'success' => false,
            'nombre' => null
        ], 404);
    }

    public function store(Request $request)
    {
        $request->validate([
            'usuario_id' => 'required|exists:usuarios,id|unique:visitadores,usuario_id',
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento_id' => 'required|exists:tipo_documento,id', 
            'documento' => 'required|string|unique:visitadores,documento',
            'zona_id' => 'required',
            'estado' => 'required|in:Habilitado,Inhabilitado',
            'meta_dinero' => 'nullable|numeric|min:0',
            'meta_visitas' => 'nullable|integer|min:0',
            'fecha_meta' => 'required|date',
            'fecha_fin_meta' => 'required|date|after_or_equal:fecha_meta', 
            'mes_visual' => 'required|string', // 👈 Volvemos obligatorio para el control de negocio
        ]);

        // 🧠 LÓGICA DEFENSIVA BASADA EN EL MES SELECCIONADO POR EL ADMIN
        $mesVisual = Carbon::parse($request->input('mes_visual') . '-01'); // Ej: 2026-06-01 o 2026-07-01
        $lunesSeleccionado = Carbon::parse($request->input('fecha_meta'));
        $domingoSeleccionado = Carbon::parse($request->input('fecha_fin_meta'));

        // Forzamos el rango a quedarse encerrado ESTRICTAMENTE dentro del mes visual activo
        $fechaInicioAjustada = $lunesSeleccionado->timestamp < $mesVisual->startOfMonth()->timestamp
            ? $mesVisual->startOfMonth()->format('Y-m-d')
            : $lunesSeleccionado->format('Y-m-d');

        $fechaFinAjustada = $domingoSeleccionado->timestamp > $mesVisual->endOfMonth()->timestamp
            ? $mesVisual->endOfMonth()->format('Y-m-d')
            : $domingoSeleccionado->format('Y-m-d');

        // 1. Creamos el visitador omitiendo los campos de la meta y de UI
        $visitador = Visitador::create($request->except(['meta_dinero', 'meta_visitas', 'fecha_meta', 'fecha_fin_meta', 'mes_visual']));

        // 2. Guardamos la meta asociada con las fechas blindadas
        if ($request->has('meta_dinero') || $request->has('meta_visitas')) {
            $visitador->metas()->create([
                'meta_dinero' => $request->input('meta_dinero', 0),
                'meta_visitas' => $request->input('meta_visitas', 0),
                'fecha_meta' => $fechaInicioAjustada,     
                'fecha_fin_meta' => $fechaFinAjustada,   
            ]);
        }

        return Redirect::route('Gvisitadores.index')->with('message', 'Registrado con éxito');
    }

    public function update(Request $request, $id)
    {
        $visitador = Visitador::findOrFail($id);

        $request->validate([
            'usuario_id' => 'required|exists:usuarios,id|unique:visitadores,usuario_id,' . $visitador->id,
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento_id' => 'required|exists:tipo_documento,id',
            'documento' => 'required|string|unique:visitadores,documento,' . $visitador->id,
            'zona_id' => 'required',
            'estado' => 'required|in:Habilitado,Inhabilitado',
            'meta_dinero' => 'nullable|numeric|min:0',
            'meta_visitas' => 'nullable|integer|min:0',
            'fecha_meta' => 'required|date', 
            'fecha_fin_meta' => 'required|date|after_or_equal:fecha_meta', 
            'mes_visual' => 'required|string', // 👈 Volvemos obligatorio aquí también
        ]);

        // 🧠 LÓGICA DEFENSIVA BASADA EN EL MES SELECCIONADO POR EL ADMIN
        $mesVisual = Carbon::parse($request->input('mes_visual') . '-01');
        $lunesSeleccionado = Carbon::parse($request->input('fecha_meta'));
        $domingoSeleccionado = Carbon::parse($request->input('fecha_fin_meta'));

        // Forzamos el rango a quedarse encerrado ESTRICTAMENTE dentro del mes visual activo
        $fechaInicioAjustada = $lunesSeleccionado->timestamp < $mesVisual->startOfMonth()->timestamp
            ? $mesVisual->startOfMonth()->format('Y-m-d')
            : $lunesSeleccionado->format('Y-m-d');

        $fechaFinAjustada = $domingoSeleccionado->timestamp > $mesVisual->endOfMonth()->timestamp
            ? $mesVisual->endOfMonth()->format('Y-m-d')
            : $domingoSeleccionado->format('Y-m-d');

        // 1. Actualizamos el visitador omitiendo las metas y UI
        $visitador->update($request->except(['meta_dinero', 'meta_visitas', 'fecha_meta', 'fecha_fin_meta', 'mes_visual']));

        // 2. Actualizamos o creamos la meta asociada (usando updateOrCreate)
        if ($request->has('meta_dinero') || $request->has('meta_visitas')) {
            $visitador->metas()->updateOrCreate(
                ['visitador_id' => $visitador->id], 
                [                                   
                    'meta_dinero' => $request->input('meta_dinero', 0),
                    'meta_visitas' => $request->input('meta_visitas', 0),
                    'fecha_meta' => $fechaInicioAjustada,   
                    'fecha_fin_meta' => $fechaFinAjustada, 
                ]
            );
        }

        return Redirect::back()->with('message', 'Registro actualizado');
    }

    public function destroy($id)
    {
        $visitador = Visitador::findOrFail($id);
        $visitador->delete();
        
        return Redirect::back()->with('message', 'Visitador eliminado');
    }
}