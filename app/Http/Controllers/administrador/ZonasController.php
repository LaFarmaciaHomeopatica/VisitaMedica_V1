<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Zona;
use Illuminate\Http\Request;

class ZonasController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:100|unique:zonas,nombre',
            'descripcion' => 'nullable|string',
            'poligono'    => 'nullable|array',
            'poligono.*'  => 'array|size:2',
        ]);

        Zona::create($data);

        return back()->with('message', 'Zona creada');
    }

    public function update(Request $request, Zona $zona)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:100|unique:zonas,nombre,' . $zona->id,
            'descripcion' => 'nullable|string',
            'poligono'    => 'nullable|array',
            'poligono.*'  => 'array|size:2',
        ]);

        $zona->update($data);

        return back()->with('message', 'Zona actualizada');
    }

    public function destroy(Zona $zona)
    {
        if ($zona->visitadores()->exists()) {
            return back()->with('error', 'No se puede eliminar: hay visitadores asignados a esta zona.');
        }

        $zona->delete();

        return back()->with('message', 'Zona eliminada');
    }
}
