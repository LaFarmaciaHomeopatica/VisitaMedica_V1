<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UsuarioController extends Controller
{
    // La vista de listado vive ahora en Configuración (pestaña "Usuarios",
    // servida por ListasPreciosController::index). Este controlador solo
    // maneja las acciones de escritura, que la pestaña sigue usando tal cual.

    public function store(Request $request)
    {
        $request->validate([
            // Asegúrate de que la tabla sea 'usuarios' o 'users' según tu DB
            'username' => 'required|string|unique:usuarios,username|max:255',
            'password' => 'required|string|min:6',
            'id_rol'   => 'required|exists:roles,id',
            // CAMBIO: Ahora acepta los strings que manda el select de React
            'estado'   => 'required|in:habilitado,inhabilitado', 
        ]);

        User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'id_rol'   => $request->id_rol,
            'estado'   => $request->estado, 
        ]);

        return redirect()->back()->with('success', 'Usuario creado exitosamente.');
    }

    public function update(Request $request, $id)
    {
        $usuario = User::findOrFail($id);

        $request->validate([
            'username' => 'required|string|max:255|unique:usuarios,username,'.$id,
            'id_rol'   => 'required|exists:roles,id',
            'password' => 'nullable|string|min:6',
            'estado'   => 'required|in:habilitado,inhabilitado',
        ]);

        $usuario->username = $request->username;
        $usuario->id_rol = $request->id_rol;
        $usuario->estado = $request->estado;

        if ($request->filled('password')) {
            $usuario->password = Hash::make($request->password);
        }

        $usuario->save();

        return redirect()->back()->with('success', 'Usuario actualizado.');
    }

    public function destroy($id)
    {
        $usuario = User::findOrFail($id);

        if (auth()->id() == $usuario->id) {
            return redirect()->back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        if (DB::table('visitadores')->where('usuario_id', $id)->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar: el usuario tiene un visitador asignado. Reasigna el visitador primero.');
        }

        $usuario->delete();

        return redirect()->back()->with('success', 'Usuario eliminado.');
    }
}