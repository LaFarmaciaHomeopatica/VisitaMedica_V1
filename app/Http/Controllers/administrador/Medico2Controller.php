<?php

namespace App\Http\Controllers\Administrador;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Models\Visitador;
use App\Models\TipoDocumento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Exports\MedicosExport;
use App\Imports\MedicosImport;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Excel as ExcelFormat;
use App\Models\Categoria;
use Carbon\Carbon;
use App\Services\OdooService;  // ← Service nuevo

class Medico2Controller extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    // =========================================================================
    //  CRUD BÁSICO — Sin cambios
    // =========================================================================

    public function index()
    {
        return Inertia::render('ADMINISTRADOR/MEDICOS/Gmedicos', [
            'medicos'        => Medico::with(['visitador', 'tipoDocumento', 'categoria'])->get(),
            'visitadores'    => Visitador::all(['id', 'nombre', 'apellido']),
            'tiposDocumento' => TipoDocumento::all(['id', 'codigo', 'nombre']),
            'categorias'     => Categoria::all(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'categoria_id'         => 'nullable|exists:categoria,id',
            'documento'            => 'required|string|unique:medicos,documento',
            'nombre'               => 'required|string|max:100',
            'apellido'             => 'required|string|max:100',
            'tipo_documento_id'    => 'required|integer',
            'especialidad'         => 'nullable|string|max:100',
            'geolocalizacion'      => 'nullable|string|max:300',
            'direccion_detalles'   => 'nullable|string',
            'telefono_contacto'    => 'nullable|string|max:50',
            'horario_atencion'     => 'nullable|string|max:100',
            'visitador_id'         => 'nullable|exists:visitadores,id',
            'fecha_inicio_relacion'=> 'nullable|date',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'unique'   => 'Este :attribute ya se encuentra registrado.',
            'string'   => 'El campo :attribute debe ser una cadena de texto.',
            'exists'   => 'El :attribute seleccionado no existe.',
            'date'     => 'La :attribute no tiene un formato válido.',
        ], [
            'categoria_id'      => 'Categoría',
            'documento'         => 'Número de Documento',
            'nombre'            => 'Nombre',
            'apellido'          => 'Apellido',
            'tipo_documento_id' => 'Tipo de Documento',
            'visitador_id'      => 'Visitador Asignado',
            'fecha_inicio_relacion' => 'Fecha de Inicio',
        ]);

        Medico::create($validated);

        return Redirect::route('Gmedicos.index')->with('message', 'Médico creado con éxito.');
    }

    public function update(Request $request, Medico $medico)
    {
        $validated = $request->validate([
            'categoria_id'         => 'nullable|exists:categoria,id',
            'documento'            => 'required|string|unique:medicos,documento,' . $medico->id,
            'nombre'               => 'required|string|max:100',
            'apellido'             => 'required|string|max:100',
            'tipo_documento_id'    => 'required|integer',
            'especialidad'         => 'nullable|string|max:100',
            'geolocalizacion'      => 'nullable|string|max:300',
            'direccion_detalles'   => 'nullable|string',
            'telefono_contacto'    => 'nullable|string|max:50',
            'horario_atencion'     => 'nullable|string|max:100',
            'visitador_id'         => 'nullable|exists:visitadores,id',
            'fecha_inicio_relacion'=> 'nullable|date',
        ], [
            'required' => 'El campo :attribute es necesario.',
            'unique'   => 'Este :attribute ya pertenece a otro médico.',
            'string'   => 'El campo :attribute debe ser una cadena de texto.',
        ], [
            'categoria_id'      => 'Categoría',
            'documento'         => 'Número de Documento',
            'nombre'            => 'Nombre',
            'apellido'          => 'Apellido',
            'tipo_documento_id' => 'Tipo de Documento',
        ]);

        $medico->update($validated);

        return Redirect::route('Gmedicos.index')->with('message', 'Médico actualizado con éxito.');
    }

    public function destroy(Medico $medico)
    {
        $medico->delete();
        return Redirect::route('Gmedicos.index')->with('message', 'Médico eliminado correctamente.');
    }

    // =========================================================================
    //  EXPORT / IMPORT / MASIVOS — Sin cambios
    // =========================================================================

    public function exportar(Request $request)
    {
        $idsRaw = $request->input('ids');
        $ids    = $idsRaw ? explode(',', $idsRaw) : [];

        return Excel::download(
            new MedicosExport($ids),
            'Medicos_LFH_' . date('d-m-Y') . '.xlsx'
        );
    }

    public function importar(Request $request)
    {
        $request->validate([
            'archivo' => 'required|mimes:xlsx,xls,csv'
        ]);

        set_time_limit(300);
        ini_set('memory_limit', '612M');

        try {
            $file      = $request->file('archivo');
            $extension = $file->getClientOriginalExtension();

            $format = match(strtolower($extension)) {
                'csv'  => ExcelFormat::CSV,
                'xlsx' => ExcelFormat::XLSX,
                'xls'  => ExcelFormat::XLS,
                default => ExcelFormat::XLSX,
            };

            Excel::import(new MedicosImport, $file, null, $format);

            return Redirect::route('Gmedicos.index')
                ->with('message', '¡Importación completada!');

        } catch (\Exception $e) {
            Log::error("Error en importación: " . $e->getMessage());
            return Redirect::route('Gmedicos.index')
                ->with('error', 'Error: ' . $e->getMessage());
        }
    }

    public function vincularVisitador(Request $request)
    {
        $request->validate([
            'medico_ids'   => 'required|array',
            'visitador_id' => 'required|exists:visitadores,id',
        ]);

        Medico::whereIn('id', $request->medico_ids)
              ->update(['visitador_id' => $request->visitador_id]);

        return redirect()->back();
    }

    public function eliminarMasivo(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
        ]);

        $ids = array_filter($request->ids, 'is_numeric');

        set_time_limit(0);

        foreach (array_chunk($ids, 500) as $chunk) {
            Medico::whereIn('id', $chunk)->delete();
        }

        return redirect()->back()->with('message', 'Médicos eliminados con éxito.');
    }

    // =========================================================================
    //  DETALLE DEL MÉDICO — Datos de transacciones desde Odoo
    // =========================================================================

    public function show(Request $request, $id)
    {
        $medico = Medico::with(['visitador', 'tipoDocumento', 'categoria'])->findOrFail($id);
        $doc    = $medico->documento;

        // ── Período ──────────────────────────────────────────────────────────
        $periodo    = $request->input('periodo', 'all');
        $fechaDesde = match($periodo) {
            'mes' => Carbon::now()->startOfMonth()->format('Y-m-d'),
            '3m'  => Carbon::now()->subMonths(3)->startOfMonth()->format('Y-m-d'),
            '6m'  => Carbon::now()->subMonths(6)->startOfMonth()->format('Y-m-d'),
            '1y'  => Carbon::now()->subMonths(12)->startOfMonth()->format('Y-m-d'),
            '2y'  => Carbon::now()->subMonths(24)->startOfMonth()->format('Y-m-d'),
            default => null,
        };

        // ── Datos Odoo ────────────────────────────────────────────────────────
        // getKpisPorDocumento retorna null si el médico no existe en Odoo o falla la conexión.
        // En ese caso la vista mostrará los KPIs en cero (misma UX que antes).
        $odooData = $this->odoo->getKpisPorDocumento($doc, $fechaDesde);

        $txStats = $odooData
            ? (object) [
                'total_transacciones'       => $odooData['total_transacciones'],
                'total_valor_comprado'      => $odooData['total_valor_comprado'],
                'total_valor_formulado'     => 0,               // No existe en Odoo
                'total_unidades'            => $odooData['total_unidades'],
                'total_unidades_compradas'  => $odooData['total_unidades_compradas'],
                'total_unidades_formuladas' => 0,               // No existe en Odoo
                'total_productos'           => $odooData['total_productos'],
                'meses_activo'              => $odooData['meses_activo'],
            ]
            : $this->txStatsVacios();

        $tendencia      = $odooData['tendencia']       ?? [];
        $topProductos   = $odooData['top_productos']   ?? [];
        $todosProductos = $odooData['todos_productos'] ?? [];

        // porLaboratorio no viene de Odoo (no hay campo laboratorio en sale.order.line).
        // Se envía vacío; puedes ocultarlo en la vista con una condición.
        $porLaboratorio = [];

        // ── Visitas (siguen desde DB local) ───────────────────────────────────
        $visitaBase = fn() => DB::table('visitas')
            ->where('medico_id', $id)
            ->when($fechaDesde, fn($q) => $q->where('fecha_programada', '>=', $fechaDesde));

        $visitasStats = $visitaBase()->select(
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN estado = 'efectiva'      THEN 1 ELSE 0 END) as efectivas"),
            DB::raw("SUM(CASE WHEN estado = 'programada'    THEN 1 ELSE 0 END) as programadas"),
            DB::raw("SUM(CASE WHEN estado = 'cancelada'     THEN 1 ELSE 0 END) as canceladas"),
            DB::raw("SUM(CASE WHEN estado = 'reprogramada'  THEN 1 ELSE 0 END) as reprogramadas"),
            DB::raw("SUM(CASE WHEN estado = 'No contactado' THEN 1 ELSE 0 END) as no_contactados")
        )->first();

        $visitas = $visitaBase()
            ->leftJoin('visitadores', 'visitas.visitador_id', '=', 'visitadores.id')
            ->select(
                'visitas.id',
                'visitas.estado',
                'visitas.fecha_programada',
                'visitas.fecha_realizada',
                'visitas.comentarios',
                DB::raw("CONCAT(visitadores.nombre, ' ', visitadores.apellido) as nombre_visitador")
            )
            ->orderByDesc('visitas.fecha_programada')
            ->take(50)->get();

        $visitadoresAsignados = DB::table('visitas')
            ->where('visitas.medico_id', $id)
            ->join('visitadores', 'visitas.visitador_id', '=', 'visitadores.id')
            ->select(
                'visitadores.id',
                DB::raw("CONCAT(visitadores.nombre, ' ', visitadores.apellido) as nombre"),
                DB::raw('COUNT(visitas.id) as total_visitas'),
                DB::raw("SUM(CASE WHEN visitas.estado = 'efectiva' THEN 1 ELSE 0 END) as efectivas"),
                DB::raw('MAX(visitas.fecha_programada) as ultima_visita')
            )
            ->groupBy('visitadores.id', 'visitadores.nombre', 'visitadores.apellido')
            ->orderByDesc('total_visitas')->get();

        return Inertia::render('ADMINISTRADOR/MEDICOS/MedicoDetalle', [
            'medico'               => $medico,
            'periodoActivo'        => $periodo,
            // KPIs — misma estructura que antes para no romper el React
            'txStats'              => $txStats,
            'tendencia'            => $tendencia,
            'topProductos'         => $topProductos,
            'porLaboratorio'       => $porLaboratorio,
            'todosProductos'       => $todosProductos,
            // Visitas — sin cambios
            'visitasStats'         => $visitasStats,
            'visitas'              => $visitas,
            'visitadoresAsignados' => $visitadoresAsignados,
            // Bandera para que la vista sepa si Odoo respondió
            'odooConectado'        => $odooData !== null,
        ]);
    }

    // =========================================================================
    //  ALERTAS DE PRODUCTOS — Comparativo desde Odoo
    // =========================================================================

    public function alertasProductos(Request $request, $id)
    {
        $medico = Medico::with(['visitador', 'tipoDocumento', 'categoria'])->findOrFail($id);
        $doc    = $medico->documento;

        // ── Mes actual (fijo: hoy) ────────────────────────────────────────────
        $hoyReal             = Carbon::now();
        $inicioMesActual     = $hoyReal->copy()->startOfMonth()->format('Y-m-d');
        $finMesActual        = $hoyReal->copy()->endOfMonth()->format('Y-m-d');
        $mesActualLabel      = ucfirst($hoyReal->locale('es')->isoFormat('MMMM YYYY'));

        // ── Mes seleccionado (dinámico) ───────────────────────────────────────
        $mesQuery = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));

        try {
            $mesSeleccionado = Carbon::createFromFormat('Y-m', $mesQuery);
        } catch (\Exception $e) {
            $mesSeleccionado = Carbon::now()->subMonth();
            $mesQuery        = $mesSeleccionado->format('Y-m');
        }

        $inicioMesSeleccionado = $mesSeleccionado->copy()->startOfMonth()->format('Y-m-d');
        $finMesSeleccionado    = $mesSeleccionado->copy()->endOfMonth()->format('Y-m-d');
        $mesSeleccionadoLabel  = ucfirst($mesSeleccionado->locale('es')->isoFormat('MMMM YYYY'));

        // ── Consulta comparativa a Odoo ───────────────────────────────────────
        // Período A = mes seleccionado histórico
        // Período B = mes actual real
        $odooResult = $this->odoo->getProductosComparativo(
            $doc,
            ['desde' => $inicioMesSeleccionado, 'hasta' => $finMesSeleccionado],
            ['desde' => $inicioMesActual,        'hasta' => $finMesActual]
        );

        // Si Odoo no responde o el médico no existe allá, enviamos array vacío
        // para que la vista muestre el estado "sin datos" sin romper.
        if (!$odooResult['encontrado']) {
            Log::warning('[Medico2Controller] alertasProductos: ' . ($odooResult['mensaje'] ?? 'Sin datos Odoo'));
            $productosAlertas = [];
        } else {
            // Mapeamos al mismo formato que esperaba la vista antes
            // para no tener que reescribir el React.
            $productosAlertas = collect($odooResult['productos'])->map(function ($p) {
                return [
                    'codigo'                     => $p['codigo'],
                    'nombre'                     => $p['nombre'],
                    'laboratorio'                => $p['laboratorio'] ?? '—',

                    // Período A = mes seleccionado histórico
                    'formulado_mes_seleccionado' => 0,                  // No existe en Odoo
                    'comprado_mes_seleccionado'  => (int) $p['comp_a'], // unidades compradas

                    // Período B = mes actual
                    'formulado_mes_actual'       => 0,                  // No existe en Odoo
                    'comprado_mes_actual'        => (int) $p['comp_b'],

                    // Tendencias sobre unidades compradas
                    'formulado_diferencia'       => 0,
                    'formulado_tendencia'        => 'igual',
                    'comprado_diferencia'        => (int) $p['diferencia'],
                    'comprado_tendencia'         => $p['tendencia'],
                ];
            })->all();
        }

        $puestoReal = $medico->categoria_id == 1 ? 1 : null;

        return Inertia::render('ADMINISTRADOR/MEDICOS/ProductosAlertaAdmin', [
            'medico'               => $medico,
            'productosAlertas'     => $productosAlertas,
            'mesActualLabel'       => $mesActualLabel,
            'mesSeleccionadoLabel' => $mesSeleccionadoLabel,
            'mesQuery'             => $mesQuery,
            'puestoReal'           => $puestoReal,
            // Bandera para que la vista pueda mostrar aviso si Odoo no respondió
            'odooConectado'        => $odooResult['encontrado'],
        ]);
    }

    // =========================================================================
    //  HELPERS PRIVADOS
    // =========================================================================

    /**
     * KPIs vacíos con la misma estructura de objeto que espera el React,
     * usados cuando Odoo no responde o el médico no existe en Odoo.
     */
    private function txStatsVacios(): object
    {
        return (object) [
            'total_transacciones'       => 0,
            'total_valor_comprado'      => 0,
            'total_valor_formulado'     => 0,
            'total_unidades'            => 0,
            'total_unidades_compradas'  => 0,
            'total_unidades_formuladas' => 0,
            'total_productos'           => 0,
            'meses_activo'              => 0,
        ];
    }
}