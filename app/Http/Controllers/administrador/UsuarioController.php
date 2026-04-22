<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UsuarioController extends Controller
{
    public function index()
    {
        $usuarios = User::all();
        $roles = Rol::all(); 
        
        return Inertia::render('ADMINISTRADOR/Gusuarios', [
            'usuarios' => $usuarios,
            'roles' => $roles
        ]);
    }

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

        $usuario->delete();

        return redirect()->back()->with('success', 'Usuario eliminado.');
    }
}