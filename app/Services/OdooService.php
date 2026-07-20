<?php

namespace App\Services;

use App\Models\ListaPrecio;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OdooService
{
    /**
     * Tags de res.partner.category que sí representan una especialidad médica.
     * Los tags de esta instancia de Odoo también incluyen cosas que no son
     * especialidad (consentimiento de mercadeo, tipo de negocio, basura de
     * captura, etc.), así que se listan explícitamente las que aplican.
     */
    public const ESPECIALIDADES_CONOCIDAS = [
        'CIRUJANO PLÁSTICO', 'DERMATÓLOGO', 'ENDOCRINO', 'ENFERMERA', 'ESTETICISTA',
        'ESTETICO MÉDICO', 'FAMILIAR', 'FISIOTERAPEUTA', 'FUNCIONAL', 'GASTROENTEROLOGO',
        'GENERAL', 'GERIATRA', 'GINECOLOGO', 'HOMEOPATA', 'MEDICO LABORAL', 'NEFROLOGO',
        'NEUROLOGO', 'NUTRICIONISTA', 'ODONTOLOGO', 'OFTALMOLOGO', 'ORTOPEDISTA', 'OTORRINO',
        'PEDIATRA', 'PSICOLOGO', 'SIQUIATRA', 'TERAPIA ACUPUNTURA', 'VETERINARIO', 'DEPORTOLOGO',
        'EPIDEMIOLOGO', 'FISIATRA', 'INTEGRATIVO', 'INTERNISTA', 'MEDICO VASCULAR',
        'TERAPIA CHINA', 'TERAPIA NEURAL', 'ENFERMERA PROF.',
    ];

    private string $url;
    private string $db;
    private string $username;
    private string $password;

    /** Memoiza obtenerLineasClasificadas() por (partnerIds+rango) dentro de la misma request. */
    private array $cacheLineasClasificadas = [];

    /** Memoiza el mapa [odoo_pricelist_id => categoria]. */
    private ?array $cacheCategoriasPorPricelist = null;

    /** Memoiza el mapa [odoo_pricelist_id => nombre de la tarifa]. */
    private ?array $cacheNombresPricelist = null;

    /** Memoiza búsquedas de nombre local por código (para el reemplazo de nombres "(copia)"). */
    private array $cacheNombresLocales = [];

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
            ['fields' => ['name', 'vat', 'email', 'phone', 'mobile', 'l10n_latam_identification_type_id']]
        );

        return $partners[0] ?? null;
    }

    // =========================================================================
    //  CACHÉ POR DOCUMENTO — panel de detalle (KPIs, transacciones, etc.)
    // =========================================================================

    /**
     * Clave de caché versionada para un método *PorDocumento(). La versión
     * (guardada aparte, por documento) permite invalidar TODO lo cacheado de
     * un médico —sin importar con qué rango de fechas se haya guardado cada
     * entrada— con un solo incremento, en vez de tener que enumerar y borrar
     * cada combinación de fechas posible.
     */
    private function cacheKeyPorDocumento(string $prefijo, string $documento, ?string $fechaDesde = null, ?string $fechaHasta = null): string
    {
        $version = Cache::get("odoo_doc_version_{$documento}", 1);
        return "odoo_{$prefijo}_{$documento}_v{$version}_" . ($fechaDesde ?? 'x') . '_' . ($fechaHasta ?? 'x');
    }

    /**
     * Invalida (para este documento) todo lo cacheado por los métodos
     * *PorDocumento(): KPIs, formulación, transacciones, tarifas sin
     * clasificar y tipo de documento — para cualquier rango de fechas con el
     * que se haya guardado. Se llama desde el botón "Sincronizar con Odoo"
     * del panel de detalle antes de recalcular en vivo.
     */
    public function invalidarCachePorDocumento(string $documento): void
    {
        $version = Cache::get("odoo_doc_version_{$documento}", 1);
        Cache::put("odoo_doc_version_{$documento}", $version + 1, now()->addDays(7));
    }

    /**
     * Invalida la caché del módulo Cartera (vista global, todos los
     * médicos). Se llama desde el botón "Actualizar" de /Gcartera.
     */
    public function invalidarCarteraGlobal(): void
    {
        $version = Cache::get('odoo_cartera_version', 1);
        Cache::put('odoo_cartera_version', $version + 1, now()->addDays(7));
    }

    /**
     * Resuelve el tipo de documento (Cédula de Ciudadanía, NIT, etc.) directo
     * desde Odoo (res.partner.l10n_latam_identification_type_id), en vez del
     * catálogo local — que puede quedar desactualizado frente al dato real
     * capturado en Odoo. Retorna null si no se encuentra el contacto o el
     * campo no está asignado.
     */
    public function getTipoDocumentoPorDocumento(string $documento): ?string
    {
        $cacheKey = $this->cacheKeyPorDocumento('tipo_doc', $documento);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($documento) {
            $partner = $this->buscarMedicoPorDocumento($documento);
            $tipo = $partner['l10n_latam_identification_type_id'] ?? null;
            return is_array($tipo) ? ($tipo[1] ?? null) : null;
        });
    }

    /**
     * Resuelve la especialidad médica (tag de Odoo) para un lote de documentos.
     * Retorna un mapa [documento => especialidad] — solo incluye los documentos
     * que tienen al menos un tag reconocido en ESPECIALIDADES_CONOCIDAS; el resto
     * queda fuera del mapa (el llamador decide el fallback).
     *
     * Un mismo documento puede tener varios contactos duplicados en Odoo con
     * tags distintos: se unen todas las especialidades encontradas para ese
     * documento. El resultado se cachea 30 min porque resolver esto contra
     * Odoo para lotes grandes (cientos/miles de documentos) toma varios
     * segundos y no cambia con esa frecuencia.
     */
    public function getEspecialidadesPorDocumentos(array $documentos): array
    {
        $documentos = array_values(array_unique(array_filter(array_map('trim', $documentos))));
        if (empty($documentos)) return [];

        $cacheKey = 'odoo_especialidades_' . md5(implode(',', $documentos));

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($documentos) {
            $uid = $this->obtenerUid();
            if (!$uid) return [];

            $partners = $this->ejecutarKw(
                $uid,
                'res.partner',
                'search_read',
                [[['vat', 'in', $documentos]]],
                ['fields' => ['vat', 'category_id']]
            );

            if (empty($partners)) return [];

            $idsUnicos = [];
            foreach ($partners as $p) {
                foreach ($p['category_id'] ?? [] as $catId) {
                    $idsUnicos[$catId] = true;
                }
            }

            $nombresPorId = [];
            if (!empty($idsUnicos)) {
                $categorias = $this->ejecutarKw(
                    $uid,
                    'res.partner.category',
                    'read',
                    [array_keys($idsUnicos)],
                    ['fields' => ['name']]
                );
                foreach ((array) $categorias as $cat) {
                    $nombresPorId[$cat['id']] = $cat['name'];
                }
            }

            $especialidadesPorDocumento = [];
            foreach ($partners as $p) {
                if (empty($p['vat'])) continue;
                $documento = trim((string) $p['vat']);

                foreach ($p['category_id'] ?? [] as $catId) {
                    $nombre = $nombresPorId[$catId] ?? null;
                    if ($nombre && in_array(mb_strtoupper($nombre), self::ESPECIALIDADES_CONOCIDAS, true)) {
                        $especialidadesPorDocumento[$documento][$nombre] = true;
                    }
                }
            }

            return array_map(fn($nombres) => implode(', ', array_keys($nombres)), $especialidadesPorDocumento);
        });
    }

    /**
     * Atajo de getEspecialidadesPorDocumentos() para un único documento.
     * Mismo criterio que usa el admin (Medico2Controller::resolverEspecialidadOdoo):
     * la columna local 'especialidad' de medicos es legado, la fuente de
     * verdad es el tag de Odoo. Retorna null si Odoo no tiene un tag
     * reconocido para ese documento.
     */
    public function resolverEspecialidadPorDocumento(?string $documento): ?string
    {
        if (empty($documento)) return null;
        return $this->getEspecialidadesPorDocumentos([$documento])[trim($documento)] ?? null;
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
    public function getKpisPorDocumento(string $documento, ?string $fechaDesde = null, ?string $fechaHasta = null): ?array
    {
        $cacheKey = $this->cacheKeyPorDocumento('kpis', $documento, $fechaDesde, $fechaHasta);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($documento, $fechaDesde, $fechaHasta) {
            $uid = $this->obtenerUid();
            if (!$uid) return null;

            $partnerIds = $this->buscarPartnerIds($uid, $documento);
            if (empty($partnerIds)) return null;

            $lineas = $this->obtenerProductos($uid, $partnerIds, $fechaDesde, $fechaHasta);
            if (empty($lineas)) {
                return $this->kpisVacios();
            }

            return $this->calcularKpis($lineas);
        });
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

        $partnerIdsMap = $this->mapaPartnerIdsPorDocumentos($uid, $documentos);
        if (empty($partnerIdsMap)) return [];

        $lineas = $this->obtenerLineasClasificadas($uid, array_keys($partnerIdsMap), $fechaDesde, $fechaHasta);

        $resultados = [];
        foreach ($documentos as $doc) {
            $resultados[trim((string) $doc)] = [
                'total_comprado'         => 0.0,
                'total_formulado'        => 0.0,
                'producto_mas_comprado'  => null,
                'producto_mas_formulado' => null,
            ];
        }

        $prodCantidadesComprado  = [];
        $prodCantidadesFormulado = [];

        foreach ($lineas as $l) {
            if ($l['categoria'] !== 'Compra' && $l['categoria'] !== 'Formulación') continue;

            foreach ($this->docsAcreditados($l, $partnerIdsMap) as $doc) {
                if (!isset($resultados[$doc])) continue;

                if ($l['categoria'] === 'Compra') {
                    $resultados[$doc]['total_comprado'] += $l['subtotal'];
                    if ($l['nombre'] && $l['cantidad'] > 0) {
                        $prodCantidadesComprado[$doc][$l['nombre']] = ($prodCantidadesComprado[$doc][$l['nombre']] ?? 0.0) + $l['cantidad'];
                    }
                } else {
                    $resultados[$doc]['total_formulado'] += $l['subtotal'];
                    if ($l['nombre'] && $l['cantidad'] > 0) {
                        $prodCantidadesFormulado[$doc][$l['nombre']] = ($prodCantidadesFormulado[$doc][$l['nombre']] ?? 0.0) + $l['cantidad'];
                    }
                }
            }
        }

        foreach ($prodCantidadesComprado as $doc => $productos) {
            arsort($productos);
            $resultados[$doc]['producto_mas_comprado'] = array_key_first($productos);
        }
        foreach ($prodCantidadesFormulado as $doc => $productos) {
            arsort($productos);
            $resultados[$doc]['producto_mas_formulado'] = array_key_first($productos);
        }

        foreach ($resultados as $doc => $data) {
            $resultados[$doc]['total_comprado']  = round($data['total_comprado'], 2);
            $resultados[$doc]['total_formulado'] = round($data['total_formulado'], 2);
        }

        return $resultados;
    }

    /**
     * Cartera pendiente de cobro para MUCHOS médicos a la vez (módulo
     * Cartera): resuelve documentos → partner_id en lotes
     * (mapaPartnerIdsPorDocumentos, ya chunkeada de a 100) y trae las
     * facturas con saldo pendiente en lotes de `TAMANO_LOTE_CARTERA`
     * partner IDs por llamada — filtrando en el propio dominio de Odoo
     * (solo `account.move` posteadas con `amount_residual > 0`) en vez de
     * traer todo el histórico como hace obtenerTransacciones().
     *
     * Retorna solo los documentos con saldo pendiente > 0:
     * [documento => ['pendiente'=>float,'vencida'=>float,'facturas_vencidas'=>int,'dias_max_vencido'=>int]]
     */
    private const TAMANO_LOTE_CARTERA = 300;

    /**
     * Cartera pendiente de cobro de TODOS los contactos con facturas
     * impagas en Odoo — estén o no registrados localmente como médico
     * (aseguradoras, empresas, etc. también facturan y también deben).
     * A diferencia de la versión anterior (que solo miraba a los médicos
     * ya registrados), acá se recorre `account.move` completo por lotes
     * (paginado con offset/limit, sin filtrar por partner_id) y luego se
     * resuelve documento (vat) + nombre de Odoo solo para los partners que
     * sí aparecieron con saldo pendiente — mucho más liviano que resolver
     * partner_id para todos los médicos de antemano.
     *
     * Un mismo documento puede repetirse en varios partner_id en Odoo (p.
     * ej. una aseguradora con más de un contacto duplicado): se suman.
     *
     * Retorna [clave => ['documento'=>?string,'nombre_odoo'=>?string,'pendiente'=>float,'vencida'=>float,'facturas_vencidas'=>int,'dias_max_vencido'=>int]]
     * (clave = documento si lo hay, si no "sin_documento_{partner_id}").
     */
    private const LOTE_FACTURAS_CARTERA = 2000;

    public function getCarteraGlobal(): array
    {
        $version = Cache::get('odoo_cartera_version', 1);
        $cacheKey = "odoo_cartera_global_v{$version}";

        return Cache::remember($cacheKey, now()->addMinutes(30), function () {
            $uid = $this->obtenerUid();
            if (!$uid) return [];

            $hoy = now()->format('Y-m-d');
            $porPartner = [];
            $offset = 0;

            do {
                try {
                    $facturas = $this->ejecutarKw(
                        $uid,
                        'account.move',
                        'search_read',
                        [[
                            ['move_type', '=', 'out_invoice'],
                            ['state', '=', 'posted'],
                            ['amount_residual', '>', 0],
                        ]],
                        [
                            'fields' => ['partner_id', 'invoice_date_due', 'amount_residual'],
                            'limit'  => self::LOTE_FACTURAS_CARTERA,
                            'offset' => $offset,
                        ]
                    );
                } catch (\Exception $e) {
                    Log::warning('[OdooService] Error en getCarteraGlobal (offset ' . $offset . '): ' . $e->getMessage());
                    break;
                }

                if (!is_array($facturas) || empty($facturas)) break;

                foreach ($facturas as $f) {
                    $partnerId = $this->extraerIdRelacion($f['partner_id'] ?? null);
                    if ($partnerId === null) continue;

                    $saldo = is_numeric($f['amount_residual'] ?? null) ? (float) $f['amount_residual'] : 0.0;
                    $fechaVence = $f['invoice_date_due'] ?? null;
                    $vencida = $fechaVence && $fechaVence < $hoy;

                    if (!isset($porPartner[$partnerId])) {
                        $porPartner[$partnerId] = ['pendiente' => 0.0, 'vencida' => 0.0, 'facturas_vencidas' => 0, 'dias_max_vencido' => 0];
                    }

                    $porPartner[$partnerId]['pendiente'] += $saldo;
                    if ($vencida) {
                        $porPartner[$partnerId]['vencida'] += $saldo;
                        $porPartner[$partnerId]['facturas_vencidas']++;
                        $dias = abs((int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($fechaVence)->startOfDay()));
                        if ($dias > $porPartner[$partnerId]['dias_max_vencido']) {
                            $porPartner[$partnerId]['dias_max_vencido'] = $dias;
                        }
                    }
                }

                $offset += self::LOTE_FACTURAS_CARTERA;
            } while (count($facturas) === self::LOTE_FACTURAS_CARTERA);

            if (empty($porPartner)) return [];

            // Resolver vat + nombre solo para los partners que quedaron con saldo pendiente.
            $vatPorId = [];
            $nombresPorId = [];
            foreach (array_chunk(array_keys($porPartner), self::TAMANO_LOTE_CARTERA) as $lotePartnerIds) {
                $partners = $this->ejecutarKw($uid, 'res.partner', 'read', [$lotePartnerIds], ['fields' => ['name', 'vat']]);
                if (is_array($partners)) {
                    foreach ($partners as $p) {
                        $vatPorId[$p['id']]     = !empty($p['vat']) ? trim((string) $p['vat']) : null;
                        $nombresPorId[$p['id']] = $p['name'] ?? null;
                    }
                }
            }

            $resultados = [];
            foreach ($porPartner as $partnerId => $data) {
                $doc = $vatPorId[$partnerId] ?? null;
                $clave = $doc ?: "sin_documento_{$partnerId}";

                if (!isset($resultados[$clave])) {
                    $resultados[$clave] = [
                        'documento'         => $doc,
                        'nombre_odoo'       => $nombresPorId[$partnerId] ?? null,
                        'pendiente'         => 0.0,
                        'vencida'           => 0.0,
                        'facturas_vencidas' => 0,
                        'dias_max_vencido'  => 0,
                    ];
                }

                $resultados[$clave]['pendiente']         += $data['pendiente'];
                $resultados[$clave]['vencida']           += $data['vencida'];
                $resultados[$clave]['facturas_vencidas'] += $data['facturas_vencidas'];
                $resultados[$clave]['dias_max_vencido']   = max($resultados[$clave]['dias_max_vencido'], $data['dias_max_vencido']);
            }

            foreach ($resultados as $clave => $data) {
                $resultados[$clave]['pendiente'] = round($data['pendiente'], 2);
                $resultados[$clave]['vencida']   = round($data['vencida'], 2);
            }

            return $resultados;
        });
    }

    /**
     * Resumen agregado para MUCHOS médicos a la vez (dashboard admin): un
     * solo fetch a Odoo (vía obtenerLineasClasificadas) y agregación en PHP
     * de totales globales, tendencia mensual, por producto y por médico.
     * Categorías distintas de 'Compra'/'Formulación' (Solo Positiva, Solo
     * Empleados, NA) quedan fuera de los totales, igual que en el resto de
     * la app.
     */
    public function obtenerResumenAdmin(array $documentos, string $fechaDesde, string $fechaHasta): array
    {
        $vacio = [
            'total_valor_comprado'      => 0.0,
            'total_valor_formulado'     => 0.0,
            'total_unidades_compradas'  => 0,
            'total_unidades_formuladas' => 0,
            'total_transacciones'       => 0,
            'medicos_con_tx'            => 0,
            'tendencia'                 => [],
            'productos'                 => [],
            'porMedico'                 => [],
        ];

        $uid = $this->obtenerUid();
        if (!$uid || empty($documentos)) return $vacio;

        $partnerIdsMap = $this->mapaPartnerIdsPorDocumentos($uid, $documentos);
        if (empty($partnerIdsMap)) return $vacio;

        $lineas = $this->obtenerLineasClasificadas($uid, array_keys($partnerIdsMap), $fechaDesde, $fechaHasta);

        $totalValorComprado      = 0.0;
        $totalValorFormulado     = 0.0;
        $totalUnidadesCompradas  = 0.0;
        $totalUnidadesFormuladas = 0.0;
        $totalTransacciones      = 0;
        $docsConTx               = [];

        $tendenciaMap = [];
        $productosMap = [];
        $porMedico    = [];

        foreach ($lineas as $l) {
            if ($l['categoria'] !== 'Compra' && $l['categoria'] !== 'Formulación') continue;

            $esCompra = $l['categoria'] === 'Compra';
            $totalTransacciones++;

            if ($esCompra) {
                $totalValorComprado     += $l['subtotal'];
                $totalUnidadesCompradas += $l['cantidad'];
            } else {
                $totalValorFormulado     += $l['subtotal'];
                $totalUnidadesFormuladas += $l['cantidad'];
            }

            $mes = substr($l['fecha'] ?? '', 0, 7);
            if ($mes) {
                if (!isset($tendenciaMap[$mes])) {
                    $tendenciaMap[$mes] = [
                        'mes' => $mes, 'valor_comprado' => 0.0, 'valor_formulado' => 0.0,
                        'unidades_compradas' => 0.0, 'unidades_formuladas' => 0.0,
                    ];
                }
                if ($esCompra) {
                    $tendenciaMap[$mes]['valor_comprado']     += $l['subtotal'];
                    $tendenciaMap[$mes]['unidades_compradas'] += $l['cantidad'];
                } else {
                    $tendenciaMap[$mes]['valor_formulado']     += $l['subtotal'];
                    $tendenciaMap[$mes]['unidades_formuladas'] += $l['cantidad'];
                }
            }

            $claveProd = $l['codigo'] !== '—' ? $l['codigo'] : $l['nombre'];
            if ($claveProd) {
                if (!isset($productosMap[$claveProd])) {
                    $productosMap[$claveProd] = [
                        'codigo' => $l['codigo'], 'nombre' => $l['nombre'],
                        'valor_comprado' => 0.0, 'valor_formulado' => 0.0, 'unidades' => 0.0,
                    ];
                }
                if ($esCompra) {
                    $productosMap[$claveProd]['valor_comprado'] += $l['subtotal'];
                    $productosMap[$claveProd]['unidades']       += $l['cantidad'];
                } else {
                    $productosMap[$claveProd]['valor_formulado'] += $l['subtotal'];
                }
            }

            foreach ($this->docsAcreditados($l, $partnerIdsMap) as $doc) {
                $docsConTx[$doc] = true;
                if (!isset($porMedico[$doc])) {
                    $porMedico[$doc] = [
                        'valor_comprado' => 0.0, 'valor_formulado' => 0.0,
                        'unidades_compradas' => 0.0, 'unidades_formuladas' => 0.0,
                    ];
                }
                if ($esCompra) {
                    $porMedico[$doc]['valor_comprado']     += $l['subtotal'];
                    $porMedico[$doc]['unidades_compradas'] += $l['cantidad'];
                } else {
                    $porMedico[$doc]['valor_formulado']     += $l['subtotal'];
                    $porMedico[$doc]['unidades_formuladas'] += $l['cantidad'];
                }
            }
        }

        ksort($tendenciaMap);

        $productos = collect($productosMap)->values()->sortByDesc('valor_comprado')->values()->all();

        return [
            'total_valor_comprado'      => round($totalValorComprado, 2),
            'total_valor_formulado'     => round($totalValorFormulado, 2),
            'total_unidades_compradas'  => (int) $totalUnidadesCompradas,
            'total_unidades_formuladas' => (int) $totalUnidadesFormuladas,
            'total_transacciones'       => $totalTransacciones,
            'medicos_con_tx'            => count($docsConTx),
            'tendencia'                 => array_values($tendenciaMap),
            'productos'                 => $productos,
            'porMedico'                 => $porMedico,
        ];
    }

    /**
     * Trae transacciones (órdenes de venta y facturas) de un médico por documento.
     */
    public function getTransaccionesPorDocumento(string $documento, ?string $fechaDesde = null, ?string $fechaHasta = null): array
    {
        $cacheKey = $this->cacheKeyPorDocumento('transacciones', $documento, $fechaDesde, $fechaHasta);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($documento, $fechaDesde, $fechaHasta) {
            $uid = $this->obtenerUid();
            if (!$uid) return [];

            $partnerIds = $this->buscarPartnerIds($uid, $documento);
            if (empty($partnerIds)) return [];

            return $this->obtenerTransacciones($uid, $partnerIds, $fechaDesde, $fechaHasta);
        });
    }

    /**
     * Facturas paginadas de un documento para el panel de detalle de Cartera.
     * A diferencia de getTransaccionesPorDocumento, pagina la consulta contra
     * Odoo (limit/offset + search_count) en vez de traer todo el historial de
     * una vez: hay clientes (aseguradoras, empresas) con decenas de miles de
     * facturas — un solo search_read sin límite para esos casos devuelve una
     * respuesta XML tan grande que revienta el memory_limit de PHP solo al
     * parsearla, y aunque no reventara, no tendría sentido mandarle al
     * navegador un JSON de decenas de miles de filas para paginar en cliente.
     *
     * Retorna ['facturas' => [...], 'total' => int].
     */
    public function getFacturasPorDocumentoPaginado(string $documento, int $pagina, int $porPagina, string $filtroEstado): array
    {
        $version  = Cache::get("odoo_doc_version_{$documento}", 1);
        $cacheKey = "odoo_facturas_pag_{$documento}_v{$version}_{$filtroEstado}_{$pagina}_{$porPagina}";

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($documento, $pagina, $porPagina, $filtroEstado) {
            $uid = $this->obtenerUid();
            if (!$uid) return ['facturas' => [], 'total' => 0];

            $partnerIds = $this->buscarPartnerIds($uid, $documento);
            if (empty($partnerIds)) return ['facturas' => [], 'total' => 0];

            $dominio = $this->dominioFacturasPorFiltro($partnerIds, $filtroEstado);

            $total = 0;
            try {
                $total = (int) $this->ejecutarKw($uid, 'account.move', 'search_count', [$dominio]);
            } catch (\Exception $e) {
                Log::warning('[OdooService] Error en search_count facturas cartera: ' . $e->getMessage());
            }

            $facturas = [];
            try {
                $moves = $this->ejecutarKw(
                    $uid,
                    'account.move',
                    'search_read',
                    [$dominio],
                    [
                        'fields' => [
                            'id', 'name', 'invoice_date', 'invoice_date_due',
                            'amount_total', 'amount_untaxed', 'amount_tax', 'amount_residual',
                            'state', 'payment_state',
                        ],
                        'order'  => 'invoice_date desc',
                        'limit'  => $porPagina,
                        'offset' => max(0, ($pagina - 1) * $porPagina),
                    ]
                );

                if (is_array($moves)) {
                    foreach ($moves as $m) {
                        $facturas[] = [
                            'origen'          => 'Odoo (Factura)',
                            'id'              => $m['id'],
                            'referencia'      => $m['name'],
                            'fecha'           => $m['invoice_date'] ?? null,
                            'fecha_vence'     => $m['invoice_date_due'] ?? null,
                            'total'           => is_numeric($m['amount_total']    ?? null) ? (float) $m['amount_total']    : 0,
                            'base_imponible'  => is_numeric($m['amount_untaxed']  ?? null) ? (float) $m['amount_untaxed']  : 0,
                            'impuestos'       => is_numeric($m['amount_tax']      ?? null) ? (float) $m['amount_tax']      : 0,
                            'saldo_pendiente' => is_numeric($m['amount_residual'] ?? null) ? (float) $m['amount_residual'] : 0,
                            'estado'          => $m['state'] ?? 'Desconocido',
                            'estado_pago'     => $m['payment_state'] ?? null,
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('[OdooService] Error en search_read facturas cartera: ' . $e->getMessage());
            }

            return ['facturas' => $facturas, 'total' => $total];
        });
    }

    /**
     * Dominio Odoo para cada pestaña de filtro del panel de detalle de
     * Cartera. "vencida" no es un payment_state de Odoo, es una condición
     * derivada (saldo pendiente + fecha de vencimiento pasada).
     */
    private function dominioFacturasPorFiltro(array $partnerIds, string $filtroEstado): array
    {
        $dominio = [
            ['partner_id', 'in', $partnerIds],
            ['move_type', '=', 'out_invoice'],
            ['state', '!=', 'cancel'],
        ];

        switch ($filtroEstado) {
            case 'vencida':
                $dominio[] = ['amount_residual', '>', 0];
                $dominio[] = ['invoice_date_due', '<', now()->format('Y-m-d')];
                break;
            case 'not_paid':
            case 'partial':
            case 'paid':
                $dominio[] = ['payment_state', '=', $filtroEstado];
                break;
        }

        return $dominio;
    }

    /**
     * Trae todas las listas de precios (product.pricelist) activas desde Odoo.
     * Retorna array de ['odoo_id' => int, 'nombre' => string].
     */
    public function getPricelists(): array
    {
        $uid = $this->obtenerUid();
        if (!$uid) return [];

        $rows = $this->ejecutarKw(
            $uid,
            'product.pricelist',
            'search_read',
            [[['id', '>=', 0]]],
            ['fields' => ['name']]
        );

        if (!is_array($rows)) return [];

        return collect($rows)
            ->map(fn($r) => ['odoo_id' => (int) $r['id'], 'nombre' => (string) $r['name']])
            ->values()
            ->all();
    }

    /**
     * Trae las líneas de formulación (sale.order.line de todas las órdenes donde doctor_id
     * coincide con el médico) directo de Odoo.
     */
    public function getFormulacionPorDocumento(string $documento, ?string $fechaDesde = null, ?string $fechaHasta = null): array
    {
        $cacheKey = $this->cacheKeyPorDocumento('formulacion', $documento, $fechaDesde, $fechaHasta);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($documento, $fechaDesde, $fechaHasta) {
            $uid = $this->obtenerUid();
            if (!$uid) return [];

            $partnerIds = $this->buscarPartnerIds($uid, $documento);
            if (empty($partnerIds)) return [];

            $lineas = $this->obtenerLineasClasificadas($uid, $partnerIds, $fechaDesde, $fechaHasta);

            return collect($lineas)
                ->filter(fn($l) => $l['categoria'] === 'Formulación')
                ->map(fn($l) => [
                    'origen'      => 'Formulación',
                    'referencia'  => $l['referencia'],
                    'codigo'      => $l['codigo'],
                    'producto_id' => $l['producto_id'],
                    'nombre'      => $l['nombre'],
                    'cantidad'    => $l['cantidad'],
                    'precio'      => $l['precio'],
                    'subtotal'    => $l['subtotal'],
                    'total'       => $l['total'],
                    'fecha'       => $l['fecha'],
                    'estado'      => $l['estado'],
                ])
                ->values()
                ->all();
        });
    }

    /**
     * Desglosa las líneas cuya tarifa (pricelist) todavía no tiene una
     * categoría asignada en Configuración > Tarifas ('NA'). Ese valor ya se
     * suma dentro de "Compra" (ver obtenerProductos()); esto solo sirve para
     * mostrarle al usuario a qué tarifas corresponde, para que las clasifique.
     */
    public function getTarifasSinClasificarPorDocumento(string $documento, ?string $fechaDesde = null, ?string $fechaHasta = null): array
    {
        $vacio = ['total' => 0.0, 'lineas' => 0, 'tarifas' => []];
        $cacheKey = $this->cacheKeyPorDocumento('tarifas_na', $documento, $fechaDesde, $fechaHasta);

        return Cache::remember($cacheKey, now()->addMinutes(30), function () use ($documento, $fechaDesde, $fechaHasta, $vacio) {
            $uid = $this->obtenerUid();
            if (!$uid) return $vacio;

            $partnerIds = $this->buscarPartnerIds($uid, $documento);
            if (empty($partnerIds)) return $vacio;

            // Mismo criterio de "cancelada" que calcularKpis(): una línea NA
            // cancelada no cuenta dentro de "Val. comprado", así que tampoco
            // debe sumar aquí — si no, el desglose puede superar el total.
            $lineasNa = array_filter(
                $this->obtenerLineasClasificadas($uid, $partnerIds, $fechaDesde, $fechaHasta),
                function ($l) {
                    if ($l['categoria'] !== 'NA') return false;
                    $estado = strtoupper($l['estado'] ?? $l['state'] ?? '');
                    return !in_array($estado, ['CANCEL', 'CANCELADO', 'CANCELADA'], true);
                }
            );
            if (empty($lineasNa)) return $vacio;

            $nombresPricelist = $this->nombresPricelistPorId();

            $porTarifa = [];
            foreach ($lineasNa as $l) {
                $nombre = $l['pricelist_id'] !== null
                    ? ($nombresPricelist[$l['pricelist_id']] ?? 'Tarifa sin nombre en Odoo')
                    : 'Sin tarifa asignada en la orden';

                if (!isset($porTarifa[$nombre])) {
                    $porTarifa[$nombre] = ['nombre' => $nombre, 'valor' => 0.0, 'lineas' => 0];
                }
                $porTarifa[$nombre]['valor']  += $l['subtotal'];
                $porTarifa[$nombre]['lineas']++;
            }

            $tarifas = collect($porTarifa)->sortByDesc('valor')->values()->all();

            return [
                'total'   => round(array_sum(array_column($tarifas, 'valor')), 2),
                'lineas'  => count($lineasNa),
                'tarifas' => $tarifas,
            ];
        });
    }

    /** Memoiza el mapa [odoo_pricelist_id => nombre de la tarifa], leído de la tabla local. */
    private function nombresPricelistPorId(): array
    {
        if ($this->cacheNombresPricelist !== null) {
            return $this->cacheNombresPricelist;
        }

        return $this->cacheNombresPricelist = ListaPrecio::query()
            ->whereNotNull('odoo_id')
            ->pluck('nombre', 'odoo_id')
            ->mapWithKeys(fn($nombre, $odooId) => [(int) $odooId => (string) $nombre])
            ->all();
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
                    // Con signo, igual que formulado_diferencia — antes se guardaba
                    // abs($dif), lo que hacía que una caída se mostrara como "+X"/"X"
                    // en vez de "-X" en el frontend.
                    'diferencia' => $dif,
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

        $partnerIdsMap = $this->mapaPartnerIdsPorDocumentos($uid, $documentos);
        if (empty($partnerIdsMap)) return [];

        $fechaMin = min($periodoA['desde'], $periodoB['desde']);
        $fechaMax = max($periodoA['hasta'], $periodoB['hasta']);

        $lineas = collect($this->obtenerLineasClasificadas($uid, array_keys($partnerIdsMap), $fechaMin, $fechaMax))
            ->filter(fn($l) => $l['categoria'] === 'Compra')
            ->all();

        // Inicializar estructura de resultados para todos los documentos solicitados
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
            $fecha = substr($l['fecha'] ?? '', 0, 10);
            $esA   = ($fecha >= $periodoA['desde'] && $fecha <= $periodoA['hasta']);
            $esB   = ($fecha >= $periodoB['desde'] && $fecha <= $periodoB['hasta']);

            if (!$esA && !$esB) {
                continue;
            }

            $clave = $l['codigo'] !== '—' ? $l['codigo'] : $l['nombre'];

            foreach ($this->docsAcreditados($l, $partnerIdsMap) as $doc) {
                if (!isset($resultados[$doc])) continue;

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
        }

        // Calcular diferencias y tendencias para cada médico y sus productos
        foreach ($resultados as $doc => &$info) {
            $t = &$info['totales'];
            $dif = $t['comprado_mes_actual'] - $t['comprado_mes_anterior'];
            // Con signo, igual que formulado_diferencia — mismo bug que en
            // getProductosComparativo() (abs() ocultaba las caídas mostrándolas
            // en positivo).
            $t['comprado_diferencia'] = $dif;
            $t['comprado_tendencia']  = $dif > 0 ? 'subio' : ($dif < 0 ? 'bajo' : 'igual');

            if (isset($prodMap[$doc])) {
                foreach ($prodMap[$doc] as $clave => $pInfo) {
                    $pDif = $pInfo['comprado_mes_actual'] - $pInfo['comprado_mes_anterior'];
                    $pInfo['comprado_diferencia'] = $pDif;
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

    /**
     * Versión grupal de getFormulacionPorDocumento(): trae la formulación
     * (sale.order.line vía doctor_id) de VARIOS médicos en una sola pasada
     * a Odoo, en lugar de una llamada por médico. Pensada para reemplazar
     * el foreach + 2 llamadas/médico que se usaba en AlertaController::index().
     *
     * Retorna un array indexado por documento:
     * [
     *   documento => [
     *     'formulado_mes_anterior' => float,
     *     'formulado_mes_actual'   => float,
     *     'formulado_diferencia'   => float,  // (actual - anterior), con signo
     *     'formulado_tendencia'    => 'subio'|'bajo'|'igual',
     *   ]
     * ]
     *
     * $periodoA / $periodoB: ['desde' => 'Y-m-d', 'hasta' => 'Y-m-d']
     */
    public function getFormulacionGrupalPorDocumentos(array $documentos, array $periodoA, array $periodoB): array
    {
        // Estructura vacía por defecto para todos los documentos pedidos,
        // así el controller siempre recibe una entrada por médico aunque
        // Odoo no tenga nada para él (o falle la conexión).
        $resultados = [];
        foreach ($documentos as $doc) {
            $resultados[trim((string) $doc)] = [
                'formulado_mes_anterior' => 0.0,
                'formulado_mes_actual'   => 0.0,
                'formulado_diferencia'   => 0.0,
                'formulado_tendencia'    => 'igual',
            ];
        }

        $uid = $this->obtenerUid();
        if (!$uid || empty($documentos)) return $resultados;

        $partnerIdsMap = $this->mapaPartnerIdsPorDocumentos($uid, $documentos);
        if (empty($partnerIdsMap)) return $resultados;

        $fechaMin = min($periodoA['desde'], $periodoB['desde']);
        $fechaMax = max($periodoA['hasta'], $periodoB['hasta']);

        $lineas = collect($this->obtenerLineasClasificadas($uid, array_keys($partnerIdsMap), $fechaMin, $fechaMax))
            ->filter(fn($l) => $l['categoria'] === 'Formulación');

        foreach ($lineas as $l) {
            $fecha = substr($l['fecha'] ?? '', 0, 10);

            foreach ($this->docsAcreditados($l, $partnerIdsMap) as $doc) {
                if (!isset($resultados[$doc])) continue;

                if ($fecha >= $periodoA['desde'] && $fecha <= $periodoA['hasta']) {
                    $resultados[$doc]['formulado_mes_anterior'] += $l['cantidad'];
                }
                if ($fecha >= $periodoB['desde'] && $fecha <= $periodoB['hasta']) {
                    $resultados[$doc]['formulado_mes_actual'] += $l['cantidad'];
                }
            }
        }

        // Diferencia y tendencia por médico (mismo criterio que el
        // AlertaController original: diferencia con signo, no absoluta).
        foreach ($resultados as $doc => &$r) {
            $dif = $r['formulado_mes_actual'] - $r['formulado_mes_anterior'];
            $r['formulado_diferencia'] = $dif;
            $r['formulado_tendencia']  = $dif > 0 ? 'subio' : ($dif < 0 ? 'bajo' : 'igual');
        }
        unset($r);

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
     * Busca los res.partner (por vat) para un grupo de documentos.
     * Retorna [odoo_partner_id => documento].
     */
    private function mapaPartnerIdsPorDocumentos(int $uid, array $documentos): array
    {
        $mapa = [];

        foreach (array_chunk($documentos, 100) as $chunk) {
            $ids = $this->ejecutarKw(
                $uid,
                'res.partner',
                'search',
                [[['vat', 'in', $chunk]]],
                ['limit' => 500]
            );

            if (empty($ids) || !is_array($ids)) continue;

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
                        $mapa[(int) $p['id']] = trim((string) $p['vat']);
                    }
                }
            }
        }

        return $mapa;
    }

    /**
     * Documentos (médicos del grupo) a los que se debe acreditar una línea:
     * por partner_id (comprador) y/o doctor_id (prescriptor). Un pedido
     * puede acreditar a dos médicos distintos si cada rol lo ocupa alguien
     * diferente y ambos están siendo rastreados en el grupo.
     */
    private function docsAcreditados(array $linea, array $partnerIdsMap): array
    {
        $docs = [];

        if (isset($linea['partner_id']) && isset($partnerIdsMap[$linea['partner_id']])) {
            $docs[] = $partnerIdsMap[$linea['partner_id']];
        }
        if (isset($linea['doctor_id']) && isset($partnerIdsMap[$linea['doctor_id']])) {
            $doc = $partnerIdsMap[$linea['doctor_id']];
            if (!in_array($doc, $docs, true)) {
                $docs[] = $doc;
            }
        }

        return $docs;
    }

    /**
     * Mapa [odoo_pricelist_id => categoria] desde la tabla local `listas_precios`.
     * Memoizado: es una tabla chica (~15-20 filas) que no cambia durante una request.
     */
    private function categoriasPorPricelist(): array
    {
        if ($this->cacheCategoriasPorPricelist !== null) {
            return $this->cacheCategoriasPorPricelist;
        }

        return $this->cacheCategoriasPorPricelist = ListaPrecio::query()
            ->whereNotNull('odoo_id')
            ->pluck('categoria', 'odoo_id')
            ->mapWithKeys(fn($categoria, $odooId) => [(int) $odooId => (string) $categoria])
            ->all();
    }

    /**
     * Normaliza un campo relacional many2one de Odoo: puede venir como [id, "Nombre"] o como id plano.
     */
    private function extraerIdRelacion(mixed $valor): ?int
    {
        if (is_array($valor)) {
            return isset($valor[0]) ? (int) $valor[0] : null;
        }
        return $valor ? (int) $valor : null;
    }

    /**
     * Trae, en una sola consulta, todos los sale.order donde el médico es
     * comprador (partner_id) o prescriptor (doctor_id), y clasifica cada
     * línea según la categoría de la tarifa (pricelist_id) usada en el
     * pedido — no según cuál campo coincidió. Esto es lo que decide si una
     * línea cuenta como "Compra", "Formulación" u otra categoría (Solo
     * Positiva, Solo Empleados, NA), reemplazando el criterio anterior
     * basado en partner_id vs doctor_id.
     */
    private function obtenerLineasClasificadas(int $uid, array $partnerIds, ?string $fechaDesde = null, ?string $fechaHasta = null): array
    {
        if (empty($partnerIds)) return [];

        sort($partnerIds);
        $cacheKey = implode(',', $partnerIds) . '|' . ($fechaDesde ?? '') . '|' . ($fechaHasta ?? '');
        if (isset($this->cacheLineasClasificadas[$cacheKey])) {
            return $this->cacheLineasClasificadas[$cacheKey];
        }

        $filtro = ['|', ['partner_id', 'in', $partnerIds], ['doctor_id', 'in', $partnerIds]];
        if ($fechaDesde) {
            $filtro[] = ['date_order', '>=', $fechaDesde . ' 00:00:00'];
        }
        if ($fechaHasta) {
            $filtro[] = ['date_order', '<=', $fechaHasta . ' 23:59:59'];
        }

        $orderIds = $this->ejecutarKw($uid, 'sale.order', 'search', [$filtro]);
        if (empty($orderIds) || !is_array($orderIds)) {
            return $this->cacheLineasClasificadas[$cacheKey] = [];
        }

        $ordenes = [];
        try {
            $ordenesRaw = $this->ejecutarKw(
                $uid,
                'sale.order',
                'read',
                [$orderIds],
                ['fields' => ['id', 'date_order', 'partner_id', 'doctor_id', 'pricelist_id', 'state']]
            );
            if (is_array($ordenesRaw)) {
                foreach ($ordenesRaw as $orden) {
                    if (isset($orden['id'])) {
                        $ordenes[(int) $orden['id']] = $orden;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('[OdooService] Error leyendo cabeceras sale.order (clasificadas): ' . $e->getMessage());
            return $this->cacheLineasClasificadas[$cacheKey] = [];
        }

        $categoriaPorPricelist = $this->categoriasPorPricelist();
        $lineas = [];

        try {
            $lineasRaw = $this->ejecutarKw(
                $uid,
                'sale.order.line',
                'search_read',
                [[['order_id', 'in', $orderIds]]],
                [
                    'fields' => [
                        'product_id', 'name', 'product_uom_qty',
                        'price_unit', 'price_subtotal', 'order_id',
                        'display_type', 'state',
                    ],
                    'order' => 'id desc',
                ]
            );

            if (is_array($lineasRaw)) {
                foreach ($lineasRaw as $linea) {
                    if (!empty($linea['display_type'])) continue;
                    if (empty($linea['product_id']))    continue;

                    $ordId = $this->extraerIdRelacion($linea['order_id'] ?? null);
                    $orden = $ordId ? ($ordenes[$ordId] ?? null) : null;
                    if (!$orden) continue;

                    $partnerIdOrden = $this->extraerIdRelacion($orden['partner_id'] ?? null);
                    $doctorIdOrden  = $this->extraerIdRelacion($orden['doctor_id'] ?? null);
                    $pricelistId    = $this->extraerIdRelacion($orden['pricelist_id'] ?? null);
                    $categoria      = $pricelistId !== null ? ($categoriaPorPricelist[$pricelistId] ?? 'NA') : 'NA';

                    $fecha = isset($orden['date_order']) ? substr((string) $orden['date_order'], 0, 10) : null;

                    $mapeada = $this->mapearLineaVenta($linea, $fecha, $partnerIdOrden);
                    // Todas las cifras se calculan sobre el valor base (price_subtotal),
                    // antes de impuestos y retenciones. No usamos price_total (incluye IVA).
                    $mapeada['total']        = $mapeada['subtotal'];
                    $mapeada['estado']       = $mapeada['state'];
                    $mapeada['categoria']    = $categoria;
                    $mapeada['pricelist_id'] = $pricelistId;
                    $mapeada['doctor_id']    = $doctorIdOrden;
                    $mapeada['order_id']     = $ordId;

                    $lineas[] = $mapeada;
                }
            }
        } catch (\Exception $e) {
            Log::warning('[OdooService] Error en sale.order.line (clasificadas): ' . $e->getMessage());
            return $this->cacheLineasClasificadas[$cacheKey] = [];
        }

        return $this->cacheLineasClasificadas[$cacheKey] = $lineas;
    }

    /**
     * Obtiene las líneas de producto clasificadas como "Compra" (según la
     * tarifa del pedido) para un conjunto de partnerIds.
     */
    private function obtenerProductos(int $uid, array $partnerIds, ?string $fechaDesde = null, ?string $fechaHasta = null): array
    {
        $lineas = $this->obtenerLineasClasificadas($uid, $partnerIds, $fechaDesde, $fechaHasta);

        // Las líneas con tarifa 'NA' (pricelist aún sin clasificar en
        // Configuración > Tarifas) se cuentan como "Compra" en vez de
        // quedar invisibles — ver getTarifasSinClasificarPorDocumento()
        // para el desglose de a qué tarifas corresponden.
        return array_values(array_filter($lineas, fn($l) => $l['categoria'] === 'Compra' || $l['categoria'] === 'NA'));
    }

    /**
     * Obtiene transacciones (sale.order + account.move) para un conjunto de partnerIds.
     */
    private function obtenerTransacciones(int $uid, array $partnerIds, ?string $fechaDesde = null, ?string $fechaHasta = null): array
    {
        $transacciones = [];

        // Ventas
        try {
            $filtroVentas = [['partner_id', 'in', $partnerIds]];
            if ($fechaDesde) $filtroVentas[] = ['date_order', '>=', $fechaDesde . ' 00:00:00'];
            if ($fechaHasta) $filtroVentas[] = ['date_order', '<=', $fechaHasta . ' 23:59:59'];

            $sales = $this->ejecutarKw(
                $uid,
                'sale.order',
                'search_read',
                [$filtroVentas],
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
            $filtroFacturas = [
                ['partner_id', 'in', $partnerIds],
                ['move_type', '=', 'out_invoice'],
            ];
            if ($fechaDesde) $filtroFacturas[] = ['invoice_date', '>=', $fechaDesde];
            if ($fechaHasta) $filtroFacturas[] = ['invoice_date', '<=', $fechaHasta];

            $moves = $this->ejecutarKw(
                $uid,
                'account.move',
                'search_read',
                [$filtroFacturas],
                [
                    'fields' => [
                        'id', 'name', 'invoice_date', 'invoice_date_due',
                        'amount_total', 'amount_untaxed', 'amount_tax', 'amount_residual',
                        'state', 'payment_state',
                    ],
                    'order'  => 'invoice_date desc',
                ]
            );

            if (is_array($moves)) {
                foreach ($moves as $m) {
                    $transacciones[] = [
                        'origen'          => 'Odoo (Factura)',
                        'id'              => $m['id'],
                        'referencia'      => $m['name'],
                        'fecha'           => $m['invoice_date'] ?? null,
                        'fecha_vence'     => $m['invoice_date_due'] ?? null,
                        'total'           => is_numeric($m['amount_total']    ?? null) ? (float) $m['amount_total']    : 0,
                        'base_imponible'  => is_numeric($m['amount_untaxed']  ?? null) ? (float) $m['amount_untaxed']  : 0,
                        'impuestos'       => is_numeric($m['amount_tax']      ?? null) ? (float) $m['amount_tax']      : 0,
                        'saldo_pendiente' => is_numeric($m['amount_residual'] ?? null) ? (float) $m['amount_residual'] : 0,
                        'estado'          => $m['state'] ?? 'Desconocido',
                        'estado_pago'     => $m['payment_state'] ?? null,
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
    // $lineas viene de obtenerProductos(), que ya sólo trae categoria === 'Compra'.
    // El lado "formulado" de este método se mantiene en 0 explícito: se calcula
    // aparte (getFormulacionPorDocumento) y se combina en el controller.
    $totalValor    = 0;
    $totalUnidades = 0;

    $productoMap   = []; // [clave => [ codigo, nombre, subtotal, unidades, ... ]]
    $tendenciaMap  = []; // [Y-m   => [ mes, subtotal, unidades, ... ]]

    foreach ($lineas as $l) {
        // Si la línea está cancelada, la ignoramos por completo
        $estado = strtoupper($l['estado'] ?? $l['state'] ?? '');
        if ($estado === 'CANCEL' || $estado === 'CANCELADO' || $estado === 'CANCELADA') {
            continue;
        }

        // Acumuladores globales
        $totalValor    += $l['subtotal'];
        $totalUnidades += $l['cantidad'];

        // Clave de agrupación por producto
        $clave = $l['codigo'] !== '—' ? $l['codigo'] : $l['nombre'];
        if (!isset($productoMap[$clave])) {
            $productoMap[$clave] = [
                'codigo'              => $l['codigo'],
                'nombre'              => $l['nombre'],
                'laboratorio'         => $l['laboratorio'] ?? null,
                'valor_comprado'      => 0,
                'valor_formulado'     => 0,
                'unidades'            => 0, // Unidades compradas
                'unidades_formuladas' => 0,
            ];
        }
        $productoMap[$clave]['valor_comprado'] += $l['subtotal'];
        $productoMap[$clave]['unidades']       += $l['cantidad'];

        // Agrupación por mes (solo si tenemos fecha)
        if (!empty($l['fecha'])) {
            $mes = substr($l['fecha'], 0, 7); // Y-m
            if (!isset($tendenciaMap[$mes])) {
                $tendenciaMap[$mes] = [
                    'mes'                 => $mes,
                    'valor_comprado'      => 0,
                    'valor_formulado'     => 0,
                    'unidades'            => 0, // Unidades compradas
                    'unidades_formuladas' => 0,
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
        'total_valor_comprado'      => round($totalValor, 2),
        'total_valor_formulado'     => 0,
        'total_unidades'            => $totalUnidades,
        'total_unidades_compradas'  => $totalUnidades,
        'total_unidades_formuladas' => 0,
        'total_productos'           => count($productoMap),
        'total_transacciones'       => count($lineas),
        'meses_activo'              => $mesesActivo,

        // Colecciones
        'tendencia'                 => $tendencia,
        'top_productos'             => $topProductos,
        'todos_productos'           => $todosProductos,
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
        $codigo    = $this->extraerCodigo($nombre);

        return [
            'origen'      => 'Venta',
            'referencia'  => is_array($orderId) ? ($orderId[1] ?? '—') : '—',
            'codigo'      => $codigo,
            'producto_id' => $productId,
            'nombre'      => $this->resolverNombreProducto($codigo, $this->limpiarNombre($nombre)),
            'cantidad'    => is_numeric($linea['product_uom_qty'] ?? null) ? (float) $linea['product_uom_qty'] : 0,
            'precio'      => is_numeric($linea['price_unit']      ?? null) ? (float) $linea['price_unit']      : 0,
            'subtotal'    => is_numeric($linea['price_subtotal']  ?? null) ? (float) $linea['price_subtotal']  : 0,
            'fecha'       => $fecha, // Fecha cruzada desde sale.order.date_order
            'partner_id'  => $partnerId,
            'state'       => $linea['state'] ?? 'draft', // 🟢 AGREGAMOS ESTA LÍNEA para transferir el estado
        ];
    }

    private function mapearLineaFactura(array $linea): array
    {
        $productId = is_array($linea['product_id']) ? ($linea['product_id'][0] ?? null) : null;
        $nombre    = is_array($linea['product_id']) ? ($linea['product_id'][1] ?? $linea['name']) : $linea['name'];
        $moveId    = $linea['move_id'] ?? null;
        $codigo    = $this->extraerCodigo($nombre);

        return [
            'origen'      => 'Factura',
            'referencia'  => is_array($moveId) ? ($moveId[1] ?? '—') : '—',
            'codigo'      => $codigo,
            'producto_id' => $productId,
            'nombre'      => $this->resolverNombreProducto($codigo, $this->limpiarNombre($nombre)),
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

    /**
     * Odoo a veces tiene productos duplicados cuyo nombre quedó marcado como
     * "... (copia)" tras una duplicación manual en el ERP. Cuando eso pasa,
     * se prefiere el nombre registrado localmente en la tabla 'productos'
     * (por código) en vez del nombre corrupto que viene de Odoo.
     */
    private function resolverNombreProducto(string $codigo, string $nombreOdoo): string
    {
        if (stripos($nombreOdoo, '(copia)') === false) {
            return $nombreOdoo;
        }

        if ($codigo === '—' || $codigo === '') {
            return $nombreOdoo;
        }

        if (!array_key_exists($codigo, $this->cacheNombresLocales)) {
            $this->cacheNombresLocales[$codigo] = DB::table('productos')
                ->where('codigo', $codigo)
                ->value('nombre');
        }

        return $this->cacheNombresLocales[$codigo] ?: $nombreOdoo;
    }
}