<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\Request;

class CategoriasController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'       => 'required|string|max:50|unique:categoria,nombre',
            'descripcion'  => 'nullable|string',
            'valor_minimo' => 'required|numeric|min:0',
        ]);

        Categoria::create($data);

        return back()->with('message', 'Categoría creada');
    }

    public function update(Request $request, Categoria $categoria)
    {
        $data = $request->validate([
            'nombre'       => 'required|string|max:50|unique:categoria,nombre,' . $categoria->id,
            'descripcion'  => 'nullable|string',
            'valor_minimo' => 'required|numeric|min:0',
        ]);

        $categoria->update($data);

        return back()->with('message', 'Categoría actualizada');
    }

    public function destroy(Categoria $categoria)
    {
        if ($categoria->historial()->exists() || $categoria->medicos()->exists()) {
            return back()->with('error', 'No se puede eliminar: hay médicos con esta categoría (actual o histórica).');
        }

        $categoria->delete();

        return back()->with('message', 'Categoría eliminada');
    }
}
