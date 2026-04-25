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
        
        return Inertia::render('ADMINISTRADOR/Gproductos', [
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









  public function import(Request $request)
{
    // 1. Cambiamos la validación: ya no esperamos un archivo, sino un array de datos
    $request->validate([
        'data' => 'required|array',
        'sobreescribir' => 'boolean'
    ]);

    $productosData = $request->input('data');
    $sobreescribir = $request->input('sobreescribir', false);

    try {
        foreach ($productosData as $fila) {
            // Limpiamos los datos del Excel (quitamos espacios extra)
            $codigo = trim($fila['codigo'] ?? '');
            $nombre = trim($fila['nombre'] ?? '');
            $laboratorio = trim($fila['laboratorio'] ?? '');

            if (empty($codigo)) continue; // Saltamos filas vacías

            if ($sobreescribir) {
                // Opción A: Si el código existe, lo actualiza. Si no, lo crea.
                Productos::updateOrCreate(
                    ['codigo' => $codigo],
                    [
                        'nombre' => $nombre,
                        'laboratorio' => $laboratorio
                    ]
                );
            } else {
                // Opción B: Solo lo crea si el código NO existe (evita duplicados)
                Productos::firstOrCreate(
                    ['codigo' => $codigo],
                    [
                        'nombre' => $nombre,
                        'laboratorio' => $laboratorio
                    ]
                );
            }
        }

        return Redirect::route('Gproductos.index')->with('message', 'Importación procesada correctamente.');

    } catch (\Exception $e) {
        // Si algo sale mal, devolvemos el error real para debuguear
        return back()->withErrors(['data' => 'Error al procesar los datos: ' . $e->getMessage()]);
    }
}


// En tu Controller
public function verifyImport(Request $request) 
{
    $request->validate(['archivo' => 'required|mimes:xlsx,xls,csv']);
    
    // Leemos el Excel sin importar
    $rows = \Maatwebsite\Excel\Facades\Excel::toArray(new \App\Imports\ProductosImport, $request->file('archivo'))[0];
    
    $codigosEnExcel = array_column($rows, 'codigo');
    
    // Buscamos cuáles de esos códigos ya existen en la DB
    $duplicados = \App\Models\Productos::whereIn('codigo', $codigosEnExcel)
        ->select('codigo', 'nombre')
        ->get();

    return response()->json([
        'duplicados' => $duplicados,
        'total' => count($rows)
    ]);
}
}