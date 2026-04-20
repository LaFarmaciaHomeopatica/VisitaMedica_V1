<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UsuarioController extends Controller
{
    /**
     * Muestra la lista de usuarios.
     */
    public function index()
    {
        $usuarios = User::all(); // Puedes usar simplePaginate(10) si son muchos
        
        return Inertia::render('ADMINISTRADOR/Gusuarios', [
            'usuarios' => $usuarios
        ]);
    }

    /**
     * Almacena un nuevo usuario.
     */
    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:usuarios,username|max:255',
            'password' => 'required|string|min:6',
            'id_rol'   => 'required|integer',
        ]);

        User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password), // ¡Importante encriptar!
            'id_rol'   => $request->id_rol,
        ]);

        return redirect()->back()->with('success', 'Usuario creado exitosamente.');
    }

    /**
     * Actualiza un usuario existente.
     */
    public function update(Request $request, $id)
    {
        $usuario = User::findOrFail($id);

        $request->validate([
            'username' => 'required|string|max:255|unique:usuarios,username,'.$id,
            'id_rol'   => 'required|integer',
            'password' => 'nullable|string|min:6', // Password opcional al editar
        ]);

        $usuario->username = $request->username;
        $usuario->id_rol = $request->id_rol;

        if ($request->filled('password')) {
            $usuario->password = Hash::make($request->password);
        }

        $usuario->save();

        return redirect()->back()->with('success', 'Usuario actualizado.');
    }

    /**
     * Elimina un usuario.
     */
    public function destroy($id)
    {
        $usuario = User::findOrFail($id);
        
        // Evitar que el admin se borre a sí mismo accidentalmente
        if (auth()->id() == $usuario->id) {
            return redirect()->back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        $usuario->delete();

        return redirect()->back()->with('success', 'Usuario eliminado.');
    }
}