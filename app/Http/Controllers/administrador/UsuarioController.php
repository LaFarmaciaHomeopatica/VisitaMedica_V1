<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Rol; // 1. IMPORTA EL MODELO ROL
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UsuarioController extends Controller
{
    /**
     * Muestra la lista de usuarios y los roles disponibles.
     */
    public function index()
    {
        // 2. OBTÉN LOS ROLES DE LA DB
        $usuarios = User::all();
        $roles = Rol::all(); 
        
        return Inertia::render('ADMINISTRADOR/Gusuarios', [
            'usuarios' => $usuarios,
            'roles' => $roles // 3. PÁSALOS A LA VISTA
        ]);
    }

    /**
     * Almacena un nuevo usuario.
     */
    public function store(Request $request)
    {
        $request->validate([
            // Asegúrate de que el nombre de la tabla coincida (¿'usuarios' o 'users'?)
            'username' => 'required|string|unique:usuarios,username|max:255',
            'password' => 'required|string|min:6',
            'id_rol'   => 'required|exists:roles,id', // 4. VALIDACIÓN MEJORADA: verifica que el ID exista en la tabla roles
        ]);

        User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
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
            'id_rol'   => 'required|exists:roles,id', // Validación de existencia
            'password' => 'nullable|string|min:6',
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
        
        if (auth()->id() == $usuario->id) {
            return redirect()->back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        $usuario->delete();

        return redirect()->back()->with('success', 'Usuario eliminado.');
    }
}