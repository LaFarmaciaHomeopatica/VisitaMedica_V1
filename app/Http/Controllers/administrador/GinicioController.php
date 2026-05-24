<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\Visitador;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class GinicioController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $mesParam  = $request->input('mes', Carbon::now()->format('Y-m'));
        $inicio    = Carbon::parse($mesParam . '-01')->startOfMonth();
        $fin       = $inicio->copy()->endOfMonth();

        // --- KPIs del mes seleccionado ---
        $statsMes = Transaccion::whereBetween('fecha', [$inicio, $fin])
            ->select(
                DB::raw('COUNT(*)                               as total_transacciones'),
                DB::raw('COALESCE(SUM(valor_comprado),  0)     as valor_comprado'),
                DB::raw('COALESCE(SUM(valor_formulado), 0)     as valor_formulado'),
                DB::raw('COALESCE(SUM(unidades_compradas),  0) as unidades_compradas'),
                DB::raw('COALESCE(SUM(unidades_formuladas), 0) as unidades_formuladas'),
                DB::raw('COUNT(DISTINCT medico_documento)       as medicos_con_tx')
            )->first();

        // --- Tendencia histórica (sin filtro, siempre completa) ---
        $tendencia = Transaccion::select(
            DB::raw("DATE_FORMAT(fecha, '%Y-%m') as mes"),
            DB::raw('SUM(valor_comprado)      as valor_comprado'),
            DB::raw('SUM(valor_formulado)     as valor_formulado'),
            DB::raw('COUNT(*)                 as transacciones')
        )->groupBy('mes')->orderBy('mes')->get();

        // --- Top 5 productos del mes ---
        $topProductos = DB::table('transacciones')
            ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->whereBetween('transacciones.fecha', [$inicio, $fin])
            ->select(
                'productos.nombre',
                DB::raw('SUM(transacciones.valor_comprado) as valor_comprado'),
                DB::raw('SUM(transacciones.unidades_compradas) as unidades')
            )
            ->groupBy('productos.nombre')
            ->orderByDesc('valor_comprado')
            ->take(5)->get();

        // --- Resumen de visitadores del mes ---
        $visitadoresResumen = DB::table('visitadores')
            ->leftJoin('visitas', function ($j) use ($inicio, $fin) {
                $j->on('visitadores.id', '=', 'visitas.visitador_id')
                  ->whereBetween('visitas.fecha_programada', [$inicio, $fin]);
            })
            ->select(
                'visitadores.id',
                'visitadores.nombre',
                'visitadores.apellido',
                DB::raw('COUNT(visitas.id)                                               as total_visitas'),
                DB::raw("SUM(CASE WHEN visitas.estado = 'efectiva'   THEN 1 ELSE 0 END) as efectivas"),
                DB::raw("SUM(CASE WHEN visitas.estado = 'programada' THEN 1 ELSE 0 END) as programadas"),
                DB::raw("SUM(CASE WHEN visitas.estado = 'cancelada'  THEN 1 ELSE 0 END) as canceladas")
            )
            ->groupBy('visitadores.id', 'visitadores.nombre', 'visitadores.apellido')
            ->get();

        // --- Visitas por estado del mes ---
        $visitasPorEstado = DB::table('visitas')
            ->whereBetween('fecha_programada', [$inicio, $fin])
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->get();

        // --- Últimas 8 transacciones del mes ---
        $ultimasTransacciones = DB::table('transacciones')
            ->whereBetween('transacciones.fecha', [$inicio, $fin])
            ->leftJoin('medicos', 'transacciones.medico_documento', '=', 'medicos.documento')
            ->leftJoin('medicos_temporales', 'transacciones.medico_documento', '=', 'medicos_temporales.documento')
            ->leftJoin('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->select(
                'transacciones.id',
                'transacciones.fecha',
                'transacciones.medico_documento',
                DB::raw("COALESCE(CONCAT(medicos.nombre,' ',medicos.apellido), medicos_temporales.nombre_referencia, transacciones.medico_documento) as nombre_medico"),
                'transacciones.producto_codigo',
                DB::raw('COALESCE(productos.nombre, transacciones.producto_codigo) as nombre_producto'),
                'transacciones.valor_comprado',
                'transacciones.valor_formulado',
                'transacciones.unidades_compradas'
            )
            ->orderByDesc('transacciones.updated_at')
            ->take(8)->get();

        return Inertia::render('ADMINISTRADOR/Ginicio', [
            'mesActual' => $mesParam,
            'stats' => [
                'visitadores'          => Visitador::count(),
                'medicos'              => Medico::count(),
                'medicos_temporales'   => MedicoTemporal::count(),
                'transacciones_mes'    => (int)   $statsMes->total_transacciones,
                'valor_comprado_mes'   => (float) $statsMes->valor_comprado,
                'valor_formulado_mes'  => (float) $statsMes->valor_formulado,
                'unidades_compradas'   => (int)   $statsMes->unidades_compradas,
                'medicos_con_tx'       => (int)   $statsMes->medicos_con_tx,
            ],
            'tendencia'            => $tendencia,
            'topProductos'         => $topProductos,
            'visitadoresResumen'   => $visitadoresResumen,
            'visitasPorEstado'     => $visitasPorEstado,
            'ultimasTransacciones' => $ultimasTransacciones,
        ]);
    }
}
