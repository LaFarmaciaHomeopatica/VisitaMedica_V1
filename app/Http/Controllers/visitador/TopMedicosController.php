<?php

namespace App\Http\Controllers\visitador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\Transaccion;
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

        // ── RETORNO INMEDIATO CON LAZY LOADING EN INERTIA ──
        return Inertia::render('VISITADOR/TOPMEDICOS/TopMedicos', [
            'mesActual' => $mes,
            'filters'   => $request->only(['search']),
            
            // Metemos la consulta pesada dentro de Inertia::lazy()
            'odooDatosPesados' => Inertia::lazy(function () use ($mes, $visitador) {
                $inicio = Carbon::parse($mes . '-01')->startOfMonth();
                $fin    = $inicio->copy()->endOfMonth();

                $medicos         = $visitador->medicos()->get();
                $todosMedicosDoc = $medicos->pluck('documento')->filter()->unique()->map(fn($d) => (string) $d)->values();

                $topMedicos = collect();

                if ($todosMedicosDoc->isNotEmpty()) {
                    // Obtener KPIs de Odoo de forma grupal para el mes seleccionado (Llamada pesada)
                    $odooKpis = $this->odoo->getKpisGrupales(
                        $todosMedicosDoc->toArray(),
                        $inicio->format('Y-m-d'),
                        $fin->format('Y-m-d')
                    );

                    // Mapeamos los resultados para construir la colección de topMedicos
                    $topMedicos = collect($odooKpis)->map(function ($kpis, $doc) use ($medicos) {
                        $medicoModel = $medicos->firstWhere('documento', $doc);
                        return [
                            'documento'              => $doc,
                            'nombre'                 => $medicoModel ? $medicoModel->nombre . ' ' . $medicoModel->apellido : 'Médico No Registrado',
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
            })
        ]);
    }

    public function detalleTop(Request $request, string $documento)
    {
        $visitador = Visitador::where('usuario_id', Auth::id())->firstOrFail();
        $medico    = $visitador->medicos()->with('tipoDocumento')->where('documento', $documento)->firstOrFail();

        $mes     = $request->input('mes', Carbon::now()->format('Y-m'));
        $periodo = $request->input('periodo', 'mes_actual');
        
        $vistaParam    = $request->input('vista', 'general');
        $limitAnterior = (int) $request->input('limit',  10);
        $searchAnterior = $request->input('search', '');

        // ── RETORNO INMEDIATO CON LAZY LOADING EN INERTIA ──
        return Inertia::render('VISITADOR/TOPMEDICOS/DetallesTop', [
            'medico' => [
                'id'                 => $medico->id,
                'documento'          => $medico->documento,
                'nombre'             => trim($medico->nombre . ' ' . $medico->apellido),
                'especialidad'       => $medico->especialidad ?? 'General',
                'direccion_detalles' => $medico->direccion_detalles,
                'telefono_contacto'  => $medico->telefono_contacto,
                'horario_atencion'   => $medico->horario_atencion,
                'geolocalizacion'    => $medico->geolocalizacion,
                'tipo_documento'     => $medico->tipoDocumento ? [
                    'nombre' => $medico->tipoDocumento->nombre
                ] : null,
            ],
            'mesActual'      => $mes,
            'periodoActivo'  => $periodo,
            'vistaAnterior'  => $vistaParam,
            'limitAnterior'  => $limitAnterior,
            'searchAnterior' => $searchAnterior,

            'odooDatosPesados' => Inertia::lazy(function () use ($medico, $mes, $periodo, $visitador) {
                $fin = Carbon::parse($mes . '-01')->endOfMonth();
                $inicio = match($periodo) {
                    '3m' => Carbon::parse($mes . '-01')->subMonths(3)->startOfMonth(),
                    '6m' => Carbon::parse($mes . '-01')->subMonths(6)->startOfMonth(),
                    '1y' => Carbon::parse($mes . '-01')->subMonths(12)->startOfMonth(),
                    '2y' => Carbon::parse($mes . '-01')->subMonths(24)->startOfMonth(),
                    'all' => null,
                    default => Carbon::parse($mes . '-01')->startOfMonth(),
                };

                $fechaDesde = $inicio ? $inicio->format('Y-m-d') : null;

                // 1. Datos del médico
                $odooData = $this->odoo->getKpisPorDocumento($medico->documento, $fechaDesde);

                // 2. Ranking Global
                $todosLosDocs = $visitador->medicos()->pluck('documento')->filter()->unique()->map(fn($d) => (string)$d)->values();
                $mesInicio = Carbon::parse($mes . '-01')->startOfMonth();
                $mesFin    = Carbon::parse($mes . '-01')->endOfMonth();
                
                $kpisGrupales = $this->odoo->getKpisGrupales(
                    $todosLosDocs->toArray(),
                    $mesInicio->format('Y-m-d'),
                    $mesFin->format('Y-m-d')
                );

                $rankingGlobal = collect($kpisGrupales)->map(fn($k, $doc) => [
                    'documento' => $doc,
                    'suma'      => (float)($k['total_comprado'] ?? 0),
                ])->sortByDesc('suma')->values();

                $puestoReal = $rankingGlobal->search(fn($r) => (string)$r['documento'] === (string)$medico->documento);
                $puestoReal = $puestoReal !== false ? $puestoReal + 1 : null;

                // Agrupaciones de productos y laboratorios
                $productosComprados = collect($odooData['todos_productos'] ?? [])->map(fn($p) => [
                    'codigo'            => $p['codigo'],
                    'nombre'            => $p['nombre'],
                    'laboratorio'       => $p['laboratorio'] ?? '—',
                    'cantidad_comprada' => (float)$p['unidades'],
                    'valor_comprado'    => (float)$p['valor_comprado'],
                ])->values();

                $laboratoriosComprados = collect($odooData['todos_productos'] ?? [])
                    ->groupBy(fn($p) => $p['laboratorio'] ?: 'Sin laboratorio')
                    ->map(fn($group, $lab) => [
                        'laboratorio'       => $lab,
                        'cantidad_comprada' => $group->sum('unidades'),
                        'valor_comprado'    => $group->sum('valor_comprado'),
                        'productos'         => $group->unique('codigo')->count(),
                    ])
                    ->sortByDesc('cantidad_comprada')
                    ->values();

                return [
                    'totales' => [
                        'total_comprado'      => (float) ($odooData['total_valor_comprado']      ?? 0),
                        'total_formulado'     => 0.0,
                        'unidades_compradas'  => (int)   ($odooData['total_unidades_compradas']  ?? 0),
                        'unidades_formuladas' => 0,
                        'transacciones'       => (int)   ($odooData['total_transacciones']       ?? 0),
                    ],
                    'productosComprados'    => $productosComprados,
                    'laboratoriosComprados' => $laboratoriosComprados,
                    'puestoReal'            => $puestoReal,
                ];
            })
        ]);
    }
}