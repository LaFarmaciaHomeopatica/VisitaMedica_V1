<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\MedicoTemporal;
use App\Models\Medico;
use App\Models\Categoria;
use App\Models\TipoDocumento;
use App\Models\Visitador; 
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\Medicostempexport;
use App\Imports\MedicosTempImport; // <-- 1. Importamos tu nueva clase Import
use Illuminate\Support\Facades\DB;
use Exception; // <-- Para capturar errores limpiamente

class MedicoTemporalController extends Controller
{
    public function index()
    {
        return Inertia::render('ADMINISTRADOR/MEDICOSTEMP/GmedicosTemporales', [
            'medicosTemporales' => MedicoTemporal::all(),
            'categorias'        => Categoria::all(),
            'tiposDocumento'    => TipoDocumento::all(),
            'visitadores'       => Visitador::all(['id', 'nombre', 'apellido']),
        ]);
    }

    public function promover(Request $request, $id)
    {
        $temporal = MedicoTemporal::findOrFail($id);

        $validated = $request->validate([
            'tipo_documento_id'     => 'required|exists:tipo_documento,id',
            'documento'             => 'required|string|unique:medicos,documento',
            'nombre'                => 'required|string|max:255',
            'especialidad'          => 'nullable|string|max:255',
            'telefono_contacto'     => 'nullable|string|max:50',
            'horario_atencion'      => 'nullable|string|max:255',
            'direccion_detalles'    => 'nullable|string|max:500',
            'geolocalizacion'       => 'nullable|string|max:255',
            'categoria_id'          => 'nullable|exists:categoria,id',
            'visitador_id'          => 'nullable|exists:visitadores,id', 
            'fecha_inicio_relacion' => 'nullable|date',
        ]);

        DB::transaction(function () use ($validated, $temporal) {
            Medico::create($validated);
            $temporal->delete();
        });

        return redirect()->back()->with('success', 'Médico oficializado correctamente.');
    }

    public function destroy($id)
    {
        MedicoTemporal::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Registro eliminado.');
    }

    public function estadisticas($id)
    {
        $medico = MedicoTemporal::findOrFail($id);
        $doc    = $medico->documento;

        $kpis = DB::table('transacciones')
            ->where('medico_documento', $doc)
            ->select(
                DB::raw('COUNT(*)                               as total_transacciones'),
                DB::raw('COALESCE(SUM(valor_comprado),  0)     as valor_comprado'),
                DB::raw('COALESCE(SUM(valor_formulado), 0)     as valor_formulado'),
                DB::raw('COALESCE(SUM(unidades_compradas),  0) as unidades_compradas'),
                DB::raw('COALESCE(SUM(unidades_formuladas), 0) as unidades_formuladas')
            )->first();

        $tendencia = DB::table('transacciones')
            ->where('medico_documento', $doc)
            ->select(
                DB::raw("DATE_FORMAT(fecha, '%Y-%m') as mes"),
                DB::raw('SUM(valor_comprado)      as valor_comprado'),
                DB::raw('SUM(valor_formulado)     as valor_formulado'),
                DB::raw('SUM(unidades_compradas)  as unidades_compradas'),
                DB::raw('COUNT(*)                 as transacciones')
            )
            ->groupBy('mes')->orderBy('mes')->get();

        $topProductos = DB::table('transacciones')
            ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->where('transacciones.medico_documento', $doc)
            ->select(
                'productos.nombre',
                DB::raw('SUM(transacciones.valor_comprado)      as valor_comprado'),
                DB::raw('SUM(transacciones.valor_formulado)     as valor_formulado'),
                DB::raw('SUM(transacciones.unidades_compradas)  as unidades')
            )
            ->groupBy('productos.nombre')
            ->orderByDesc('valor_comprado')
            ->take(5)->get();

        return response()->json([
            'medico'      => [
                'id'           => $medico->id,
                'documento'    => $medico->documento,
                'nombre'       => $medico->nombre_referencia,
                'origen_datos' => $medico->origen_datos,
            ],
            'kpis'        => $kpis,
            'tendencia'   => $tendencia,
            'topProductos'=> $topProductos,
        ]);
    }

    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'exists:medicos_temporales,id',
        ]);

        MedicoTemporal::whereIn('id', $request->ids)->delete();
        return redirect()->back()->with('success', 'Registros eliminados.');
    }

    public function exportar(Request $request)
    {
        $ids = $request->input('ids', []);
        \Log::debug('IDs recibidos:', $ids);
        return Excel::download(new MedicosTempExport($ids), 'medicos_temporales.xlsx');
    }

    public function descargarPlantilla()
    {
        return Excel::download(new \App\Exports\MedicoTempPlantillaExport, 'plantilla_medicos_temporales.xlsx');
    }

    /**
     * MÉTODONUEVO: Procesa la importación del archivo de médicos
     */
    public function importar(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:10240', // Max 10MB
        ]);

        try {
            Excel::import(new MedicosTempImport, $request->file('file'));

            return redirect()->back()->with('success', 'Médicos temporales importados/actualizados con éxito.');
        } catch (Exception $e) {
            return redirect()->back()->with('error', 'Error al importar el archivo: ' . $e->getMessage());
        }
    }
}