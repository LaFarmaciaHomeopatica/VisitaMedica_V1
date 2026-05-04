<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\Productos; 
use Illuminate\Http\Request;
use Inertia\Inertia;
// Importamos las clases de Excel
use App\Exports\TransaccionesExport;
use App\Imports\TransaccionesImport;
use Maatwebsite\Excel\Facades\Excel;

class TransaccionesController extends Controller
{
    public function index()
    {
        $transacciones = Transaccion::with([
            'medico:documento,nombre,apellido', 
            'producto:codigo,nombre'
        ])->latest()->get();
        
        return Inertia::render('ADMINISTRADOR/TRANSACCIONES/Gtransacciones', [
            'transacciones' => $transacciones,
            'medicos' => Medico::select('nombre', 'apellido', 'documento')->get(),
            'productos' => Productos::select('nombre', 'codigo')->get()
        ]);
    }

    /**
     * Exportar transacciones a Excel
     */
    public function exportar()
    {
        return Excel::download(new TransaccionesExport, 'reporte_transacciones_' . now()->format('d-m-Y') . '.xlsx');
    }

    /**
     * Importar transacciones desde Excel
     */
   // TransaccionesController.php

public function importar(Request $request)
{
    $request->validate([
        'archivo' => 'required|mimes:xlsx,xls,csv|max:10240',
    ]);

    try {
        Excel::import(new TransaccionesImport, $request->file('archivo'));

        return redirect()->back()->with('message', 'Proceso finalizado. Algunos registros pudieron ser enviados a Médicos Temporales para su revisión.');
        
    } catch (\Exception $e) {
        return redirect()->back()->withErrors(['archivo' => 'Error: ' . $e->getMessage()]);
    }
}

    public function store(Request $request)
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