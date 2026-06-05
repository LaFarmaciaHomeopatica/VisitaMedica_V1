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

class Medico2Controller extends Controller
{
    /**
     * Mostrar listado de médicos.
     */
   public function index()
    {
        return Inertia::render('ADMINISTRADOR/MEDICOS/Gmedicos', [
            // Cargamos también la relación categoria en el with si la tienes definida en el modelo Medico
            'medicos' => Medico::with(['visitador', 'tipoDocumento', 'categoria'])->get(), 
            'visitadores' => Visitador::all(['id', 'nombre', 'apellido']),
            'tiposDocumento' => TipoDocumento::all(['id', 'codigo', 'nombre']),
            'categorias' => Categoria::all(['id', 'nombre']) // <--- Enviado a la vista
        ]);
    }

    /**
     * Almacenar un nuevo médico.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'categoria_id' => 'required|exists:categoria,id', // <--- Agregado antes de documento
            'documento' => 'required|numeric|unique:medicos,documento',
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'tipo_documento_id' => 'required|integer',
            'especialidad' => 'required|string|max:100',
            'geolocalizacion' => 'nullable|string|max:300',
            'direccion_detalles' => 'nullable|string',
            'telefono_contacto' => 'nullable|string|max:50',
            'horario_atencion' => 'nullable|string|max:100',
            'visitador_id' => 'nullable|exists:visitadores,id', 
            'fecha_inicio_relacion' => 'nullable|date',
        ], [
            'required' => 'El campo :attribute es obligatorio.',
            'unique'   => 'Este :attribute ya se encuentra registrado.',
            'numeric'  => 'El campo :attribute debe ser numérico.',
            'exists'   => 'El :attribute seleccionado no existe.',
            'date'     => 'La :attribute no tiene un formato válido.',
        ], [
            'categoria_id' => 'Categoría', // <--- Nombre amigable
            'documento' => 'Número de Documento',
            'nombre' => 'Nombre',
            'apellido' => 'Apellido',
            'tipo_documento_id' => 'Tipo de Documento',
            'visitador_id' => 'Visitador Asignado',
            'fecha_inicio_relacion' => 'Fecha de Inicio',
        ]);

        Medico::create($validated);

        return Redirect::route('Gmedicos.index')->with('message', 'Médico creado con éxito.');
    }

    /**
     * Actualizar el médico.
     */
    public function update(Request $request, Medico $medico)
    {
        $validated = $request->validate([
            'categoria_id' => 'required|exists:categoria,id', // <--- Agregado antes de documento
            'documento' => 'required|numeric|unique:medicos,documento,' . $medico->id,
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'tipo_documento_id' => 'required|integer',
            'especialidad' => 'required|string|max:100',
            'geolocalizacion' => 'nullable|string|max:300',
            'direccion_detalles' => 'nullable|string',
            'telefono_contacto' => 'nullable|string|max:50',
            'horario_atencion' => 'nullable|string|max:100',
            'visitador_id' => 'nullable|exists:visitadores,id', 
            'fecha_inicio_relacion' => 'nullable|date',
        ], [
            'required' => 'El campo :attribute es necesario.',
            'unique'   => 'Este :attribute ya pertenece a otro médico.',
            'numeric'  => 'El campo :attribute debe ser solo números.',
        ], [
            'categoria_id' => 'Categoría', // <--- Nombre amigable
            'documento' => 'Número de Documento',
            'nombre' => 'Nombre',
            'apellido' => 'Apellido',
            'tipo_documento_id' => 'Tipo de Documento',
        ]);

        $medico->update($validated);

        return Redirect::route('Gmedicos.index')->with('message', 'Médico actualizado con éxito.');
    }
    /**
     * Eliminar el médico.
     */
    public function destroy(Medico $medico)
    {
        $medico->delete();
        return Redirect::route('Gmedicos.index')->with('message', 'Médico eliminado correctamente.');
    }

    

 //* Exportar a Excel (Soporta selección múltiple).
public function exportar(Request $request) 
{
    // Capturamos los IDs. Si vienen de una URL serán un string separado por comas
    $idsRaw = $request->input('ids');
    
    // Convertimos a array: si no hay IDs, pasamos un array vacío
    $ids = $idsRaw ? explode(',', $idsRaw) : [];

    return Excel::download(
        new MedicosExport($ids), 
        'Medicos_LFH_' . date('d-m-Y') . '.xlsx'
    );
}

