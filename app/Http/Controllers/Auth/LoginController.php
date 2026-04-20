<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoginController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('VISITADOR/Login_1');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $user = Auth::user();

            // Redirección lógica por ID de Rol
            if ($user->id_rol == 1) {
                return redirect()->intended('/PanelAdmin');
            } 
            
            if ($user->id_rol == 2) {
                return redirect()->intended('/panel');
            }

            // Fallback por si existe otro rol
            return redirect()->intended('/panel');
        }

        return back()->withErrors([
            'username' => 'Usuario o contraseña incorrectos.',
        ])->onlyInput('username');
    }

    public function destroy(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}