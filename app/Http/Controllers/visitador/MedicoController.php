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

class MedicoController extends Controller
{
    public function index(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();

        $query = Medico::with('tipoDocumento')
                       ->where('visitador_id', $visitador->id ?? null);

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('nombre', 'like', '%' . $searchTerm . '%')
                  ->orWhere('apellido', 'like', '%' . $searchTerm . '%')
                  ->orWhere('especialidad', 'like', '%' . $searchTerm . '%')
                  ->orWhere('documento', 'like', '%' . $searchTerm . '%');
            });
        }

        // Registros por página: mínimo 10, máximo 100
        $perPage = max((int) $request->input("per_page", 10), 1);

        $medicos = $query->orderBy('nombre')->paginate($perPage)->withQueryString();

        return Inertia::render('VISITADOR/ListadoMedicos', [
            'medicosDb' => $medicos,
            'filters'   => $request->only(['search', 'per_page'])
        ]);
    }

    public function show(Request $request, $id)
    {
        $medico = Medico::with('tipoDocumento')->findOrFail($id);
        $doc    = $medico->documento;

        // ── Período de tiempo ────────────────────────────────────────────────
        $periodo    = $request->input('periodo', 'all');
        $fechaDesde = match($periodo) {
            '3m' => Carbon::now()->subMonths(3)->startOfMonth()->format('Y-m-d'),
            '6m' => Carbon::now()->subMonths(6)->startOfMonth()->format('Y-m-d'),
            '1y' => Carbon::now()->subMonths(12)->startOfMonth()->format('Y-m-d'),
            '2y' => Carbon::now()->subMonths(24)->startOfMonth()->format('Y-m-d'),
            default => null,
        };

        $txBase = fn() => DB::table('transacciones')
            ->where('medico_documento', $doc)
            ->when($fechaDesde, fn($q) => $q->where('fecha', '>=', $fechaDesde));

        // ── KPIs transacciones ────────────────────────────────────────────────
        $txStats = $txBase()->select(
            DB::raw('COUNT(*) as total_transacciones'),
            DB::raw('COALESCE(SUM(valor_comprado), 0) as total_valor_comprado'),
            DB::raw('COALESCE(SUM(valor_formulado), 0) as total_valor_formulado'),
            DB::raw('COALESCE(SUM(unidades_compradas), 0) as total_unidades'),
            DB::raw('COUNT(DISTINCT producto_codigo) as total_productos')
        )->first();

        // ── Top productos (top 6) ─────────────────────────────────────────────
        $topProductos = $txBase()
            ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->select(
                'productos.nombre',
                'productos.codigo',
                DB::raw('SUM(transacciones.valor_comprado) as valor_comprado'),
                DB::raw('SUM(transacciones.valor_formulado) as valor_formulado'),
                DB::raw('SUM(transacciones.unidades_compradas) as unidades')
            )
            ->groupBy('productos.nombre', 'productos.codigo')
            ->orderByDesc('valor_comprado')
            ->take(6)->get();

        return Inertia::render('VISITADOR/MedicoDetalle', [
            'medico'        => $medico,
            'periodoActivo' => $periodo,
            'txStats'       => $txStats,
            'topProductos'  => $topProductos,
        ]);
    }
}