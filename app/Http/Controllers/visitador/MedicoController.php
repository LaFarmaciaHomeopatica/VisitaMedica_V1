<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Services\OdooService;

class MedicoController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    public function index(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();

        $query = Medico::with('tipoDocumento')
                       ->where('visitador_id', $visitador->id ?? null);

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('nombre', 'like', '%' . $searchTerm . '%')
                  ->orWhere('especialidad', 'like', '%' . $searchTerm . '%')
                  ->orWhere('documento', 'like', '%' . $searchTerm . '%');
            });
        }

        // Registros por página: mínimo 10, máximo 100
        $perPage = max((int) $request->input("per_page", 10), 1);

        $medicos = $query->orderBy('nombre')->paginate($perPage)->withQueryString();
        $this->inyectarEspecialidadOdoo($medicos);

        return Inertia::render('VISITADOR/ListadoMedicos', [
            'medicosDb' => $medicos,
            'filters'   => $request->only(['search', 'per_page'])
        ]);
    }

    /**
     * Reemplaza medico->especialidad (columna local, legado) por la
     * especialidad real resuelta desde el tag de Odoo, igual que hace
     * el admin en Medico2Controller. Solo resuelve los médicos de la
     * página actual, no toda la cartera.
     */
    private function inyectarEspecialidadOdoo(iterable $medicos): void
    {
        $documentos = collect($medicos)->pluck('documento')->filter()->all();
        $especialidades = $this->odoo->getEspecialidadesPorDocumentos($documentos);

        foreach ($medicos as $medico) {
            $medico->especialidad = $especialidades[trim((string) $medico->documento)] ?? 'General';
        }
    }

    public function show(Request $request, $id)
    {
        $medico = Medico::findOrFail($id);
        return redirect()->route('visitador.top-medicos.detalle', [
            'documento' => $medico->documento,
            'mes'       => $request->input('mes', Carbon::now()->format('Y-m')),
            'periodo'   => $request->input('periodo', 'mes_actual'),
            'origen'    => 'listado'
        ]);
    }
}