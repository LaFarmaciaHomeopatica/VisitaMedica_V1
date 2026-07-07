<?php

namespace App\Http\Controllers\administrador;
use App\Exports\ProductosExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ProductosImport;
use App\Http\Controllers\Controller;
use App\Models\Productos;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProductosController extends Controller
{
    /**
     * Muestra la lista de productos.
     */
    public function index(Request $request)
    {
        $productos       = Productos::latest()->get();
        $productoFiltro  = $request->input('producto_codigo');

        // Closure base para filtrar transacciones por producto (opcional)
        $tx = fn() => DB::table('transacciones')
            ->when($productoFiltro, fn($q) => $q->where('producto_codigo', $productoFiltro));

        // ── KPIs ──────────────────────────────────────────────────────────────
        $kpis = $tx()->select(
            DB::raw('COALESCE(SUM(valor_comprado),  0) as valor_comprado'),
            DB::raw('COALESCE(SUM(valor_formulado), 0) as valor_formulado'),
            DB::raw('COALESCE(SUM(unidades_compradas),  0) as unidades_compradas'),
            DB::raw('COALESCE(SUM(unidades_formuladas), 0) as unidades_formuladas'),
            DB::raw('COUNT(DISTINCT producto_codigo)       as productos_activos'),
            DB::raw('COUNT(*)                              as total_transacciones')
        )->first();

        // ── Top 10 productos ──────────────────────────────────────────────────
        $topProductos = DB::table('transacciones')
            ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->when($productoFiltro, fn($q) => $q->where('transacciones.producto_codigo', $productoFiltro))
            ->select(
                'productos.nombre',
                'productos.laboratorio',
                DB::raw('SUM(transacciones.valor_comprado)       as valor_comprado'),
                DB::raw('SUM(transacciones.valor_formulado)      as valor_formulado'),
                DB::raw('SUM(transacciones.unidades_compradas)   as unidades_compradas'),
                DB::raw('SUM(transacciones.unidades_formuladas)  as unidades_formuladas'),
                DB::raw('COUNT(DISTINCT transacciones.medico_documento) as medicos')
            )
            ->groupBy('productos.nombre', 'productos.laboratorio')
            ->orderByDesc('valor_comprado')
            ->take(10)->get();

        // ── Ranking por laboratorio ────────────────────────────────────────────
        $porLaboratorio = DB::table('transacciones')
            ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->when($productoFiltro, fn($q) => $q->where('transacciones.producto_codigo', $productoFiltro))
            ->select(
                'productos.laboratorio',
                DB::raw('COUNT(DISTINCT productos.codigo)               as num_productos'),
                DB::raw('SUM(transacciones.valor_comprado)              as valor_comprado'),
                DB::raw('SUM(transacciones.valor_formulado)             as valor_formulado'),
                DB::raw('SUM(transacciones.unidades_compradas)          as unidades_compradas'),
                DB::raw('COUNT(DISTINCT transacciones.medico_documento) as medicos')
            )
            ->groupBy('productos.laboratorio')
            ->orderByDesc('valor_comprado')
            ->get();

        // ── Tendencia histórica completa (todos los meses con datos) ──────────
        $tendencia = $tx()
            ->select(
                DB::raw("DATE_FORMAT(fecha, '%Y-%m') as mes"),
                DB::raw('SUM(valor_comprado)      as valor_comprado'),
                DB::raw('SUM(valor_formulado)     as valor_formulado'),
                DB::raw('SUM(unidades_compradas)  as unidades_compradas'),
                DB::raw('SUM(unidades_formuladas) as unidades_formuladas')
            )
            ->groupBy('mes')->orderBy('mes')->get();

        // ── Top 10 médicos por comprado y por formulado ───────────────────────
        $medBase = fn($orderBy) => DB::table('transacciones')
            ->leftJoin('medicos',           'transacciones.medico_documento', '=', 'medicos.documento')
            ->leftJoin('medicos_temporales','transacciones.medico_documento', '=', 'medicos_temporales.documento')
            ->when($productoFiltro, fn($q) => $q->where('transacciones.producto_codigo', $productoFiltro))
            ->select(
                'transacciones.medico_documento',
                DB::raw("MIN(COALESCE(medicos.nombre, medicos_temporales.nombre_referencia, transacciones.medico_documento)) as nombre_medico"),
                DB::raw('SUM(transacciones.valor_comprado)      as valor_comprado'),
                DB::raw('SUM(transacciones.valor_formulado)     as valor_formulado'),
                DB::raw('SUM(transacciones.unidades_compradas)  as unidades_compradas'),
                DB::raw('SUM(transacciones.unidades_formuladas) as unidades_formuladas'),
                DB::raw('COUNT(*)                               as transacciones')
            )
            ->groupBy('transacciones.medico_documento')
            ->orderByDesc($orderBy)
            ->take(10)->get();

        return Inertia::render('ADMINISTRADOR/PRODUCTO/Gproductos', [
            'productos'       => $productos,
            'productoActivo'  => $productoFiltro,
            'statsProductos'  => [
                'total'               => $productos->count(),
                'laboratorios'        => $productos->pluck('laboratorio')->unique()->filter()->count(),
                'activos'             => (int)   ($kpis->productos_activos    ?? 0),
                'total_transacciones' => (int)   ($kpis->total_transacciones  ?? 0),
                'valor_comprado'      => (float) ($kpis->valor_comprado       ?? 0),
                'valor_formulado'     => (float) ($kpis->valor_formulado      ?? 0),
                'unidades_compradas'  => (int)   ($kpis->unidades_compradas   ?? 0),
                'unidades_formuladas' => (int)   ($kpis->unidades_formuladas  ?? 0),
            ],
            'topProductos'    => $topProductos,
            'porLaboratorio'  => $porLaboratorio,
            'tendencia'       => $tendencia,
            'topCompradores'  => $medBase('valor_comprado'),
            'topFormuladores' => $medBase('valor_formulado'),
        ]);
    }

    /**
     * Almacena un nuevo producto.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre'      => 'required|string|max:150',
            'laboratorio' => 'nullable|string|max:100',
            'codigo'      => 'required|string|max:50|unique:productos,codigo',
        ]);

        // CAMBIO: Debe ser Productos::
        Productos::create($validated);

        return Redirect::route('Gproductos.index')->with('message', 'Producto creado con éxito.');
    }

    /**
     * Actualiza un producto específico.
     */
    // CAMBIO: El Type-hint debe ser Productos $producto
    public function update(Request $request, Productos $producto)
    {
        $validated = $request->validate([
            'nombre'      => 'required|string|max:150',
            'laboratorio' => 'nullable|string|max:100',
            'codigo'      => 'required|string|max:50|unique:productos,codigo,' . $producto->id,
        ]);

        $producto->update($validated);

        return Redirect::route('Gproductos.index')->with('message', 'Producto actualizado.');
    }

    /**
     * Elimina un producto.
     */
    // CAMBIO: El Type-hint debe ser Productos $producto
    public function destroy(Request $request, $id = null)
{
    // 1. Intentamos obtener IDs del cuerpo (borrado múltiple)
    $ids = $request->input('ids');

    if ($ids && is_array($ids)) {
        // Borrado masivo
        Productos::whereIn('id', $ids)->delete();
        $mensaje = count($ids) . " productos eliminados.";
    } 
    elseif ($id) {
        // Borrado individual (si viene por URL)
        $producto = Productos::findOrFail($id);
        $producto->delete();
        $mensaje = "Producto eliminado.";
    }
    else {
        return back()->with('error', 'No se especificó qué eliminar.');
    }

    return Redirect::route('Gproductos.index')->with('message', $mensaje);
}


public function export(Request $request) 
{
    abort(500, "Si ves esto, el controlador es correcto");
    // ... resto del código
}



 public function import(Request $request)
{
    $request->validate([
        'data' => 'required|array',
        'sobreescribir' => 'boolean'
    ]);

    $productosData = $request->input('data');
    $sobreescribir = $request->input('sobreescribir', false);

    try {
        // 1. Limpiamos y preparamos los datos en un solo array
        $dataParaProcesar = [];
        foreach ($productosData as $fila) {
            $codigo = trim($fila['codigo'] ?? '');
            if (empty($codigo)) continue;

            $dataParaProcesar[] = [
                'codigo'      => $codigo,
                'nombre'      => trim($fila['nombre'] ?? ''),
                'laboratorio' => trim($fila['laboratorio'] ?? ''),
                // Si tienes timestamps manuales, inclúyelos aquí:
                // 'created_at' => now(),
                // 'updated_at' => now(),
            ];
        }

        // 2. Procesamos todo en UNA SOLA consulta SQL esto es importante para optimizar el rendimiento.
        if ($sobreescribir) {
            // Actualiza si existe, inserta si no.
            Productos::upsert(
                $dataParaProcesar, 
                ['codigo'],           // Columna única para comparar
                ['nombre', 'laboratorio'] // Columnas a actualizar
            );
        } else {
            // Inserta solo los que no existen, ignora los duplicados.
            Productos::insertOrIgnore($dataParaProcesar);
        }

        return Redirect::route('Gproductos.index')->with('message', 'Importación masiva completada con éxito.');

    } catch (\Exception $e) {
        return back()->withErrors(['data' => 'Error: ' . $e->getMessage()]);
    }
}


public function verifyImport(Request $request) 
{
    $request->validate(['archivo' => 'required|mimes:xlsx,xls,csv']);
    
    $rows = \Maatwebsite\Excel\Facades\Excel::toArray(new \App\Imports\ProductosImport, $request->file('archivo'))[0];

    // --- AGREGAR ESTA LIMPIEZA ---
    // Esto convierte todas las llaves de cada fila a minúsculas y sin espacios
    $rows = array_map(function($row) {
        return array_change_key_case($row, CASE_LOWER);
    }, $rows);
    // -----------------------------
    
    // Ahora 'codigo' funcionará aunque en el Excel diga 'CODIGO' o 'Codigo'
    $codigosEnExcel = array_filter(array_column($rows, 'codigo')); 
    
    $duplicados = \App\Models\Productos::whereIn('codigo', $codigosEnExcel)
        ->select('codigo', 'nombre')
        ->get();

    return response()->json([
        'duplicados' => $duplicados,
        'total' => count($rows),
        'data' => $rows // Enviamos la data limpia al frontend para el import final
    ]);
}


}