    /**
     * Importar desde Excel.
     */
public function importar(Request $request) 
{
    $request->validate([
        'archivo' => 'required|mimes:xlsx,xls,csv'
    ], [
        'archivo.required' => 'Debes seleccionar un archivo Excel.',
        'archivo.mimes'    => 'El archivo debe ser formato .xlsx, .xls o .csv'
    ]);

    // Bajamos el tiempo a 30s; si el código es bueno, no necesita más.
    set_time_limit(30); 

    try {
        $file = $request->file('archivo');
        $extension = $file->getClientOriginalExtension();

        // MAPEO DE FORMATO: Forzar el lector ahorra casi 1 segundo de detección automática
        $format = match(strtolower($extension)) {
            'csv'  => ExcelFormat::CSV,
            'xlsx' => ExcelFormat::XLSX,
            'xls'  => ExcelFormat::XLS,
            default => ExcelFormat::XLSX,
        };

        // 3. Procesamos con el formato forzado
        Excel::import(new MedicosImport, $file, null, $format);
        
        return Redirect::route('Gmedicos.index')
            ->with('message', '¡Importación relámpago completada!');

    } catch (\Exception $e) {
        \Log::error("Error en importación: " . $e->getMessage());
        return Redirect::route('Gmedicos.index')
            ->with('error', 'Error: ' . $e->getMessage());
    }
}

