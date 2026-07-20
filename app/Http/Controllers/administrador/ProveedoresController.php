<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Services\OdooService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProveedoresController extends Controller
{
    private OdooService $odoo;

    public function __construct(OdooService $odoo)
    {
        $this->odoo = $odoo;
    }

    /**
     * Vista de cuentas por pagar global: TODO proveedor de Odoo con
     * facturas pendientes de pago. A diferencia de Cartera, no hay tabla
     * local de proveedores contra la cual cruzar — el listado sale
     * directo de Odoo. El listado llega como prop lazy porque implica
     * recorrer account.move completo por lotes — la página se renderiza
     * de inmediato y el listado aparece aparte, igual que en Gcartera.
     */
    public function index(Request $request)
    {
        return Inertia::render('ADMINISTRADOR/PROVEEDORES/Gproveedores', [
            'proveedores' => Inertia::lazy(function () {
                $porClave = $this->odoo->getCuentasPorPagarGlobal();
                if (empty($porClave)) return [];

                return collect($porClave)
                    ->map(fn($c) => [
                        'documento'         => $c['documento'],
                        'nombre'            => $c['nombre_odoo'] ?? 'Sin nombre',
                        'pendiente'         => $c['pendiente'],
                        'vencida'           => $c['vencida'],
                        'facturas_vencidas' => $c['facturas_vencidas'],
                        'dias_max_vencido'  => $c['dias_max_vencido'],
                    ])
                    ->sortByDesc('pendiente')
                    ->values();
            }),

            // Pestaña "Por vencimiento": facturas de proveedor que vencen en
            // un rango de fechas, para hacerse una idea de presupuesto. Solo
            // se calcula si la pestaña llega a pedirse explícitamente (prop
            // lazy) — la mayoría de las visitas a /Gproveedores solo miran
            // "Por proveedor" y no vale la pena recorrer account.move de más.
            'vencimientos' => Inertia::lazy(function () use ($request) {
                $desde     = $request->input('desde', now()->format('Y-m-d'));
                $hasta     = $request->input('hasta', now()->addDays(30)->format('Y-m-d'));
                $pagina    = max(1, (int) $request->input('pagina', 1));
                $porPagina = min(200, max(10, (int) $request->input('porPagina', 50)));

                $resultado = $this->odoo->getVencimientosProveedorPorRango($desde, $hasta, $pagina, $porPagina);

                return [
                    'desde'      => $desde,
                    'hasta'      => $hasta,
                    'pagina'     => $pagina,
                    'porPagina'  => $porPagina,
                    'facturas'   => $resultado['facturas'],
                    'total'      => $resultado['total'],
                    'resumen'    => $resultado['resumen'],
                ];
            }),
        ]);
    }

    /**
     * Invalida la caché de cuentas por pagar y vuelve a la misma vista
     * para forzar el recálculo contra Odoo.
     */
    public function actualizar(Request $request)
    {
        $this->odoo->invalidarCuentasPorPagarGlobal();

        return back()->with('success', 'Cuentas por pagar actualizándose contra Odoo. Puede tardar unos segundos.');
    }

    private const ESTADOS_FACTURA_VALIDOS = ['todas', 'vencida', 'not_paid', 'partial', 'paid'];

    /**
     * Detalle de cuentas por pagar de UN proveedor: KPIs + tabla de
     * facturas paginada. No hay panel local al que enlazar (a diferencia
     * de Cartera con "Historial" hacia Gmedicos) — esta ES la única vista
     * de un proveedor en la app.
     *
     * La tabla de facturas se pagina contra Odoo (no en el cliente): hay
     * proveedores con volúmenes altos de facturación y traerlas todas de
     * una sola vez revienta el memory_limit de PHP.
     */
    public function detalle(Request $request, $documento)
    {
        $pagina       = max(1, (int) $request->input('pagina', 1));
        $porPagina    = min(200, max(10, (int) $request->input('porPagina', 50)));
        $filtroEstado = $request->input('estado', 'todas');
        if (!in_array($filtroEstado, self::ESTADOS_FACTURA_VALIDOS, true)) {
            $filtroEstado = 'todas';
        }

        $resultado = $this->odoo->getFacturasPorDocumentoPaginado(
            $documento, $pagina, $porPagina, $filtroEstado, 'in_invoice'
        );

        // El resumen (pendiente/vencida/facturas vencidas) sale del mismo
        // cálculo agregado que ya usa la vista de lista (getCuentasPorPagarGlobal),
        // así los números son consistentes entre ambas pantallas y no hace
        // falta otra consulta a Odoo aparte.
        $cxpGlobal     = $this->odoo->getCuentasPorPagarGlobal();
        $resumenGlobal = $cxpGlobal[$documento] ?? null;

        return Inertia::render('ADMINISTRADOR/PROVEEDORES/ProveedorDetalle', [
            'documento'     => $documento,
            'nombre'        => $resumenGlobal['nombre_odoo'] ?? 'Sin nombre',
            'facturas'      => $resultado['facturas'],
            'totalFacturas' => $resultado['total'],
            'pagina'        => $pagina,
            'porPagina'     => $porPagina,
            'filtroEstado'  => $filtroEstado,
            'resumen'       => [
                'pendiente'         => $resumenGlobal['pendiente'] ?? 0,
                'vencida'           => $resumenGlobal['vencida'] ?? 0,
                'facturas_vencidas' => $resumenGlobal['facturas_vencidas'] ?? 0,
            ],
        ]);
    }
}
