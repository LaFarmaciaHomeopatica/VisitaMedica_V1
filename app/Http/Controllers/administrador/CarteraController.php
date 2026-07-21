<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Services\OdooService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CarteraController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    /**
     * Vista de cartera global: TODO contacto de Odoo con facturas
     * pendientes de cobro, esté o no registrado localmente como médico
     * (aseguradoras, empresas, etc. también aparecen). El listado llega
     * como prop lazy porque implica recorrer account.move completo por
     * lotes — la página se renderiza de inmediato y el listado aparece
     * aparte, igual que en Ginicio.
     */
    public function index(Request $request)
    {
        return Inertia::render('ADMINISTRADOR/CARTERA/Gcartera', [
            'cartera' => Inertia::lazy(function () {
                $carteraPorClave = $this->odoo->getCarteraGlobal();
                if (empty($carteraPorClave)) return [];

                // Solo se cruzan contra la tabla local los documentos que
                // realmente aparecieron con cartera — no toda la tabla de
                // médicos, que puede tener miles de filas sin cartera.
                $documentos = collect($carteraPorClave)->pluck('documento')->filter()->unique()->values()->all();
                $medicosPorDocumento = Medico::whereIn('documento', $documentos)
                    ->with('visitador')
                    ->get()
                    ->keyBy(fn($m) => trim((string) $m->documento));

                return collect($carteraPorClave)
                    ->map(function ($c, $clave) use ($medicosPorDocumento) {
                        $medico = $c['documento'] ? $medicosPorDocumento->get(trim($c['documento'])) : null;

                        return [
                            'documento'         => $c['documento'],
                            'nombre'            => $medico->nombre ?? $c['nombre_odoo'] ?? 'Sin nombre',
                            'visitador'         => $medico?->visitador ? trim("{$medico->visitador->nombre} {$medico->visitador->apellido}") : null,
                            'registrado'        => (bool) $medico,
                            'pendiente'         => $c['pendiente'],
                            'vencida'           => $c['vencida'],
                            'facturas_vencidas' => $c['facturas_vencidas'],
                            'dias_max_vencido'  => $c['dias_max_vencido'],
                        ];
                    })
                    ->sortByDesc('pendiente')
                    ->values();
            }),
        ]);
    }

    /**
     * Invalida la caché de cartera y vuelve a la misma vista para forzar
     * el recálculo contra Odoo.
     */
    public function actualizar(Request $request)
    {
        $this->odoo->invalidarCarteraGlobal();

        return back()->with('success', 'Cartera actualizándose contra Odoo. Puede tardar unos segundos.');
    }

    private const ESTADOS_FACTURA_VALIDOS = ['todas', 'vencida', 'not_paid', 'partial', 'paid'];

    /**
     * Detalle de cartera de UN médico, sin el resto del panel (KPIs de
     * compras/formulación, gráfico, laboratorios, visitas...). Se llega
     * acá haciendo clic en una fila de /Gcartera; desde acá un botón
     * "Historial" lleva al panel completo (Gmedicos.showPorDocumento) para
     * quien necesite ver todo lo demás.
     *
     * La tabla de facturas se pagina contra Odoo (no en el cliente): hay
     * clientes con decenas de miles de facturas (aseguradoras, empresas) y
     * traerlas todas de una sola vez revienta el memory_limit de PHP y no
     * tendría sentido mandarle ese volumen al navegador.
     */
    public function detalle(Request $request, $documento)
    {
        $medico = Medico::where('documento', $documento)->with('visitador')->first();

        $pagina       = max(1, (int) $request->input('pagina', 1));
        $porPagina    = min(200, max(10, (int) $request->input('porPagina', 50)));
        $filtroEstado = $request->input('estado', 'todas');
        if (!in_array($filtroEstado, self::ESTADOS_FACTURA_VALIDOS, true)) {
            $filtroEstado = 'todas';
        }

        $resultado = $this->odoo->getFacturasPorDocumentoPaginado($documento, $pagina, $porPagina, $filtroEstado);

        // El resumen (pendiente/vencida/facturas vencidas) sale del mismo
        // cálculo agregado que ya usa la vista de lista (getCarteraGlobal),
        // así los números son consistentes entre ambas pantallas y no hace
        // falta otra consulta a Odoo aparte.
        $carteraGlobal = $this->odoo->getCarteraGlobal();
        $resumenGlobal = $carteraGlobal[$documento] ?? null;

        return Inertia::render('ADMINISTRADOR/CARTERA/CarteraDetalle', [
            'documento' => $documento,
            'medico'    => $medico ? [
                'nombre'    => $medico->nombre,
                'documento' => $medico->documento,
                'visitador' => $medico->visitador ? trim("{$medico->visitador->nombre} {$medico->visitador->apellido}") : null,
            ] : ['nombre' => 'Sin registrar', 'documento' => $documento, 'visitador' => null],
            'esTemporal'   => !$medico,
            'facturas'     => $resultado['facturas'],
            'totalFacturas'=> $resultado['total'],
            'pagina'       => $pagina,
            'porPagina'    => $porPagina,
            'filtroEstado' => $filtroEstado,
            'resumen'      => [
                'pendiente'         => $resumenGlobal['pendiente'] ?? 0,
                'vencida'           => $resumenGlobal['vencida'] ?? 0,
                'facturas_vencidas' => $resumenGlobal['facturas_vencidas'] ?? 0,
            ],
        ]);
    }
}
