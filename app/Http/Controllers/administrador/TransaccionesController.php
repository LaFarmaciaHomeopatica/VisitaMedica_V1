<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\Productos; 
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransaccionesController extends Controller
{
    public function index()
    {
        // 1. Cargamos las relaciones basadas en documento y código
        // Laravel usará las llaves foráneas personalizadas que definiste en el modelo
        $transacciones = Transaccion::with([
            'medico:documento,nombre', // Trae solo documento (key) y nombre (visual)
            'producto:codigo,nombre'    // Trae solo código (key) y nombre (visual)
        ])->latest()->get();
        
        return Inertia::render('ADMINISTRADOR/TRANSACCIONES/Gtransacciones', [
            'transacciones' => $transacciones,
            // Enviamos la lista completa para los selects del modal
            'medicos' => Medico::select('nombre', 'documento')->get(),
            'productos' => Productos::select('nombre', 'codigo')->get()
        ]);
    }

    public function store(Request $request)
    {
        // 2. Validamos contra documento y código en sus respectivas tablas
        $validated = $request->validate([
            'medico_documento'    => 'required|exists:medicos,documento',
            'producto_codigo'     => 'required|exists:productos,codigo',
            'unidades_compradas'  => 'integer|min:0',
            'unidades_formuladas' => 'integer|min:0',
            'valor_comprado'      => 'numeric|min:0',
            'valor_formulado'     => 'numeric|min:0',
            'semana'              => 'required|integer|between:1,53',
        ]);

        Transaccion::create($validated);

        return redirect()->route('Gtransacciones.index')
            ->with('message', 'Transacción registrada con éxito');
    }

    public function update(Request $request, Transaccion $transaccion)
    {
        $validated = $request->validate([
            'medico_documento'    => 'required|exists:medicos,documento',
            'producto_codigo'     => 'required|exists:productos,codigo',
            'unidades_compradas'  => 'integer|min:0',
            'unidades_formuladas' => 'integer|min:0',
            'valor_comprado'      => 'numeric|min:0',
            'valor_formulado'     => 'numeric|min:0',
            'semana'              => 'required|integer|between:1,53',
        ]);

        $transaccion->update($validated);

        return redirect()->route('Gtransacciones.index')
            ->with('message', 'Transacción actualizada');
    }

    public function destroy(Transaccion $transaccion)
    {
        $transaccion->delete();

        return redirect()->route('Gtransacciones.index')
            ->with('message', 'Transacción eliminada correctamente');
    }

    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:transacciones,id' 
        ]);

        Transaccion::whereIn('id', $request->ids)->delete();

        return redirect()->route('Gtransacciones.index')
            ->with('message', 'Selección eliminada correctamente');
    }
}