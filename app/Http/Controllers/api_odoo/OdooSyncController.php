<?php

namespace App\Http\Controllers\api_odoo;

use App\Http\Controllers\Controller;

/**
 * Sincronización de tarifas/pricelists de Odoo hacia la app (rutas
 * /odoo/sync, /odoo/sync/preview, /odoo/sync/import en routes/web.php).
 *
 * La consulta de clientes/médicos por documento (contacto, transacciones,
 * productos, formulación) vive ahora en App\Services\OdooService y se
 * consume desde Medico2Controller (panel gerencial en MedicoDetalle.jsx).
 */
class OdooSyncController extends Controller
{
}