    public function vincularVisitador(Request $request)
{
    $request->validate([
        'medico_ids' => 'required|array',
        'visitador_id' => 'required|exists:visitadores,id',
    ]);

    // Actualización masiva eficiente
    Medico::whereIn('id', $request->medico_ids)
          ->update(['visitador_id' => $request->visitador_id]);

    return redirect()->back();
}
public function eliminarMasivo(Request $request)
{
    $request->validate([
        'ids' => 'required|array',
        'ids.*' => 'exists:medicos,id'
    ]);

    Medico::whereIn('id', $request->ids)->delete();

    return redirect()->back()->with('message', 'Médicos eliminados con éxito.');
}

public function show(Request $request, $id)
{
    $medico = Medico::with(['visitador', 'tipoDocumento', 'categoria'])->findOrFail($id);
    $doc    = $medico->documento;

    // ── Período de tiempo ────────────────────────────────────────────────
    $periodo    = $request->input('periodo', 'all');
    $fechaDesde = match($periodo) {
        'mes' => Carbon::now()->startOfMonth()->format('Y-m-d'),
        '3m' => Carbon::now()->subMonths(3)->startOfMonth()->format('Y-m-d'),
        '6m' => Carbon::now()->subMonths(6)->startOfMonth()->format('Y-m-d'),
        '1y' => Carbon::now()->subMonths(12)->startOfMonth()->format('Y-m-d'),
        '2y' => Carbon::now()->subMonths(24)->startOfMonth()->format('Y-m-d'),
        default => null,
    };

    $txBase = fn() => DB::table('transacciones')
        ->where('medico_documento', $doc)
        ->when($fechaDesde, fn($q) => $q->where('fecha', '>=', $fechaDesde));

    $visitaBase = fn() => DB::table('visitas')
        ->where('medico_id', $id)
        ->when($fechaDesde, fn($q) => $q->where('fecha_programada', '>=', $fechaDesde));

    // ── KPIs transacciones (Métricas corregidas) ───────────────────────────
    $txStats = $txBase()->select(
        DB::raw('COUNT(*) as total_transacciones'),
        DB::raw('COALESCE(SUM(valor_comprado), 0) as total_valor_comprado'),
        DB::raw('COALESCE(SUM(valor_formulado), 0) as total_valor_formulado'),
        
        // Mantenemos esta por compatibilidad con tu interfaz si se usa en otro lado:
        DB::raw('COALESCE(SUM(unidades_compradas), 0) as total_unidades'), 
        
        // NUEVAS: Mapeamos explícitamente las métricas que tu React espera recibir
        DB::raw('COALESCE(SUM(unidades_compradas), 0) as total_unidades_compradas'),
        DB::raw('COALESCE(SUM(unidades_formuladas), 0) as total_unidades_formuladas'),
        
        DB::raw('COUNT(DISTINCT producto_codigo) as total_productos'),
        DB::raw("COUNT(DISTINCT DATE_FORMAT(fecha, '%Y-%m')) as meses_activo")
    )->first();

    // ── Tendencia mensual ─────────────────────────────────────────────────
    $tendencia = $txBase()
        ->select(
            DB::raw("DATE_FORMAT(fecha, '%Y-%m') as mes"),
            DB::raw('SUM(valor_comprado) as valor_comprado'),
            DB::raw('SUM(valor_formulado) as valor_formulado'),
            DB::raw('SUM(unidades_compradas) as unidades')
        )
        ->groupBy('mes')->orderBy('mes')->get();

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

    // ── Por laboratorio ───────────────────────────────────────────────────
    $porLaboratorio = $txBase()
        ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
        ->select(
            'productos.laboratorio',
            DB::raw('SUM(transacciones.valor_comprado) as valor_comprado'),
            DB::raw('SUM(transacciones.valor_formulado) as valor_formulado'),
            DB::raw('SUM(transacciones.unidades_compradas) as unidades'),
            DB::raw('COUNT(DISTINCT productos.codigo) as total_productos')
        )
        ->groupBy('productos.laboratorio')
        ->orderByDesc('valor_comprado')->get();

    // ── Todos los productos (tabla completa) ──────────────────────────────
    $todosProductos = $txBase()
        ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
        ->select(
            'productos.nombre',
            'productos.codigo',
            'productos.laboratorio',
            DB::raw('SUM(transacciones.valor_comprado) as valor_comprado'),
            DB::raw('SUM(transacciones.valor_formulado) as valor_formulado'),
            DB::raw('SUM(transacciones.unidades_compradas) as unidades')
        )
        ->groupBy('productos.nombre', 'productos.codigo', 'productos.laboratorio')
        ->orderByDesc('valor_comprado')->get();

    // ── KPIs visitas ──────────────────────────────────────────────────────
    $visitasStats = $visitaBase()->select(
        DB::raw('COUNT(*) as total'),
        DB::raw("SUM(CASE WHEN estado = 'efectiva'      THEN 1 ELSE 0 END) as efectivas"),
        DB::raw("SUM(CASE WHEN estado = 'programada'    THEN 1 ELSE 0 END) as programadas"),
        DB::raw("SUM(CASE WHEN estado = 'cancelada'     THEN 1 ELSE 0 END) as canceladas"),
        DB::raw("SUM(CASE WHEN estado = 'reprogramada'  THEN 1 ELSE 0 END) as reprogramadas"),
        DB::raw("SUM(CASE WHEN estado = 'No contactado' THEN 1 ELSE 0 END) as no_contactados")
    )->first();

    // ── Historial de visitas ──────────────────────────────────────────────
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

    // ── Visitadores asignados (sin filtrar por período) ───────────────────
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
        'txStats'              => $txStats,
        'tendencia'            => $tendencia,
        'topProductos'         => $topProductos,
        'porLaboratorio'       => $porLaboratorio,
        'todosProductos'       => $todosProductos,
        'visitasStats'         => $visitasStats,
        'visitas'              => $visitas,
        'visitadoresAsignados' => $visitadoresAsignados,
    ]);
}


