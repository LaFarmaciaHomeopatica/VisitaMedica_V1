<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\User;
use App\Models\TipoDocumento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class DvisitadoresController extends Controller
{
    public function index()
    {
        // Importante: El modelo Visitador debe tener la relación 'user' 
        // apuntando al modelo User (que ahora usa la tabla usuarios)
        $visitadores = Visitador::with(['tipoDocumento', 'user'])->get();

        return Inertia::render('ADMINISTRADOR/Gvisitadores', [
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
                // Usamos 'username' que es el nombre real en tu tabla usuarios
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
            'estado' => 'required|in:habilitado,deshabilitado',
        ]);

        Visitador::create($request->all());
        return Redirect::route('Gvisitadores.index')->with('message', 'Registrado con éxito');
    }

    public function update(Request $request, $id)
    {
        $visitador = Visitador::findOrFail($id);

        $request->validate([
            // REGLA CLAVE: Validamos contra 'usuarios' y permitimos que el usuario_id
            // se mantenga igual si pertenece a este mismo visitador ($visitador->id)
            'usuario_id' => 'required|exists:usuarios,id|unique:visitadores,usuario_id,' . $visitador->id,
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento_id' => 'required|exists:tipo_documento,id',
            'documento' => 'required|string|unique:visitadores,documento,' . $visitador->id,
            'zona_id' => 'required',
            'estado' => 'required|in:habilitado,deshabilitado',
        ]);

        $visitador->update($request->all());

        // Es mejor usar back() para recargar la página actual con los nuevos datos
        return Redirect::back()->with('message', 'Registro actualizado');
    }

    public function destroy($id)
    {
        $visitador = Visitador::findOrFail($id);
        $visitador->delete();
        return Redirect::back()->with('message', 'Visitador eliminado');
    }
}