<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OdooService
{
    private string $url;
    private string $db;
    private string $username;
    private string $password;

    public function __construct()
    {
        $this->url      = config('odoo.url');
        $this->db       = config('odoo.db');
        $this->username = config('odoo.username');
        $this->password = config('odoo.password');
    }

    // =========================================================================
    //  CONEXIÓN
    // =========================================================================

    /**
     * Verifica si las credenciales están configuradas y retorna el UID.
     * Retorna null si la conexión falla o no hay configuración.
     */
    public function obtenerUid(): ?int
    {
        if (empty($this->url) || empty($this->db) || empty($this->password)) {
            return null;
        }

        try {
            $xml = $this->xmlCall('authenticate', [
                ['string', $this->db],
                ['string', $this->username],
                ['string', $this->password],
                ['struct', []],
            ]);

            $response = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'text/xml'])
                ->send('POST', rtrim($this->url, '/') . '/xmlrpc/2/common', ['body' => $xml]);

            if ($response->successful() && preg_match('/<int>(\d+)<\/int>/', $response->body(), $m)) {
                return (int) $m[1];
            }

            return null;

        } catch (\Exception $e) {
            Log::error('[OdooService] Error obteniendo UID: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Retorna 'conectado' | 'error' | 'sin_probar'
     */
    public function estadoConexion(): string
    {
        if (empty($this->url) || empty($this->db) || empty($this->password)) {
            return 'sin_probar';
        }

        return $this->obtenerUid() ? 'conectado' : 'error';
    }

    // =========================================================================
    //  CONSULTAS PÚBLICAS
    // =========================================================================

    /**
     * Busca un médico en Odoo por su documento (vat) y retorna sus datos básicos.
     * Retorna null si no se encuentra o hay error de conexión.
     */
    public function buscarMedicoPorDocumento(string $documento): ?array
    {
        $uid = $this->obtenerUid();
        if (!$uid) return null;

        $ids = $this->ejecutarKw(
            $uid,
            'res.partner',
            'search',
            [[['vat', '=', $documento]]],
            ['limit' => 5]
        );

        if (empty($ids)) return null;

        $partners = $this->ejecutarKw(
            $uid,
            'res.partner',
            'read',
            [$ids],
            ['fields' => ['name', 'vat', 'email', 'phone', 'mobile']]
        );

        return $partners[0] ?? null;
    }

    /**
     * Trae los productos (líneas de venta y factura) de un médico por documento.
     * Retorna array vacío si no hay datos o falla la conexión.
     *
     * Cada elemento contiene:
     *  - origen      : 'Venta' | 'Factura'
     *  - referencia  : número de orden/factura
     *  - codigo      : código del producto extraído de [COD] Nombre
     *  - producto_id : ID interno Odoo
     *  - nombre      : nombre limpio del producto
     *  - cantidad    : float
     *  - precio      : float precio unitario
     *  - subtotal    : float
     *  - fecha       : string Y-m-d|null
     */
    public function getProductosPorDocumento(string $documento): array
    {
        $uid = $this->obtenerUid();
        if (!$uid) return [];

        $partnerIds = $this->buscarPartnerIds($uid, $documento);
        if (empty($partnerIds)) return [];

        return $this->obtenerProductos($uid, $partnerIds);
    }

    /**
     * Trae KPIs agregados de productos Odoo para un médico.
     *
     * Retorna array con:
     *  - total_valor_comprado      : suma de subtotales
     *  - total_valor_formulado     : 0 (no existe en Odoo)
     *  - total_unidades            : suma de cantidades
     *  - total_unidades_compradas  : suma de cantidades
     *  - total_unidades_formuladas : 0 (no existe en Odoo)
     *  - total_productos           : productos distintos
     *  - total_transacciones       : líneas totales
     *  - meses_activo              : meses con ventas
     *  - tendencia                 : [ mes, subtotal, unidades ] ordenado por mes
     *  - top_productos             : top 6 por subtotal
     *  - todos_productos           : todos agrupados por producto
     *
     * Retorna null si no hay conexión o el médico no existe en Odoo.
     */
    public function getKpisPorDocumento(string $documento, ?string $fechaDesde = null): ?array
    {
        $uid = $this->obtenerUid();
        if (!$uid) return null;

        $partnerIds = $this->buscarPartnerIds($uid, $documento);
        if (empty($partnerIds)) return null;

        $lineas = $this->obtenerProductos($uid, $partnerIds, $fechaDesde);
        if (empty($lineas)) {
            return $this->kpisVacios();
        }

        return $this->calcularKpis($lineas);
    }

    /**
     * Trae los totales y producto más comprado para un grupo de documentos de médicos
     * en un rango de fechas.
     * Retorna un array indexado por documento:
     * [
     *   documento => [
     *     'total_comprado' => float,
     *     'total_formulado' => 0.0,
     *     'producto_mas_comprado' => string|null,
     *     'producto_mas_formulado' => null
     *   ]
     * ]
     */
    public function getKpisGrupales(array $documentos, string $fechaDesde, string $fechaHasta): array
    {
        $uid = $this->obtenerUid();
        if (!$uid) return [];

        if (empty($documentos)) return [];

        // 1. Buscar partners
        $partnerIdsMap = []; // [partner_id => vat]
        $documentosChunks = array_chunk($documentos, 100);

        foreach ($documentosChunks as $chunk) {
            $ids = $this->ejecutarKw(
                $uid,
                'res.partner',
                'search',
                [[['vat', 'in', $chunk]]],
                ['limit' => 500]
            );

            if (!empty($ids) && is_array($ids)) {
                $partners = $this->ejecutarKw(
                    $uid,
                    'res.partner',
                    'read',
                    [$ids],
                    ['fields' => ['id', 'vat']]
                );

                if (is_array($partners)) {
                    foreach ($partners as $p) {
                        if (!empty($p['id']) && !empty($p['vat'])) {
                            $vat = trim((string)$p['vat']);
                            $partnerIdsMap[(int)$p['id']] = $vat;
                        }
                    }
                }
            }
        }

        if (empty($partnerIdsMap)) {
            return [];
        }

        // 2. Obtener productos de todos los partners encontrados
        $lineas = $this->obtenerProductos($uid, array_keys($partnerIdsMap), $fechaDesde, $fechaHasta);

        // 3. Agrupar y procesar KPIs por documento
        $resultados = [];
        foreach ($documentos as $doc) {
            $resultados[trim((string)$doc)] = [
                'total_comprado'         => 0.0,
                'total_formulado'        => 0.0,
                'producto_mas_comprado'  => null,
                'producto_mas_formulado' => null,
            ];
        }

        $prodCantidades = [];

        foreach ($lineas as $l) {
            $partnerId = $l['partner_id'] ?? null;
            if (!$partnerId || !isset($partnerIdsMap[$partnerId])) {
                continue;
            }

            $doc = $partnerIdsMap[$partnerId];
            if (!isset($resultados[$doc])) {
                continue;
            }

            $resultados[$doc]['total_comprado'] += $l['subtotal'];

            $prodNombre = $l['nombre'];
            if ($prodNombre && $l['cantidad'] > 0) {
                if (!isset($prodCantidades[$doc])) {
                    $prodCantidades[$doc] = [];
                }
                if (!isset($prodCantidades[$doc][$prodNombre])) {
                    $prodCantidades[$doc][$prodNombre] = 0.0;
                }
                $prodCantidades[$doc][$prodNombre] += $l['cantidad'];
            }
        }

        foreach ($prodCantidades as $doc => $productos) {
            if (!empty($productos)) {
                arsort($productos);
                $resultados[$doc]['producto_mas_comprado'] = array_key_first($productos);
            }
        }

        foreach ($resultados as $doc => $data) {
            $resultados[$doc]['total_comprado'] = round($data['total_comprado'], 2);
        }

        return $resultados;
    }

    /**
     * Trae transacciones (órdenes de venta y facturas) de un médico por documento.
     */
    public function getTransaccionesPorDocumento(string $documento): array
    {
        $uid = $this->obtenerUid();
        if (!$uid) return [];

        $partnerIds = $this->buscarPartnerIds($uid, $documento);
        if (empty($partnerIds)) return [];

        return $this->obtenerTransacciones($uid, $partnerIds);
    }

    /**
     * Comparativo de productos entre dos períodos para la vista de alertas.
     * Período A = mes seleccionado histórico.
     * Período B = mes actual real.
     *
     * $periodoA / $periodoB: ['desde' => 'Y-m-d', 'hasta' => 'Y-m-d']
     *
     * Retorna:
     *   ['encontrado' => false, 'mensaje' => '...']
     *   ['encontrado' => true,  'productos' => [...]]
     *
     * Cada producto tiene:
     *   codigo, nombre, laboratorio,
     *   comp_a (unidades período A), subtotal_a,
     *   comp_b (unidades período B), subtotal_b,
     *   diferencia, tendencia ('subio'|'bajo'|'igual')
     */
    public function getProductosComparativo(string $documento, array $periodoA, array $periodoB): array
    {
        $uid = $this->obtenerUid();
        if (!$uid) {
            return ['encontrado' => false, 'mensaje' => 'No se pudo autenticar con Odoo.'];
        }

        $partnerIds = $this->buscarPartnerIds($uid, $documento);
        if (empty($partnerIds)) {
            return ['encontrado' => false, 'mensaje' => 'No se encontró el médico en Odoo (documento: ' . $documento . ').'];
        }

        // Rango total que cubre ambos períodos para hacer una sola llamada a Odoo
        $fechaMin = min($periodoA['desde'], $periodoB['desde']);
        $fechaMax = max($periodoA['hasta'], $periodoB['hasta']);

        $lineas = $this->obtenerProductos($uid, $partnerIds, $fechaMin, $fechaMax);

        // Agrupamos por producto y asignamos cada línea al período que corresponde
        $mapa = [];

        foreach ($lineas as $linea) {
            $fecha  = substr($linea['fecha'] ?? '', 0, 10);
            $clave  = $linea['codigo'] !== '—' ? $linea['codigo'] : $linea['nombre'];

            if (!isset($mapa[$clave])) {
                $mapa[$clave] = [
                    'codigo'      => $linea['codigo'],
                    'nombre'      => $linea['nombre'],
                    'laboratorio' => $linea['laboratorio'] ?? null,
                    'comp_a'      => 0,
                    'subtotal_a'  => 0,
                    'comp_b'      => 0,
                    'subtotal_b'  => 0,
                ];
            }

            if ($fecha >= $periodoA['desde'] && $fecha <= $periodoA['hasta']) {
                $mapa[$clave]['comp_a']    += $linea['cantidad'];
                $mapa[$clave]['subtotal_a'] += $linea['subtotal'];
            }

            if ($fecha >= $periodoB['desde'] && $fecha <= $periodoB['hasta']) {
                $mapa[$clave]['comp_b']    += $linea['cantidad'];
                $mapa[$clave]['subtotal_b'] += $linea['subtotal'];
            }
        }

        $resultado = collect($mapa)
            ->filter(fn($p) => ($p['comp_a'] + $p['comp_b']) > 0)
            ->map(function ($p) {
                $dif = $p['comp_b'] - $p['comp_a'];
                return array_merge($p, [
                    'diferencia' => abs($dif),
                    'tendencia'  => $dif > 0 ? 'subio' : ($dif < 0 ? 'bajo' : 'igual'),
                ]);
            })
            ->sortByDesc('subtotal_a')
            ->values()
            ->all();

        return [
            'encontrado' => true,
            'productos'  => $resultado,
        ];
    }

    /**
     * Comparativo grupal de productos entre dos períodos para la lista de alertas.
     * Retorna un array indexado por documento:
     * [
     *   documento => [
     *     'totales' => [
     *       'comprado_mes_anterior' => float,
     *       'comprado_mes_actual' => float,
     *       'comprado_diferencia' => float,
     *       'comprado_tendencia' => string,
     *       'formulado_mes_anterior' => 0.0,
     *       'formulado_mes_actual' => 0.0,
     *       'formulado_diferencia' => 0.0,
     *       'formulado_tendencia' => 'igual',
     *     ],
     *     'productos' => [
     *       [
     *         'codigo' => string,
     *         'nombre' => string,
     *         'laboratorio' => string,
     *         'comprado_mes_anterior' => float,
     *         'comprado_mes_actual' => float,
     *         'comprado_diferencia' => float,
     *         'comprado_tendencia' => string,
     *         'formulado_mes_anterior' => 0.0,
     *         'formulado_mes_actual' => 0.0,
     *         'formulado_diferencia' => 0.0,
     *         'formulado_tendencia' => 'igual',
     *       ],
     *       ...
     *     ]
     *   ]
     * ]
     */
    public function getProductosComparativoGrupal(array $documentos, array $periodoA, array $periodoB): array
    {
        $uid = $this->obtenerUid();
        if (!$uid) return [];
        if (empty($documentos)) return [];

        // 1. Buscar partners
        $partnerIdsMap = []; // [partner_id => vat]
        $documentosChunks = array_chunk($documentos, 100);

        foreach ($documentosChunks as $chunk) {
            $ids = $this->ejecutarKw(
                $uid,
                'res.partner',
                'search',
                [[['vat', 'in', $chunk]]],
                ['limit' => 500]
            );

            if (!empty($ids) && is_array($ids)) {
                $partners = $this->ejecutarKw(
                    $uid,
                    'res.partner',
                    'read',
                    [$ids],
                    ['fields' => ['id', 'vat']]
                );

                if (is_array($partners)) {
                    foreach ($partners as $p) {
                        if (!empty($p['id']) && !empty($p['vat'])) {
                            $vat = trim((string)$p['vat']);
                            $partnerIdsMap[(int)$p['id']] = $vat;
                        }
                    }
                }
            }
        }

        if (empty($partnerIdsMap)) return [];

        $fechaMin = min($periodoA['desde'], $periodoB['desde']);
        $fechaMax = max($periodoA['hasta'], $periodoB['hasta']);

        // 2. Obtener productos de todos los partners encontrados
        $lineas = $this->obtenerProductos($uid, array_keys($partnerIdsMap), $fechaMin, $fechaMax);

        // 3. Inicializar estructura de resultados para todos los documentos solicitados
        $resultados = [];
        foreach ($documentos as $doc) {
            $docNormalized = trim((string)$doc);
            $resultados[$docNormalized] = [
                'totales' => [
                    'comprado_mes_anterior'  => 0.0,
                    'comprado_mes_actual'    => 0.0,
                    'comprado_diferencia'    => 0.0,
                    'comprado_tendencia'     => 'igual',
                    'formulado_mes_anterior' => 0.0,
                    'formulado_mes_actual'   => 0.0,
                    'formulado_diferencia'   => 0.0,
                    'formulado_tendencia'    => 'igual',
                ],
                'productos' => []
            ];
        }

        $prodMap = [];

        foreach ($lineas as $l) {
            $partnerId = $l['partner_id'] ?? null;
            if (!$partnerId || !isset($partnerIdsMap[$partnerId])) {
                continue;
            }

            $doc = $partnerIdsMap[$partnerId];
            if (!isset($resultados[$doc])) {
                continue;
            }

            $fecha = substr($l['fecha'] ?? '', 0, 10);
            $esA   = ($fecha >= $periodoA['desde'] && $fecha <= $periodoA['hasta']);
            $esB   = ($fecha >= $periodoB['desde'] && $fecha <= $periodoB['hasta']);

            if (!$esA && !$esB) {
                continue;
            }

            $clave = $l['codigo'] !== '—' ? $l['codigo'] : $l['nombre'];

            if ($esA) {
                $resultados[$doc]['totales']['comprado_mes_anterior'] += $l['cantidad'];
            }
            if ($esB) {
                $resultados[$doc]['totales']['comprado_mes_actual'] += $l['cantidad'];
            }

            if (!isset($prodMap[$doc])) {
                $prodMap[$doc] = [];
            }

            if (!isset($prodMap[$doc][$clave])) {
                $prodMap[$doc][$clave] = [
                    'codigo'                 => $l['codigo'],
                    'nombre'                 => $l['nombre'],
                    'laboratorio'            => $l['laboratorio'] ?? 'Sin Laboratorio',
                    'comprado_mes_anterior'  => 0.0,
                    'comprado_mes_actual'    => 0.0,
                    'comprado_diferencia'    => 0.0,
                    'comprado_tendencia'     => 'igual',
                    'formulado_mes_anterior' => 0.0,
                    'formulado_mes_actual'   => 0.0,
                    'formulado_diferencia'   => 0.0,
                    'formulado_tendencia'    => 'igual',
                ];
            }

            if ($esA) {
                $prodMap[$doc][$clave]['comprado_mes_anterior'] += $l['cantidad'];
            }
            if ($esB) {
                $prodMap[$doc][$clave]['comprado_mes_actual'] += $l['cantidad'];
            }
        }

        // Calcular diferencias y tendencias para cada médico y sus productos
        foreach ($resultados as $doc => &$info) {
            $t = &$info['totales'];
            $dif = $t['comprado_mes_actual'] - $t['comprado_mes_anterior'];
            $t['comprado_diferencia'] = abs($dif);
            $t['comprado_tendencia']  = $dif > 0 ? 'subio' : ($dif < 0 ? 'bajo' : 'igual');

            if (isset($prodMap[$doc])) {
                foreach ($prodMap[$doc] as $clave => $pInfo) {
                    $pDif = $pInfo['comprado_mes_actual'] - $pInfo['comprado_mes_anterior'];
                    $pInfo['comprado_diferencia'] = abs($pDif);
                    $pInfo['comprado_tendencia']  = $pDif > 0 ? 'subio' : ($pDif < 0 ? 'bajo' : 'igual');

                    $totalUds = $pInfo['comprado_mes_anterior'] + $pInfo['comprado_mes_actual'];
                    if ($totalUds > 0) {
                        $info['productos'][] = $pInfo;
                    }
                }
            }
        }
        unset($info);

        return $resultados;
    }

    // =========================================================================
    //  HELPERS PRIVADOS — CONSULTAS
    // =========================================================================

    /**
     * Busca los IDs de res.partner que coincidan con el documento (vat).
     */
    private function buscarPartnerIds(int $uid, string $documento): array
    {
        $ids = $this->ejecutarKw(
            $uid,
            'res.partner',
            'search',
            [[['vat', '=', $documento]]],
            ['limit' => 5]
        );

        return is_array($ids) ? $ids : [];
    }

    /**
     * Obtiene las líneas de producto (ventas + facturas) para un conjunto de partnerIds.
     */
    private function obtenerProductos(int $uid, array $partnerIds, ?string $fechaDesde = null, ?string $fechaHasta = null): array
    {
        $productos = [];

        // ── 1. Líneas de órdenes de venta ────────────────────────────────────
        $filtroVentas = [['partner_id', 'in', $partnerIds]];
        if ($fechaDesde) {
            $filtroVentas[] = ['date_order', '>=', $fechaDesde . ' 00:00:00'];
        }
        if ($fechaHasta) {
            $filtroVentas[] = ['date_order', '<=', $fechaHasta . ' 23:59:59'];
        }

        $orderIds = $this->ejecutarKw(
            $uid,
            'sale.order',
            'search',
            [$filtroVentas]
        );

        if (!empty($orderIds)) {
            try {
                // Leer las fechas de las órdenes para poder asignarlas a las líneas
                $fechasPorOrden = [];
                $partnersPorOrden = [];
                $ordenesData = $this->ejecutarKw(
                    $uid,
                    'sale.order',
                    'read',
                    [$orderIds],
                    ['fields' => ['id', 'date_order', 'partner_id']]
                );
                if (is_array($ordenesData)) {
                    foreach ($ordenesData as $ord) {
                        if (isset($ord['id'])) {
                            $fechasPorOrden[(int) $ord['id']] = isset($ord['date_order']) ? substr((string) $ord['date_order'], 0, 10) : null;
                            $partnerIdRaw = $ord['partner_id'] ?? null;
                            $partnersPorOrden[(int) $ord['id']] = is_array($partnerIdRaw) ? ($partnerIdRaw[0] ?? null) : $partnerIdRaw;
                        }
                    }
                }

                $lineas = $this->ejecutarKw(
                    $uid,
                    'sale.order.line',
                    'search_read',
                    [[['order_id', 'in', $orderIds]]],
                    [
                        'fields' => [
                            'product_id', 'name', 'product_uom_qty',
                            'price_unit', 'price_subtotal', 'order_id',
                            'display_type',
                        ],
                        'order' => 'id desc',
                    ]
                );

                if (is_array($lineas)) {
                    foreach ($lineas as $linea) {
                        if (!empty($linea['display_type'])) continue;
                        if (empty($linea['product_id']))    continue;
                        // Cruzar la fecha de la orden padre
                        $ordId = is_array($linea['order_id']) ? ($linea['order_id'][0] ?? null) : $linea['order_id'];
                        $fecha = $ordId ? ($fechasPorOrden[(int) $ordId] ?? null) : null;
                        $partnerId = $ordId ? ($partnersPorOrden[(int) $ordId] ?? null) : null;
                        $productos[] = $this->mapearLineaVenta($linea, $fecha, $partnerId);
                    }
                }
            } catch (\Exception $e) {
                Log::warning('[OdooService] Error en sale.order.line: ' . $e->getMessage());
            }
        }

        // ── 2. Líneas de facturas ────────────────comentado hasta que se decida usar─────────────────────────────
        /**$filtroFacturas = [
            ['partner_id', 'in', $partnerIds],
            ['move_type', '=', 'out_invoice'],
        ];
        if ($fechaDesde) {
            $filtroFacturas[] = ['invoice_date', '>=', $fechaDesde];
        }
        if ($fechaHasta) {
            $filtroFacturas[] = ['invoice_date', '<=', $fechaHasta];
        }

        $moveIds = $this->ejecutarKw(
            $uid,
            'account.move',
            'search',
            [$filtroFacturas]
        );

        if (!empty($moveIds)) {
            try {
                $lineas = $this->ejecutarKw(
                    $uid,
                    'account.move.line',
                    'search_read',
                    [[
                        ['move_id', 'in', $moveIds],
                        ['display_type', '=', 'product'],
                    ]],
                    [
                        'fields' => [
                            'product_id', 'name', 'quantity',
                            'price_unit', 'price_subtotal', 'move_id',
                        ],
                        'order' => 'id desc',
                    ]
                );

                if (is_array($lineas)) {
                    foreach ($lineas as $linea) {
                        if (empty($linea['product_id'])) continue;
                        $productos[] = $this->mapearLineaFactura($linea);
                    }
                }
            } catch (\Exception $e) {
                Log::warning('[OdooService] Error en account.move.line: ' . $e->getMessage());
            }
        }*/

        return $productos;
    }

    /**
     * Obtiene transacciones (sale.order + account.move) para un conjunto de partnerIds.
     */
    private function obtenerTransacciones(int $uid, array $partnerIds): array
    {
        $transacciones = [];

        // Ventas
        try {
            $sales = $this->ejecutarKw(
                $uid,
                'sale.order',
                'search_read',
                [[['partner_id', 'in', $partnerIds]]],
                [
                    'fields' => ['id', 'name', 'date_order', 'amount_total', 'amount_untaxed', 'amount_tax', 'state'],
                    'order'  => 'date_order desc',
                ]
            );

            if (is_array($sales)) {
                foreach ($sales as $s) {
                    $transacciones[] = [
                        'origen'         => 'Odoo (Venta)',
                        'id'             => $s['id'],
                        'referencia'     => $s['name'],
                        'fecha'          => $s['date_order'] ?? null,
                        'total'          => is_numeric($s['amount_total']   ?? null) ? (float) $s['amount_total']   : 0,
                        'base_imponible' => is_numeric($s['amount_untaxed'] ?? null) ? (float) $s['amount_untaxed'] : 0,
                        'impuestos'      => is_numeric($s['amount_tax']     ?? null) ? (float) $s['amount_tax']     : 0,
                        'estado'         => $s['state'] ?? 'Desconocido',
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning('[OdooService] Error en sale.order: ' . $e->getMessage());
        }

        // Facturas
        try {
            $moves = $this->ejecutarKw(
                $uid,
                'account.move',
                'search_read',
                [[
                    ['partner_id', 'in', $partnerIds],
                    ['move_type', '=', 'out_invoice'],
                ]],
                [
                    'fields' => ['id', 'name', 'invoice_date', 'amount_total', 'amount_untaxed', 'amount_tax', 'state'],
                    'order'  => 'invoice_date desc',
                ]
            );

            if (is_array($moves)) {
                foreach ($moves as $m) {
                    $transacciones[] = [
                        'origen'         => 'Odoo (Factura)',
                        'id'             => $m['id'],
                        'referencia'     => $m['name'],
                        'fecha'          => $m['invoice_date'] ?? null,
                        'total'          => is_numeric($m['amount_total']   ?? null) ? (float) $m['amount_total']   : 0,
                        'base_imponible' => is_numeric($m['amount_untaxed'] ?? null) ? (float) $m['amount_untaxed'] : 0,
                        'impuestos'      => is_numeric($m['amount_tax']     ?? null) ? (float) $m['amount_tax']     : 0,
                        'estado'         => $m['state'] ?? 'Desconocido',
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::warning('[OdooService] Error en account.move: ' . $e->getMessage());
        }

        usort($transacciones, fn($a, $b) => strcmp($b['fecha'] ?? '', $a['fecha'] ?? ''));

        return $transacciones;
    }

    // =========================================================================
    //  CÁLCULO DE KPIs
    // =========================================================================

    /**
     * Calcula KPIs a partir de las líneas de producto obtenidas de Odoo.
     * Agrupa por producto y por mes.
     */
    private function calcularKpis(array $lineas): array
    {
        $totalValor    = 0;
        $totalUnidades = 0;
        $productoMap   = []; // [clave => [ codigo, nombre, subtotal, unidades ]]
        $tendenciaMap  = []; // [Y-m  => [ mes, subtotal, unidades ]]

        foreach ($lineas as $l) {
            $totalValor    += $l['subtotal'];
            $totalUnidades += $l['cantidad'];

            // Clave de agrupación por producto
            $clave = $l['codigo'] !== '—' ? $l['codigo'] : $l['nombre'];
            if (!isset($productoMap[$clave])) {
                $productoMap[$clave] = [
                    'codigo'          => $l['codigo'],
                    'nombre'          => $l['nombre'],
                    'laboratorio'     => $l['laboratorio'] ?? null,
                    // Keys que espera el React
                    'valor_comprado'  => 0,
                    'valor_formulado' => 0,   // No existe en Odoo
                    'unidades'        => 0,
                ];
            }
            $productoMap[$clave]['valor_comprado'] += $l['subtotal'];
            $productoMap[$clave]['unidades']       += $l['cantidad'];

            // Agrupación por mes (solo si tenemos fecha)
            if (!empty($l['fecha'])) {
                $mes = substr($l['fecha'], 0, 7); // Y-m
                if (!isset($tendenciaMap[$mes])) {
                    // Keys que espera el React en tendenciaData: valor_comprado, valor_formulado
                    $tendenciaMap[$mes] = [
                        'mes'             => $mes,
                        'valor_comprado'  => 0,
                        'valor_formulado' => 0,  // No existe en Odoo
                        'unidades'        => 0,
                    ];
                }
                $tendenciaMap[$mes]['valor_comprado'] += $l['subtotal'];
                $tendenciaMap[$mes]['unidades']       += $l['cantidad'];
            }
        }

        uasort($productoMap, fn($a, $b) => $b['valor_comprado'] <=> $a['valor_comprado']);
        ksort($tendenciaMap);

        $todosProductos = array_values($productoMap);
        $topProductos   = array_slice($todosProductos, 0, 6);
        $tendencia      = array_values($tendenciaMap);
        $mesesActivo    = count(array_filter($tendenciaMap, fn($m) => $m['valor_comprado'] > 0));

        return [
            // KPIs principales
            'total_valor_comprado'     => round($totalValor, 2),
            'total_valor_formulado'    => 0,   // No existe en Odoo
            'total_unidades'           => $totalUnidades,
            'total_unidades_compradas' => $totalUnidades,
            'total_unidades_formuladas'=> 0,   // No existe en Odoo
            'total_productos'          => count($productoMap),
            'total_transacciones'      => count($lineas),
            'meses_activo'             => $mesesActivo,

            // Colecciones
            'tendencia'                => $tendencia,
            'top_productos'            => $topProductos,
            'todos_productos'          => $todosProductos,
        ];
    }

    /**
     * KPIs vacíos cuando el médico existe en Odoo pero no tiene transacciones.
     */
    private function kpisVacios(): array
    {
        return [
            'total_valor_comprado'     => 0,
            'total_valor_formulado'    => 0,
            'total_unidades'           => 0,
            'total_unidades_compradas' => 0,
            'total_unidades_formuladas'=> 0,
            'total_productos'          => 0,
            'total_transacciones'      => 0,
            'meses_activo'             => 0,
            'tendencia'                => [],
            'top_productos'            => [],
            'todos_productos'          => [],
        ];
    }

    // =========================================================================
    //  MAPPERS DE LÍNEAS
    // =========================================================================

    private function mapearLineaVenta(array $linea, ?string $fecha = null, ?int $partnerId = null): array
    {
        $productId = is_array($linea['product_id']) ? ($linea['product_id'][0] ?? null) : null;
        $nombre    = is_array($linea['product_id']) ? ($linea['product_id'][1] ?? $linea['name']) : $linea['name'];
        $orderId   = $linea['order_id'] ?? null;

        return [
            'origen'      => 'Venta',
            'referencia'  => is_array($orderId) ? ($orderId[1] ?? '—') : '—',
            'codigo'      => $this->extraerCodigo($nombre),
            'producto_id' => $productId,
            'nombre'      => $this->limpiarNombre($nombre),
            'cantidad'    => is_numeric($linea['product_uom_qty'] ?? null) ? (float) $linea['product_uom_qty'] : 0,
            'precio'      => is_numeric($linea['price_unit']      ?? null) ? (float) $linea['price_unit']      : 0,
            'subtotal'    => is_numeric($linea['price_subtotal']  ?? null) ? (float) $linea['price_subtotal']  : 0,
            'fecha'       => $fecha, // Fecha cruzada desde sale.order.date_order
            'partner_id'  => $partnerId,
        ];
    }

    private function mapearLineaFactura(array $linea): array
    {
        $productId = is_array($linea['product_id']) ? ($linea['product_id'][0] ?? null) : null;
        $nombre    = is_array($linea['product_id']) ? ($linea['product_id'][1] ?? $linea['name']) : $linea['name'];
        $moveId    = $linea['move_id'] ?? null;

        return [
            'origen'      => 'Factura',
            'referencia'  => is_array($moveId) ? ($moveId[1] ?? '—') : '—',
            'codigo'      => $this->extraerCodigo($nombre),
            'producto_id' => $productId,
            'nombre'      => $this->limpiarNombre($nombre),
            'cantidad'    => is_numeric($linea['quantity']      ?? null) ? (float) $linea['quantity']      : 0,
            'precio'      => is_numeric($linea['price_unit']    ?? null) ? (float) $linea['price_unit']    : 0,
            'subtotal'    => is_numeric($linea['price_subtotal']?? null) ? (float) $linea['price_subtotal'] : 0,
            'fecha'       => null, // account.move.line no incluye fecha directamente
        ];
    }

    // =========================================================================
    //  HELPERS XML-RPC
    // =========================================================================

    private function ejecutarKw(
        int    $uid,
        string $modelo,
        string $metodo,
        array  $args   = [],
        array  $kwargs = []
    ): mixed {
        try {
            $argsXml   = $this->valorToXml($args);
            $kwargsXml = $this->valorToXml($kwargs);

            $xml = <<<XML
            <?xml version="1.0"?>
            <methodCall>
                <methodName>execute_kw</methodName>
                <params>
                    <param><value><string>{$this->db}</string></value></param>
                    <param><value><int>{$uid}</int></value></param>
                    <param><value><string>{$this->password}</string></value></param>
                    <param><value><string>{$modelo}</string></value></param>
                    <param><value><string>{$metodo}</string></value></param>
                    <param><value>{$argsXml}</value></param>
                    <param><value>{$kwargsXml}</value></param>
                </params>
            </methodCall>
            XML;

            $response = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'text/xml'])
                ->send('POST', rtrim($this->url, '/') . '/xmlrpc/2/object', ['body' => $xml]);

            if (!$response->successful()) {
                Log::error('[OdooService] execute_kw falló: ' . $response->body());
                return null;
            }

            return $this->parseXmlResponse($response->body());

        } catch (\Exception $e) {
            Log::error('[OdooService] Excepción en ejecutarKw: ' . $e->getMessage());
            return null;
        }
    }

    private function xmlCall(string $method, array $params = []): string
    {
        $paramsXml = '';
        foreach ($params as [$tipo, $valor]) {
            if ($tipo === 'string') {
                $paramsXml .= '<param><value><string>' . htmlspecialchars((string) $valor) . '</string></value></param>';
            } elseif ($tipo === 'struct') {
                $paramsXml .= '<param><value><struct></struct></value></param>';
            }
        }

        return <<<XML
        <?xml version="1.0"?>
        <methodCall>
            <methodName>{$method}</methodName>
            <params>{$paramsXml}</params>
        </methodCall>
        XML;
    }

    private function valorToXml(mixed $valor): string
    {
        if (is_array($valor)) {
            if (array_keys($valor) !== range(0, count($valor) - 1)) {
                $members = '';
                foreach ($valor as $k => $v) {
                    $members .= "<member><name>{$k}</name><value>{$this->valorToXml($v)}</value></member>";
                }
                return "<struct>{$members}</struct>";
            }
            $items = '';
            foreach ($valor as $v) {
                $items .= "<value>{$this->valorToXml($v)}</value>";
            }
            return "<array><data>{$items}</data></array>";
        }

        if (is_int($valor))    return "<int>{$valor}</int>";
        if (is_bool($valor))   return "<boolean>" . ($valor ? '1' : '0') . "</boolean>";
        if (is_string($valor)) return "<string>" . htmlspecialchars($valor) . "</string>";

        return "<string></string>";
    }

    private function parseXmlResponse(string $body): mixed
    {
        try {
            $xml = simplexml_load_string($body);
            if (!$xml) return null;

            if (isset($xml->fault)) {
                Log::error('[OdooService] Fault de Odoo: ' . $body);
                return null;
            }

            if (isset($xml->params->param->value)) {
                return $this->parseValue($xml->params->param->value);
            }

            return null;

        } catch (\Exception $e) {
            Log::error('[OdooService] Error parseando XML: ' . $e->getMessage());
            return null;
        }
    }

    private function parseValue(\SimpleXMLElement $valueNode): mixed
    {
        foreach ($valueNode->children() as $typeNode) {
            switch ($typeNode->getName()) {
                case 'int':
                case 'i4':
                    return (int) $typeNode;
                case 'double':
                    return (float) $typeNode;
                case 'boolean':
                    return ((string) $typeNode === '1' || (string) $typeNode === 'true');
                case 'string':
                    return (string) $typeNode;
                case 'array':
                    $arr = [];
                    if (isset($typeNode->data)) {
                        foreach ($typeNode->data->value as $val) {
                            $arr[] = $this->parseValue($val);
                        }
                    }
                    return $arr;
                case 'struct':
                    $struct = [];
                    foreach ($typeNode->member as $member) {
                        $struct[(string) $member->name] = $this->parseValue($member->value);
                    }
                    return $struct;
            }
        }
        return (string) $valueNode;
    }

    // =========================================================================
    //  UTILIDADES DE NOMBRE
    // =========================================================================

    /**
     * Extrae el código del formato "[COD123] Nombre del producto"
     */
    private function extraerCodigo(string $nombreCompleto): string
    {
        if (preg_match('/^\[(.+?)\]/', $nombreCompleto, $m)) {
            return $m[1];
        }
        return '—';
    }

    /**
     * Quita el prefijo "[CODIGO]" del nombre del producto.
     */
    private function limpiarNombre(string $nombreCompleto): string
    {
        return trim(preg_replace('/^\[.+?\]\s*/', '', $nombreCompleto));
    }
}