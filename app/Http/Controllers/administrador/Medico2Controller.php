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
use App\Models\MedicoTemporal;
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

        // ── Datos Odoo y Formulación Local ────────────────────────────────────
        $odooData = $this->odoo->getKpisPorDocumento($doc, $fechaDesde);
        
        // Obtener la formulación real desde la base de datos local para este período
        $formulacionLocal = $this->odoo->getFormulacionPorDocumento($doc, $fechaDesde) ?? [];

        $tendencia         = $odooData['tendencia']   ?? [];
        $todosProductosRaw = $odooData['todos_productos'] ?? [];

        // 1. Unificar productos comprados y formulados de forma idéntica a "showPorDocumento"
        $productosUnificados = [];
        foreach ($todosProductosRaw as $prod) {
            $clave = (!empty($prod['codigo']) && $prod['codigo'] !== '—') ? $prod['codigo'] : $prod['nombre'];
            $productosUnificados[$clave] = [
                'codigo'              => $prod['codigo'] ?? '—',
                'nombre'              => $prod['nombre'] ?? '',
                'laboratorio'         => $prod['laboratorio'] ?? null,
                'valor_comprado'      => (float) ($prod['valor_comprado'] ?? 0),
                'valor_formulado'     => 0.0,
                'unidades'            => (float) ($prod['unidades'] ?? 0),
                'unidades_formuladas' => 0.0,
                'estado'              => $prod['estado'] ?? $prod['state'] ?? 'draft',
            ];
        }

        foreach ($formulacionLocal as $linea) {
            $estado = strtoupper($linea['estado'] ?? '');
            if ($estado === 'CANCEL' || $estado === 'CANCELADO' || $estado === 'CANCELADA') {
                continue;
            }

            $clave = (!empty($linea['codigo']) && $linea['codigo'] !== '—') ? $linea['codigo'] : $linea['nombre'];

            if (!isset($productosUnificados[$clave])) {
                $productosUnificados[$clave] = [
                    'codigo'              => $linea['codigo'] ?? '—',
                    'nombre'              => $linea['nombre'] ?? '',
                    'laboratorio'         => null,
                    'valor_comprado'      => 0.0,
                    'valor_formulado'     => 0.0,
                    'unidades'            => 0.0,
                    'unidades_formuladas' => 0.0,
                    'estado'              => $linea['estado'] ?? 'draft',
                ];
            }

$productosUnificados[$clave]['valor_formulado'] += (float) ($linea['total'] ?? $linea['subtotal'] ?? 0);
            $productosUnificados[$clave]['unidades_formuladas'] += (int) ($linea['cantidad'] ?? 0);
        }

        // 2. Extraer laboratorios de la DB Local e inyectarlos
        $codigosProductos = collect($productosUnificados)->pluck('codigo')->filter(fn($c) => $c !== '—')->unique()->toArray();
        $laboratoriosLocales = DB::table('productos')
            ->whereIn('codigo', $codigosProductos)
            ->pluck('laboratorio', 'codigo')
            ->toArray();

        $todosProductos = collect($productosUnificados)->map(function($prod) use ($laboratoriosLocales) {
            $prod = (object) $prod;
            $prod->laboratorio = $laboratoriosLocales[$prod->codigo] ?? '—';
            return $prod;
        })->values()->all();

        // 3. Totales reales filtrando cancelados
        $totalValorCompradoReal = collect($todosProductos)
            ->filter(function($prod) {
                $estado = strtoupper($prod->estado ?? '');
                return $estado !== 'CANCEL' && $estado !== 'CANCELADO' && $estado !== 'CANCELADA';
            })
            ->sum('valor_comprado');

        $totalUnidadesCompradasReal = collect($todosProductos)
            ->filter(function($prod) {
                $estado = strtoupper($prod->estado ?? '');
                return $estado !== 'CANCEL' && $estado !== 'CANCELADO' && $estado !== 'CANCELADA';
            })
            ->sum('unidades');

        $totalValorFormuladoReal     = collect($todosProductos)->sum('valor_formulado');
        $totalUnidadesFormuladasReal = collect($todosProductos)->sum('unidades_formuladas');

        // 4. Re-ordenar y obtener Top Productos
        usort($todosProductos, function($a, $b) {
            $valA = $a->valor_comprado + $a->valor_formulado;
            $valB = $b->valor_comprado + $b->valor_formulado;
            return $valB <=> $valA;
        });
        $topProductos = array_slice($todosProductos, 0, 6);

        // 5. Agrupación por laboratorio
        $porLaboratorio = collect($todosProductos)
            ->filter(function($item) {
                return !empty($item->laboratorio) && $item->laboratorio !== '—';
            })
            ->groupBy('laboratorio')
            ->map(function($items, $lab) {
                return [
                    'laboratorio'     => $lab,
                    'valor_comprado'  => (float) $items->sum('valor_comprado'),
                    'valor_formulado' => (float) $items->sum('valor_formulado'),
                    'unidades'        => (int) $items->sum('unidades') + (int) $items->sum('unidades_formuladas'),
                    'total_productos' => (int) $items->unique('codigo')->count(),
                ];
            })
            ->sortByDesc(function($item) {
                return $item['valor_comprado'] + $item['valor_formulado'];
            })
            ->values()
            ->all();

        // 6. Construcción del txStats definitivo
        $txStats = $odooData
            ? (object) [
                'total_transacciones'       => ($odooData['total_transacciones'] ?? 0) + count($formulacionLocal),
                'total_valor_comprado'      => $totalValorCompradoReal,
                'total_valor_formulado'     => $totalValorFormuladoReal,              
                'total_unidades'            => $totalUnidadesCompradasReal + $totalUnidadesFormuladasReal,
                'total_unidades_compradas'  => $totalUnidadesCompradasReal,
                'total_unidades_formuladas' => $totalUnidadesFormuladasReal,
                'total_productos'           => count($todosProductos),
                'meses_activo'              => $odooData['meses_activo'] ?? 0,
            ]
            : $this->txStatsVacios();

        // ── Visitas (DB local) ────────────────────────────────────────────────
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
            'txStats'              => $txStats,
            'tendencia'            => $tendencia,
            'topProductos'         => $topProductos,
            'porLaboratorio'       => $porLaboratorio,
            'todosProductos'       => $todosProductos,
            'visitasStats'         => $visitasStats,
            'visitas'              => $visitas,
            'visitadoresAsignados' => $visitadoresAsignados,
            'odooConectado'        => $odooData !== null,
        ]);
    }
    
    public function showPorDocumento(Request $request, $documento)
    {
        $medicoReal = Medico::with(['visitador', 'tipoDocumento', 'categoria'])
            ->where('documento', $documento)
            ->first();

        $esTemporal    = $medicoReal === null;
        $medicoIdLocal = $medicoReal?->id;

        if ($medicoReal) {
            $medico = $medicoReal;
        } else {
            $temporal = MedicoTemporal::where('documento', $documento)->first();

            $medico = (object) [
                'id'                 => $temporal->id ?? null,
                'nombre'             => $temporal->nombre_referencia ?? 'Sin registrar',
                'documento'          => $documento,
                'especialidad'       => null,
                'tipo_documento'     => null,
                'categoria'          => null,
                'visitador'          => null,
                'telefono_contacto'  => null,
                'horario_atencion'   => null,
                'direccion_detalles' => null,
                'geolocalizacion'    => null,
            ];
        }

        $periodo    = $request->input('periodo', 'all');
        $fechaDesde = match($periodo) {
            'mes' => Carbon::now()->startOfMonth()->format('Y-m-d'),
            '3m'  => Carbon::now()->subMonths(3)->startOfMonth()->format('Y-m-d'),
            '6m'  => Carbon::now()->subMonths(6)->startOfMonth()->format('Y-m-d'),
            '1y'  => Carbon::now()->subMonths(12)->startOfMonth()->format('Y-m-d'),
            '2y'  => Carbon::now()->subMonths(24)->startOfMonth()->format('Y-m-d'),
            default => null,
        };

        $odooData = $this->odoo->getKpisPorDocumento($documento, $fechaDesde);

        $formulacionOdoo = $this->odoo->getFormulacionPorDocumento($documento, $fechaDesde) ?? [];
        $todosProductosRaw = $odooData['todos_productos'] ?? [];

        // 1. Unificar productos comprados y formulados
        $productosUnificados = [];
        foreach ($todosProductosRaw as $prod) {
            $clave = (!empty($prod['codigo']) && $prod['codigo'] !== '—') ? $prod['codigo'] : $prod['nombre'];
            $productosUnificados[$clave] = [
                'codigo'              => $prod['codigo'] ?? '—',
                'nombre'              => $prod['nombre'] ?? '',
                'laboratorio'         => $prod['laboratorio'] ?? null,
                'valor_comprado'      => (float) ($prod['valor_comprado'] ?? 0),
                'valor_formulado'     => 0.0,
                'unidades'            => (float) ($prod['unidades'] ?? 0),
                'unidades_formuladas' => 0.0,
                'estado'              => $prod['estado'] ?? $prod['state'] ?? 'draft',
            ];
        }

        foreach ($formulacionOdoo as $linea) {
            $estado = strtoupper($linea['estado'] ?? '');
            if ($estado === 'CANCEL' || $estado === 'CANCELADO' || $estado === 'CANCELADA') {
                continue;
            }

            $clave = (!empty($linea['codigo']) && $linea['codigo'] !== '—') ? $linea['codigo'] : $linea['nombre'];

            if (!isset($productosUnificados[$clave])) {
                $productosUnificados[$clave] = [
                    'codigo'              => $linea['codigo'] ?? '—',
                    'nombre'              => $linea['nombre'] ?? '',
                    'laboratorio'         => null,
                    'valor_comprado'      => 0.0,
                    'valor_formulado'     => 0.0,
                    'unidades'            => 0.0,
                    'unidades_formuladas' => 0.0,
                    'estado'              => $linea['estado'] ?? 'draft',
                ];
            }

            $productosUnificados[$clave]['valor_formulado'] += (float) ($linea['total'] ?? $linea['subtotal'] ?? 0);
            $productosUnificados[$clave]['unidades_formuladas'] += (int) ($linea['cantidad'] ?? 0);
        }

        $codigosProductos = collect($productosUnificados)->pluck('codigo')->filter(fn($c) => $c !== '—')->unique()->toArray();
        $laboratoriosLocales = DB::table('productos')
            ->whereIn('codigo', $codigosProductos)
            ->pluck('laboratorio', 'codigo')
            ->toArray();

        $todosProductos = collect($productosUnificados)->map(function($prod) use ($laboratoriosLocales) {
            $prod = (object) $prod;
            $prod->laboratorio = $laboratoriosLocales[$prod->codigo] ?? '—';
            return $prod;
        })->values()->all();

        // 2. Calculamos los totales reales
        $totalValorCompradoReal = collect($todosProductos)
            ->filter(function($prod) {
                $estado = strtoupper($prod->estado ?? '');
                return $estado !== 'CANCEL' && $estado !== 'CANCELADO' && $estado !== 'CANCELADA';
            })
            ->sum('valor_comprado');

        $totalUnidadesCompradasReal = collect($todosProductos)
            ->filter(function($prod) {
                $estado = strtoupper($prod->estado ?? '');
                return $estado !== 'CANCEL' && $estado !== 'CANCELADO' && $estado !== 'CANCELADA';
            })
            ->sum('unidades');

        $totalValorFormuladoReal = collect($todosProductos)->sum('valor_formulado');
        $totalUnidadesFormuladasReal = collect($todosProductos)->sum('unidades_formuladas');

        // 3. Unificar tendencia
        $tendenciaMap = [];
        foreach ($odooData['tendencia'] ?? [] as $t) {
            $mes = $t['mes'];
            $tendenciaMap[$mes] = [
                'mes'             => $mes,
                'valor_comprado'  => (float) ($t['valor_comprado'] ?? 0),
                'valor_formulado' => (float) ($t['valor_formulado'] ?? 0),
                'unidades'        => (float) ($t['unidades'] ?? 0),
            ];
        }

        foreach ($formulacionOdoo as $linea) {
            $estado = strtoupper($linea['estado'] ?? '');
            if ($estado === 'CANCEL' || $estado === 'CANCELADO' || $estado === 'CANCELADA') {
                continue;
            }

            if (!empty($linea['fecha'])) {
                $mes = substr($linea['fecha'], 0, 7); // Y-m
                if (!isset($tendenciaMap[$mes])) {
                    $tendenciaMap[$mes] = [
                        'mes'             => $mes,
                        'valor_comprado'  => 0.0,
                        'valor_formulado' => 0.0,
                        'unidades'        => 0.0,
                    ];
                }
                $tendenciaMap[$mes]['valor_formulado'] += (float) ($linea['subtotal'] ?? $linea['total'] ?? 0);
            }
        }
        ksort($tendenciaMap);
        $tendencia = array_values($tendenciaMap);

        // 4. Re-ordenar y obtener Top Productos
        usort($todosProductos, function($a, $b) {
            $valA = $a->valor_comprado + $a->valor_formulado;
            $valB = $b->valor_comprado + $b->valor_formulado;
            return $valB <=> $valA;
        });
        $topProductos = array_slice($todosProductos, 0, 6);

        // 5. Crear objeto $txStats
        $txStats = $odooData
            ? (object) [
                'total_transacciones'       => ($odooData['total_transacciones'] ?? 0) + count($formulacionOdoo),
                'total_valor_comprado'      => $totalValorCompradoReal,
                'total_valor_formulado'     => $totalValorFormuladoReal,
                'total_unidades'            => $totalUnidadesCompradasReal + $totalUnidadesFormuladasReal,
                'total_unidades_compradas'  => $totalUnidadesCompradasReal,
                'total_unidades_formuladas' => $totalUnidadesFormuladasReal,
                'total_productos'           => count($todosProductos),
                'meses_activo'              => count(array_filter($tendencia, fn($m) => $m['valor_comprado'] > 0 || $m['valor_formulado'] > 0)),
            ]
            : $this->txStatsVacios();

        // 6. Agrupación por laboratorio
        $porLaboratorio = collect($todosProductos)
            ->filter(function($item) {
                return !empty($item->laboratorio) && $item->laboratorio !== '—';
            })
            ->groupBy('laboratorio')
            ->map(function($items, $lab) {
                return [
                    'laboratorio'     => $lab,
                    'valor_comprado'  => (float) $items->sum('valor_comprado'),
                    'valor_formulado' => (float) $items->sum('valor_formulado'),
                    'unidades'        => (int) $items->sum('unidades') + (int) $items->sum('unidades_formuladas'),
                    'total_productos' => (int) $items->unique('codigo')->count(),
                ];
            })
            ->sortByDesc(function($item) {
                return $item['valor_comprado'] + $item['valor_formulado'];
            })
            ->values()
            ->all();

        // 5. Carga de visitas locales
        if ($medicoIdLocal) {
            $visitaBase = fn() => DB::table('visitas')
                ->where('medico_id', $medicoIdLocal)
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
                ->where('visitas.medico_id', $medicoIdLocal)
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
        } else {
            $visitasStats = (object) [
                'total' => 0, 'efectivas' => 0, 'programadas' => 0,
                'canceladas' => 0, 'reprogramadas' => 0, 'no_contactados' => 0,
            ];
            $visitas = [];
            $visitadoresAsignados = [];
        }

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
            'odooConectado'        => $odooData !== null,
            'esTemporal'           => $esTemporal,
            'documentoBase'        => $documento,
        ]);
    }


    // =========================================================================
    //  ALERTAS DE PRODUCTOS — Comparativo desde Odoo
    // =========================================================================

   // =========================================================================
    //  ALERTAS DE PRODUCTOS — Comparativo desde Odoo
    // =========================================================================

    public function alertasProductos(Request $request, $id)
    {
        $medico = Medico::with(['visitador', 'tipoDocumento', 'categoria'])->findOrFail($id);
        $doc    = $medico->documento;

        // ── Mes actual (fijo: hoy) ────────────────────────────────────────────
        $hoyReal         = Carbon::now();
        $inicioMesActual = $hoyReal->copy()->startOfMonth()->format('Y-m-d');
        $finMesActual    = $hoyReal->copy()->endOfMonth()->format('Y-m-d');
        $mesActualLabel  = ucfirst($hoyReal->locale('es')->isoFormat('MMMM YYYY'));

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
        $odooResult = $this->odoo->getProductosComparativo(
            $doc,
            ['desde' => $inicioMesSeleccionado, 'hasta' => $finMesSeleccionado],
            ['desde' => $inicioMesActual,        'hasta' => $finMesActual]
        );

        if (!$odooResult['encontrado']) {
            Log::warning('[Medico2Controller] alertasProductos: ' . ($odooResult['mensaje'] ?? 'Sin datos Odoo'));
            $productosAlertas = [];
        } else {
            // ── OBTENER Y FILTRAR FORMULACIONES PARA AMBOS PERÍODOS ──
            $formulacionesMesSeleccionado = collect($this->odoo->getFormulacionPorDocumento($doc, $inicioMesSeleccionado))
                ->filter(function($l) use ($inicioMesSeleccionado, $finMesSeleccionado) {
                    $fecha = Carbon::parse($l['fecha'] ?? now());
                    $estado = strtoupper($l['estado'] ?? '');
                    return $fecha->between($inicioMesSeleccionado, $finMesSeleccionado) && !in_array($estado, ['CANCEL', 'CANCELADO', 'CANCELADA']);
                })->groupBy('codigo');

            $formulacionesMesActual = collect($this->odoo->getFormulacionPorDocumento($doc, $inicioMesActual))
                ->filter(function($l) use ($inicioMesActual, $finMesActual) {
                    $fecha = Carbon::parse($l['fecha'] ?? now());
                    $estado = strtoupper($l['estado'] ?? '');
                    return $fecha->between($inicioMesActual, $finMesActual) && !in_array($estado, ['CANCEL', 'CANCELADO', 'CANCELADA']);
                })->groupBy('codigo');

            // Mapeamos e inyectamos los datos reales cruzados por código
            $productosAlertas = collect($odooResult['productos'])->map(function ($p) use ($formulacionesMesSeleccionado, $formulacionesMesActual) {
                $codigo = $p['codigo'];

                $cantFormSeleccionado = $formulacionesMesSeleccionado->has($codigo) ? (int)$formulacionesMesSeleccionado->get($codigo)->sum('cantidad') : 0;
                $cantFormActual       = $formulacionesMesActual->has($codigo) ? (int)$formulacionesMesActual->get($codigo)->sum('cantidad') : 0;
                $diffFormulado        = $cantFormActual - $cantFormSeleccionado;
                
                $tendenciaFormulado = 'igual';
                if ($diffFormulado > 0) $tendenciaFormulado = 'subio';
                if ($diffFormulado < 0) $tendenciaFormulado = 'bajo';

                return [
                    'codigo'                     => $codigo,
                    'nombre'                     => $p['nombre'],
                    'laboratorio'                => $p['laboratorio'] ?? '—',

                    // Período A = mes seleccionado histórico (Inyección Real)
                    'formulado_mes_seleccionado' => $cantFormSeleccionado,
                    'comprado_mes_seleccionado'  => (int) $p['comp_a'],

                    // Período B = mes actual (Inyección Real)
                    'formulado_mes_actual'       => $cantFormActual,
                    'comprado_mes_actual'        => (int) $p['comp_b'],

                    // Tendencias calculadas
                    'formulado_diferencia'       => $diffFormulado,
                    'formulado_tendencia'        => $tendenciaFormulado,
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
            'odooConectado'        => $odooResult['encontrado'],
        ]);
    }

    public function alertasPorDocumento(Request $request, $documento)
    {
        $medicoReal = Medico::with(['visitador', 'tipoDocumento', 'categoria'])
            ->where('documento', $documento)
            ->first();

        if ($medicoReal) {
            $medico = $medicoReal;
        } else {
            $temporal = MedicoTemporal::where('documento', $documento)->first();

            $medico = (object) [
                'id'           => $temporal->id ?? null,
                'nombre'       => $temporal->nombre_referencia ?? 'Sin registrar',
                'documento'    => $documento,
                'categoria_id' => null,
            ];
        }

        $hoyReal         = Carbon::now();
        $inicioMesActual = $hoyReal->copy()->startOfMonth()->format('Y-m-d');
        $finMesActual    = $hoyReal->copy()->endOfMonth()->format('Y-m-d');
        $mesActualLabel  = ucfirst($hoyReal->locale('es')->isoFormat('MMMM YYYY'));

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

        $odooResult = $this->odoo->getProductosComparativo(
            $documento,
            ['desde' => $inicioMesSeleccionado, 'hasta' => $finMesSeleccionado],
            ['desde' => $inicioMesActual,        'hasta' => $finMesActual]
        );

        if (!$odooResult['encontrado']) {
            Log::warning('[Medico2Controller] alertasPorDocumento: ' . ($odooResult['mensaje'] ?? 'Sin datos Odoo'));
            $productosAlertas = [];
        } else {
            // ── OBTENER Y FILTRAR FORMULACIONES PARA AMBOS PERÍODOS ──
            $formulacionesMesSeleccionado = collect($this->odoo->getFormulacionPorDocumento($documento, $inicioMesSeleccionado))
                ->filter(function($l) use ($inicioMesSeleccionado, $finMesSeleccionado) {
                    $fecha = Carbon::parse($l['fecha'] ?? now());
                    $estado = strtoupper($l['estado'] ?? '');
                    return $fecha->between($inicioMesSeleccionado, $finMesSeleccionado) && !in_array($estado, ['CANCEL', 'CANCELADO', 'CANCELADA']);
                })->groupBy('codigo');

            $formulacionesMesActual = collect($this->odoo->getFormulacionPorDocumento($documento, $inicioMesActual))
                ->filter(function($l) use ($inicioMesActual, $finMesActual) {
                    $fecha = Carbon::parse($l['fecha'] ?? now());
                    $estado = strtoupper($l['estado'] ?? '');
                    return $fecha->between($inicioMesActual, $finMesActual) && !in_array($estado, ['CANCEL', 'CANCELADO', 'CANCELADA']);
                })->groupBy('codigo');

            // Mapeamos e inyectamos los datos reales cruzados por código
            $productosAlertas = collect($odooResult['productos'])->map(function ($p) use ($formulacionesMesSeleccionado, $formulacionesMesActual) {
                $codigo = $p['codigo'];

                $cantFormSeleccionado = $formulacionesMesSeleccionado->has($codigo) ? (int)$formulacionesMesSeleccionado->get($codigo)->sum('cantidad') : 0;
                $cantFormActual       = $formulacionesMesActual->has($codigo) ? (int)$formulacionesMesActual->get($codigo)->sum('cantidad') : 0;
                $diffFormulado        = $cantFormActual - $cantFormSeleccionado;
                
                $tendenciaFormulado = 'igual';
                if ($diffFormulado > 0) $tendenciaFormulado = 'subio';
                if ($diffFormulado < 0) $tendenciaFormulado = 'bajo';

                return [
                    'codigo'                     => $codigo,
                    'nombre'                     => $p['nombre'],
                    'laboratorio'                => $p['laboratorio'] ?? '—',
                    
                    // Período A = mes seleccionado histórico (Inyección Real)
                    'formulado_mes_seleccionado' => $cantFormSeleccionado,
                    'comprado_mes_seleccionado'  => (int) $p['comp_a'],
                    
                    // Período B = mes actual (Inyección Real)
                    'formulado_mes_actual'       => $cantFormActual,
                    'comprado_mes_actual'        => (int) $p['comp_b'],
                    
                    // Tendencias calculadas
                    'formulado_diferencia'       => $diffFormulado,
                    'formulado_tendencia'        => $tendenciaFormulado,
                    'comprado_diferencia'        => (int) $p['diferencia'],
                    'comprado_tendencia'         => $p['tendencia'],
                ];
            })->all();
        }

        $puestoReal = ($medico->categoria_id ?? null) == 1 ? 1 : null;

        return Inertia::render('ADMINISTRADOR/MEDICOS/ProductosAlertaAdmin', [
            'medico'               => $medico,
            'productosAlertas'     => $productosAlertas,
            'mesActualLabel'       => $mesActualLabel,
            'mesSeleccionadoLabel' => $mesSeleccionadoLabel,
            'mesQuery'             => $mesQuery,
            'puestoReal'           => $puestoReal,
            'odooConectado'        => $odooResult['encontrado'],
            'documentoBase'        => $documento,
        ]);
    }}