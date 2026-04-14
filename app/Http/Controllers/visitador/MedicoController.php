<?php

namespace App\Http\Controllers;

use App\Services\MedicoService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicoController extends Controller
{
    protected $medicoService;

    public function __construct(MedicoService $medicoService)
    {
        $this->medicoService = $medicoService;
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        
        $medicos = $this->medicoService->obtenerListadoParaVisita($search);
        $stats = $this->medicoService->obtenerEstadisticasVisitas();

        return Inertia::render('ListadoMedicos', [
            'medicosDb' => $medicos,
            'stats' => $stats,
            'filters' => $request->only(['search'])
        ]);
    }
}