public function alertasProductos(Request $request, $id)
{
    // 1. Obtener el médico
    $medico = Medico::with(['visitador', 'tipoDocumento', 'categoria'])->findOrFail($id);
    $doc = $medico->documento;

    // 2. MES ACTUAL (Fijo: El mes real en el que estamos hoy)
    $hoyReal = Carbon::now();
    $inicioMesActual = $hoyReal->copy()->startOfMonth()->format('Y-m-d');
    $finMesActual    = $hoyReal->copy()->endOfMonth()->format('Y-m-d');
    $mesActualLabel  = ucfirst($hoyReal->locale('es')->isoFormat('MMMM YYYY'));

    // 3. MES SELECCIONADO (Dinámico: El periodo pasado o histórico que elige el admin)
    $mesQuery = $request->input('mes', Carbon::now()->subMonth()->format('Y-m'));
    
    try {
        $mesSeleccionado = Carbon::createFromFormat('Y-m', $mesQuery);
    } catch (\Exception $e) {
        $mesSeleccionado = Carbon::now()->subMonth();
        $mesQuery = $mesSeleccionado->format('Y-m');
    }

    $inicioMesSeleccionado = $mesSeleccionado->copy()->startOfMonth()->format('Y-m-d');
    $finMesSeleccionado    = $mesSeleccionado->copy()->endOfMonth()->format('Y-m-d');
    $mesSeleccionadoLabel  = ucfirst($mesSeleccionado->locale('es')->isoFormat('MMMM YYYY'));

    // 4. Determinar los extremos cronológicos para optimizar la consulta SQL
    $fechaMin = min($inicioMesActual, $inicioMesSeleccionado);
    $fechaMax = max($finMesActual, $finMesSeleccionado);

    // 5. Consulta combinada de transacciones
    $transacciones = DB::table('transacciones')
        ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
        ->where('transacciones.medico_documento', $doc)
        ->whereBetween('transacciones.fecha', [$fechaMin, $fechaMax])
        ->select(
            'productos.codigo',
            'productos.nombre',
            'productos.laboratorio',
            // Sumatorias del Mes Seleccionado por el usuario
            DB::raw("SUM(CASE WHEN transacciones.fecha BETWEEN '$inicioMesSeleccionado' AND '$finMesSeleccionado' THEN transacciones.unidades_formuladas ELSE 0 END) as form_sel"),
            DB::raw("SUM(CASE WHEN transacciones.fecha BETWEEN '$inicioMesSeleccionado' AND '$finMesSeleccionado' THEN transacciones.unidades_compradas ELSE 0 END) as comp_sel"),
            // Sumatorias del Mes Actual real
            DB::raw("SUM(CASE WHEN transacciones.fecha BETWEEN '$inicioMesActual' AND '$finMesActual' THEN transacciones.unidades_formuladas ELSE 0 END) as form_act"),
            DB::raw("SUM(CASE WHEN transacciones.fecha BETWEEN '$inicioMesActual' AND '$finMesActual' THEN transacciones.unidades_compradas ELSE 0 END) as comp_act")
        )
        ->groupBy('productos.codigo', 'productos.nombre', 'productos.laboratorio')
        ->get();

    // 6. FILTRAR Y MAPEAR: Eliminar registros donde absolutamente todo sea cero
    $productosAlertas = $transacciones->filter(function($item) {
        // Sumamos todas las unidades de los dos meses analizados
        $totalUnidades = $item->form_sel + $item->comp_sel + $item->form_act + $item->comp_act;
        
        // Si es mayor a 0, el producto se queda. Si es 0, se descarta por completo.
        return $totalUnidades > 0;
    })->map(function($item) {
        $difFormulado = $item->form_act - $item->form_sel;
        $difComprado  = $item->comp_act - $item->comp_sel;

        return [
            'codigo'                     => $item->codigo,
            'nombre'                     => $item->nombre,
            'laboratorio'                => $item->laboratorio,
            
            // Valores del mes histórico seleccionado
            'formulado_mes_seleccionado' => (int)$item->form_sel,
            'comprado_mes_seleccionado'  => (int)$item->comp_sel,

            // Valores del mes actual real
            'formulado_mes_actual'       => (int)$item->form_act,
            'comprado_mes_actual'        => (int)$item->comp_act,
            
            // Tendencias y variaciones
            'formulado_diferencia'       => abs($difFormulado),
            'formulado_tendencia'        => $difFormulado > 0 ? 'subio' : ($difFormulado < 0 ? 'bajo' : 'igual'),

            'comprado_diferencia'        => abs($difComprado),
            'comprado_tendencia'         => $difComprado > 0 ? 'subio' : ($difComprado < 0 ? 'bajo' : 'igual'),
        ];
    })->sortByDesc('formulado_mes_seleccionado')->values()->all();

    $puestoReal = $medico->categoria_id == 1 ? 1 : null;

    // 7. Retornar a la vista Inertia
    return Inertia::render('ADMINISTRADOR/MEDICOS/ProductosAlertaAdmin', [
        'medico'               => $medico,
        'productosAlertas'     => $productosAlertas,
        'mesActualLabel'       => $mesActualLabel,       
        'mesSeleccionadoLabel' => $mesSeleccionadoLabel, 
        'mesQuery'             => $mesQuery,             
        'puestoReal'           => $puestoReal
    ]);
}
}
