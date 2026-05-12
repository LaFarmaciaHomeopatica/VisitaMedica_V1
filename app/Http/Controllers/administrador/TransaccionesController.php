<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\Productos; 
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Exports\TransaccionesExport;
use App\Imports\TransaccionesImport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

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
     * Importar transacciones desde Excel (Versión Limpia)
     */
    public function importar(Request $request)
    {
        $request->validate([
            'archivo' => 'required|mimes:xlsx,xls,csv',
        ]);

        try {
            // Ya no es estrictamente necesario el mes para validar, 
            // pero lo pasamos por si en el futuro quieres registrar qué importación fue.
            $mes = $request->input('mes_referencia', now()->format('Y-m'));
            
            Excel::import(new TransaccionesImport($mes), $request->file('archivo'));
            
            return redirect()->back()->with('message', 'Importación completada con éxito');
        } catch (\Exception $e) {
            // En lugar de dd, devolvemos el error a la vista para que el sistema no se rompa
            return redirect()->back()->withErrors(['archivo' => 'Error al procesar el archivo: ' . $e->getMessage()]);
        }
    }

    /**
     * Obtener métricas mensuales para el dashboard/vista
     */
    public function metricas(Request $request)
    {
        // Aquí es donde la magia ocurre: el filtro de fecha se aplica aquí
        // para que las métricas sean exactas aunque el Excel traiga otros meses.
        $mes = $request->input('mes', now()->month);
        $anio = $request->input('anio', now()->year);

        $stats = Transaccion::whereMonth('fecha', $mes)
            ->whereYear('fecha', $anio)
            ->selectRaw('
                SUM(unidades_compradas) as total_compradas,
                SUM(unidades_formuladas) as total_formuladas,
                SUM(valor_comprado) as total_valor_comprado,
                SUM(valor_formulado) as total_valor_formulado
            ')
            ->first();

        return Inertia::render('ADMINISTRADOR/TRANSACCIONES/Metricas', [
            'stats' => $stats,
            'filtros' => [
                'mes' => $mes,
                'anio' => $anio
            ]
        ]);
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
            'fecha'               => 'required|date', 
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
            'fecha'               => 'required|date', 
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