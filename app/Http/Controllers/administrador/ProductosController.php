<?php

namespace App\Http\Controllers\administrador;
use App\Exports\ProductosExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ProductosImport;
use App\Http\Controllers\Controller;
use App\Models\Productos; // <--- Importas el modelo plural
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class ProductosController extends Controller
{
    /**
     * Muestra la lista de productos.
     */
    public function index()
    {
        // Usamos Productos::
        $productos = Productos::latest()->get(); 
        
        return Inertia::render('ADMINISTRADOR/PRODUCTO/Gproductos', [
            'productos' => $productos
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