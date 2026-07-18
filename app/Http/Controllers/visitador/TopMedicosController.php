<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\Transaccion;
use App\Models\OdooSnapshot;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Services\OdooService;

class TopMedicosController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    public function index(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->first();
        if (!$visitador) {
            return redirect()->route('dashboard')->with('error', 'Visitador no encontrado.');
        }

        $metaActiva = \App\Models\Meta::where('visitador_id', $visitador->id)
            ->orderByDesc('fecha_meta')
            ->first();

        $mesDefault = $metaActiva
            ? Carbon::parse($metaActiva->fecha_meta)->format('Y-m')
            : Carbon::now()->format('Y-m');

        $mes = $request->input('mes', $mesDefault);

        // Clave única por visitador, así el ranking de uno no se mezcla con el de otro
        $claveGrupal = 'grupal_' . $visitador->id;

        $snapshot = OdooSnapshot::buscar($claveGrupal, 'ranking', $mes);

        return Inertia::render('VISITADOR/TOPMEDICOS/TopMedicos', [
            'mesActual' => $mes,
            'filters'   => $request->only(['search']),

            'odooDatosPesados' => $snapshot
                ? [
                    'topMedicos'    => $snapshot->payload['topMedicos'] ?? [],
                    'actualizadoEn' => $snapshot->actualizado_en?->toIso8601String(),
                ]
                : Inertia::lazy(function () use ($mes, $visitador, $claveGrupal) {
                    $data = $this->calcularRankingGrupal($visitador, $mes);

                    OdooSnapshot::guardar($claveGrupal, 'ranking', $mes, $data);

                    $data['actualizadoEn'] = now()->toIso8601String();
                    return $data;
                }),
        ]);
    }

    public function detalleTop(Request $request, string $documento)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->firstOrFail();
        $medico    = $visitador->medicos()->with('tipoDocumento')->where('documento', $documento)->firstOrFail();

        $mes     = $request->input('mes', Carbon::now()->format('Y-m'));
        $periodo = $request->input('periodo', 'mes_actual');

        $fechaDesdeCustom = null;
        $fechaHastaCustom = null;
        $periodoCache     = $periodo;

        if ($periodo === 'custom') {
            $fechaDesdeCustom = $request->input('fecha_desde');
            $fechaHastaCustom = $request->input('fecha_hasta');

            // Sin ambas fechas no hay rango válido: caemos a "mes actual" en vez de romper.
            if (!$fechaDesdeCustom || !$fechaHastaCustom) {
                $periodo = 'mes_actual';
                $periodoCache = $periodo;
            } else {
                // Clave de caché única por rango exacto, para no colisionar entre rangos distintos.
                $periodoCache = "custom_{$fechaDesdeCustom}_{$fechaHastaCustom}";
            }
        }

        $vistaParam     = $request->input('vista', 'general');
        $limitAnterior  = (int) $request->input('limit', 10);
        $searchAnterior = $request->input('search', '');

        $snapshot = OdooSnapshot::buscar($medico->documento, $periodoCache, $mes);

        return Inertia::render('VISITADOR/TOPMEDICOS/DetallesTop', [
            'medico' => [
                'id'                 => $medico->id,
                'documento'          => $medico->documento,
                'nombre'             => trim($medico->nombre),
                'especialidad'       => $medico->especialidad ?? 'General',
                'direccion_detalles' => $medico->direccion_detalles,
                'telefono_contacto'  => $medico->telefono_contacto,
                'horario_atencion'   => $medico->horario_atencion,
                'geolocalizacion'    => $medico->geolocalizacion,
                'tipo_documento'     => $medico->tipoDocumento ? [
                    'nombre' => $medico->tipoDocumento->nombre
                ] : null,
            ],
            'mesActual'        => $mes,
            'periodoActivo'    => $periodo,
            'fechaDesdeActiva' => $fechaDesdeCustom,
            'fechaHastaActiva' => $fechaHastaCustom,
            'vistaAnterior'    => $vistaParam,
            'limitAnterior'    => $limitAnterior,
            'searchAnterior'   => $searchAnterior,

            'odooDatosPesados' => $snapshot
                ? array_merge($snapshot->payload, [
                    'actualizadoEn' => $snapshot->actualizado_en?->toIso8601String(),
                ])
                : Inertia::lazy(function () use ($medico, $mes, $periodo, $visitador, $fechaDesdeCustom, $fechaHastaCustom, $periodoCache) {
                    $data = $this->calcularDetalleMedico($medico, $mes, $periodo, $visitador, $fechaDesdeCustom, $fechaHastaCustom);

                    OdooSnapshot::guardar($medico->documento, $periodoCache, $mes, $data);

                    $data['actualizadoEn'] = now()->toIso8601String();
                    return $data;
                }),
        ]);
    }

    /**
     * Actualización MASIVA: borra todos los snapshots del visitador autenticado
     * (su ranking grupal + el detalle de cada uno de sus médicos, en cualquier
     * mes/periodo que haya quedado guardado). No vuelve a consultar Odoo aquí
     * mismo -- solo limpia la caché. Cada página recalculará sola, de forma
     * perezosa (lazy), la próxima vez que se visite.
     */
    public function actualizarTodo(Request $request)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->firstOrFail();

        $documentos = $visitador->medicos()
            ->pluck('documento')
            ->filter()
            ->unique()
            ->map(fn($d) => (string) $d)
            ->push('grupal_' . $visitador->id)
            ->values();

        OdooSnapshot::whereIn('documento', $documentos)->delete();

        return back()->with('success', 'Los datos se están actualizando. Puede tardar unos segundos al abrir cada sección.');
    }

    /**
     * Lógica pesada de cálculo del ranking grupal.
     */
    private function calcularRankingGrupal(Visitador $visitador, string $mes): array
    {
        $inicio = Carbon::parse($mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        $medicos         = $visitador->medicos()->get();
        $todosMedicosDoc = $medicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

        $topMedicos = collect();

        if ($todosMedicosDoc->isNotEmpty()) {
            $odooKpis = $this->odoo->getKpisGrupales(
                $todosMedicosDoc->toArray(),
                $inicio->format('Y-m-d'),
                $fin->format('Y-m-d')
            );

            $topMedicos = collect($odooKpis)->map(function ($kpis, $doc) use ($medicos) {
                $medicoModel = $medicos->firstWhere('documento', $doc);
                return [
                    'documento'              => $doc,
                    'nombre'                 => $medicoModel ? $medicoModel->nombre : 'Médico No Registrado',
                    'especialidad'           => $medicoModel->especialidad ?? 'General',
                    'total_comprado'         => (float) ($kpis['total_comprado'] ?? 0),
                    'total_formulado'        => 0.0,
                    'producto_mas_comprado'  => $kpis['producto_mas_comprado'] ?? '—',
                    'producto_mas_formulado' => null,
                ];
            })->sortByDesc('total_comprado')->values();
        }

        return [
            'topMedicos' => $topMedicos,
        ];
    }

    /**
     * Lógica pesada de cálculo del detalle de un médico.
     */
    private function calcularDetalleMedico(Medico $medico, string $mes, string $periodo, Visitador $visitador, ?string $fechaDesdeCustom = null, ?string $fechaHastaCustom = null): array
{
    if ($periodo === 'custom' && $fechaDesdeCustom && $fechaHastaCustom) {
        $fechaDesde = $fechaDesdeCustom;
        $fechaHasta = $fechaHastaCustom;
    } else {
        $inicio = match ($periodo) {
            'all' => null,
            default => Carbon::parse($mes . '-01')->startOfMonth(), // 'mes_actual' u otro valor legado
        };
        $fechaDesde = $inicio ? $inicio->format('Y-m-d') : null;
        $fechaHasta = $inicio ? $inicio->copy()->endOfMonth()->format('Y-m-d') : null;
    }

    // 1. Obtener datos desde Odoo / Repositorio local
    $odooData = $this->odoo->getKpisPorDocumento($medico->documento, $fechaDesde, $fechaHasta);
    $formulacionOdoo = $this->odoo->getFormulacionPorDocumento($medico->documento, $fechaDesde, $fechaHasta);

    $todosLosDocs = $visitador->medicos()->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();
    $mesInicio = Carbon::parse($mes . '-01')->startOfMonth();
    $mesFin    = Carbon::parse($mes . '-01')->endOfMonth();

    $kpisGrupales = $this->odoo->getKpisGrupales(
        $todosLosDocs->toArray(),
        $mesInicio->format('Y-m-d'),
        $mesFin->format('Y-m-d')
    );

    $rankingGlobal = collect($kpisGrupales)->map(fn($k, $doc) => [
        'documento' => $doc,
        'suma'      => (float) ($k['total_comprado'] ?? 0),
    ])->sortByDesc('suma')->values();
    $puestoReal = $rankingGlobal->search(fn($r) => (string) $r['documento'] === (string) $medico->documento);
    $puestoReal = $puestoReal !== false ? $puestoReal + 1 : null;

    $todosProductosRaw = collect($odooData['todos_productos'] ?? [])->values()->all();

    // Extraer códigos de productos para buscar laboratorios
    $codigosComprados = collect($todosProductosRaw)->pluck('codigo')->filter();
    $codigosFormulados = collect($formulacionOdoo)->pluck('codigo')->filter();
    $codigosProductos = $codigosComprados->concat($codigosFormulados)->unique()->toArray();

    $laboratoriosLocales = DB::table('productos')
        ->whereIn('codigo', $codigosProductos)
        ->pluck('laboratorio', 'codigo')
        ->toArray();

    // 2. Mapear compras unificadas
    $productosComprados = collect($todosProductosRaw)->map(function($p) use ($laboratoriosLocales) {
        $codigo = $p['codigo'] ?? null;
        return [
            'codigo'            => $codigo,
            'nombre'            => $p['nombre'] ?? 'Sin nombre',
            'laboratorio'       => $laboratoriosLocales[$codigo] ?? '—',
            'cantidad_comprada' => (float) ($p['unidades'] ?? 0),
            'valor_comprado'    => (float) ($p['valor_comprado'] ?? 0),
        ];
    })->values()->all();

    // 3. CORRECCIÓN PRINCIPAL: Filtrar, agrupar y SUMAR el histórico de formulados
    $productosFormulados = collect($formulacionOdoo)
        ->filter(function($linea) {
            $estado = strtoupper($linea['estado'] ?? '');
            return $estado !== 'CANCEL' && $estado !== 'CANCELADO' && $estado !== 'CANCELADA';
        })
        ->groupBy(function($linea) {
            // Agrupamos por código para que sume los registros de todos los meses de ese producto
            return $linea['codigo'] ?? $linea['nombre'] ?? 'sin_codigo';
        })
        ->map(function($grupo) use ($laboratoriosLocales) {
            $primero = $grupo->first();
            $codigo = $primero['codigo'] ?? null;
            
            return [
                'codigo'             => $codigo,
                'nombre'             => $primero['nombre'] ?? 'Sin nombre',
                'laboratorio'        => $laboratoriosLocales[$codigo] ?? '—',
                // SUMAMOS todas las cantidades del periodo seleccionado
                'cantidad_formulada' => (float) $grupo->sum('cantidad'),
                // SUMAMOS todos los valores usando el subtotal/total acordado
                'valor_formulado'    => (float) $grupo->sum(fn($l) => ($l['total'] ?? 0)),
            ];
        })->values()->all();

    // 4. Laboratorios Top resumidos
    $laboratoriosComprados = collect($productosComprados)
        ->filter(fn($item) => !empty($item['laboratorio']) && $item['laboratorio'] !== '—')
        ->groupBy('laboratorio')
        ->map(fn($group, $lab) => [
            'laboratorio'       => $lab,
            'cantidad_comprada' => (int) $group->sum('cantidad_comprada'),
            'valor_comprado'    => (float) $group->sum('valor_comprado'),
            'productos'         => (int) $group->unique('codigo')->count(),
        ])->sortByDesc('valor_comprado')->values()->all();

    $laboratoriosFormulados = collect($productosFormulados)
        ->filter(fn($item) => !empty($item['laboratorio']) && $item['laboratorio'] !== '—')
        ->groupBy('laboratorio')
        ->map(fn($group, $lab) => [
            'laboratorio'        => $lab,
            'cantidad_formulada' => (int) $group->sum('cantidad_formulada'),
            'valor_formulado'    => (float) $group->sum('valor_formulado'),
            'productos'          => (int) $group->unique('codigo')->count(),
        ])->sortByDesc('valor_formulado')->values()->all();

    // 5. Totales Globales del Período
    $totalCompradoReal = collect($productosComprados)->sum('valor_comprado');
    $totalFormuladoReal = collect($productosFormulados)->sum('valor_formulado');
    $unidadesCompradasReal = collect($productosComprados)->sum('cantidad_comprada');
    $unidadesFormuladasReal = collect($productosFormulados)->sum('cantidad_formulada');

    return [
        'totales' => [
            'total_comprado'      => (float) $totalCompradoReal,
            'total_formulado'     => (float) $totalFormuladoReal,
            'unidades_compradas'  => (int) $unidadesCompradasReal,
            'unidades_formuladas' => (int) $unidadesFormuladasReal,
            'transacciones'       => (int) ($odooData['total_transacciones'] ?? 0) + count($formulacionOdoo),
        ],
        'productosComprados'     => $productosComprados,
        'productosFormulados'    => $productosFormulados,
        'laboratoriosComprados'  => $laboratoriosComprados,
        'laboratoriosFormulados' => $laboratoriosFormulados,
        'puestoReal'             => $puestoReal,
    ];
}
}