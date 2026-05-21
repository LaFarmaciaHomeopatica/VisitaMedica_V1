<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico;
use App\Models\Visita; // 👈 Importamos Visita para el conteo del panel
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class VisitadorController extends Controller
{
    /**
     * MÉTODOS DEL PANEL PRINCIPAL UNIFICADO
     */
   public function index()
    {
        // Cargamos el visitador y le ordenamos que traiga la meta más nueva según 'created_at'
        $visitador = Visitador::with(['tipoDocumento', 'metas' => function ($query) {
            $query->latest()->limit(1);
        }])
        ->where('usuario_id', Auth::id())
        ->first();

        $medicos = $visitador ? $visitador->medicos : [];

        // Obtener las visitas para los cálculos métricos directamente mediante Inertia
        $visitas = $visitador 
            ? Visita::where('visitador_id', $visitador->id)->get() 
            : [];

        return Inertia::render('VISITADOR/panel', [
            'visitador' => $visitador,
            'medicos'   => $medicos,
            'visitasData' => $visitas 
        ]);
    }
    /**
     * VISTA DEL PERFIL (Simplificada)
     */
    public function perfil()
    {
        // 🔥 CORREGIDO: También añadimos 'metas' aquí por si tu vista de perfil las necesita mostrar
        $visitador = Visitador::with(['tipoDocumento', 'metas'])
            ->where('usuario_id', Auth::id())
            ->first();

        return Inertia::render('VISITADOR/visitador', [
            'visitador' => $visitador
        ]);
    }

    public function show($id)
    {
        // 🔥 CORREGIDO: Añadimos 'metas' para la consistencia al ver el detalle
        $visitador = Visitador::with(['tipoDocumento', 'metas'])->findOrFail($id);
        $medicos = Medico::where('visitador_id', $visitador->id)->get();

        return Inertia::render('VISITADOR/visitador', [
            'visitador' => $visitador,
            'medicos'   => $medicos
        ]);
    } 
}