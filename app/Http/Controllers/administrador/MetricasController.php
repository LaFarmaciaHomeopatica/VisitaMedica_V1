<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Transaccion;
use App\Models\Medico;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MetricasController extends Controller
{
    public function index(Request $request)
    {
        // 1. Capturar filtros (por defecto el mes actual)
        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $fechaFin = $request->input('fecha_fin', Carbon::now()->endOfMonth()->format('Y-m-d'));
        $medicoDoc = $request->input('medico_documento'); // Filtro opcional por médico

        // 2. Query Base con filtros de fecha
        $query = Transaccion::whereBetween('fecha', [$fechaInicio, $fechaFin]);

        if ($medicoDoc) {
            $query->where('medico_documento', $medicoDoc);
        }

        // 3. Cálculos para las Tarjetas de KPI (Totales)
        $totales = (clone $query)->select(
            DB::raw('SUM(unidades_compradas) as total_compradas'),
            DB::raw('SUM(unidades_formuladas) as total_formuladas'),
            DB::raw('SUM(valor_comprado) as total_valor_comprado'),
            DB::raw('SUM(valor_formulado) as total_valor_formulado')
        )->first();

        // Calcular % efectividad preventivamente
        $efectividad = $totales->total_compradas > 0 
            ? round(($totales->total_formuladas / $totales->total_compradas) * 100, 2) 
            : 0;

        // 4. Datos para el Gráfico de Tendencia (Agrupado por Fecha)
        $datosGrafico = (clone $query)->select(
            'fecha',
            DB::raw('SUM(unidades_compradas) as compradas'),
            DB::raw('SUM(unidades_formuladas) as formuladas')
        )
        ->groupBy('fecha')
        ->orderBy('fecha', 'ASC')
        ->get();

        // 5. Datos para la Tabla (Agrupado por Médico y Producto)
        $tablaDatos = (clone $query)->select(
            'medico_documento',
            'producto_codigo',
            DB::raw('MAX(fecha) as ultima_fecha'), // Para saber el "Último reporte"
            DB::raw('SUM(unidades_compradas) as compradas'),
            DB::raw('SUM(unidades_formuladas) as formuladas'),
            DB::raw('SUM(valor_comprado) as valor_c'),
            DB::raw('SUM(valor_formulado) as valor_f')
        )
        ->groupBy('medico_documento', 'producto_codigo')
        ->get();

        return Inertia::render('ADMINISTRADOR/METRICAS/Metricas', [
            'filtros' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'medico_seleccionado' => $medicoDoc
            ],
            'stats' => [
                'compradas' => $totales->total_compradas ?? 0,
                'formuladas' => $totales->total_formuladas ?? 0,
                'valor_comprado' => $totales->total_valor_comprado ?? 0,
                'valor_formulado' => $totales->total_valor_formulado ?? 0,
                'efectividad' => $efectividad
            ],
            'grafico' => $datosGrafico,
            'tabla' => $tablaDatos,
            'medicos' => Medico::select('documento', 'nombre')->get() // Para el buscador/select
        ]);
    }
}