<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\visitador\MedicoController;
use App\Http\Controllers\visitador\VisitadorController;
use App\Http\Controllers\visitador\VisitaController;
use App\Http\Controllers\administrador\GinicioController;
use App\Http\Controllers\administrador\DvisitadoresController;
use App\Http\Controllers\administrador\UsuarioController;
use App\Http\Controllers\administrador\Medico2Controller;
use App\Http\Controllers\administrador\VisitasController;
use App\Http\Controllers\administrador\ProductosController;
use App\Http\Controllers\administrador\MedicoTemporalController;
use App\Http\Controllers\administrador\MetasController;
use App\Http\Controllers\administrador\ListasPreciosController;
use App\Http\Controllers\administrador\ZonasController;
use App\Http\Controllers\administrador\CategoriasController;
use App\Http\Controllers\administrador\CarteraController;
use App\Http\Controllers\administrador\ProveedoresController;
use App\Http\Controllers\visitador\TopMedicosController;
use App\Http\Controllers\visitador\AlertaController;
use App\Http\Controllers\api_odoo\OdooController;
use App\Http\Controllers\api_odoo\OdooSyncController;
use App\Http\Service\OdooServices;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
*/
Route::get('/', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'store'])->name('login.attempt');
Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS (Requieren Login)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    //|--- GRUPO ADMINISTRADOR (id_rol 1)

    Route::middleware(['role:1'])->group(function () {
        Route::get('/PanelAdmin', [GinicioController::class, 'index']);
        Route::get('/Ginicio',   [GinicioController::class, 'index'])->name('Ginicio');
        Route::post('/Ginicio/actualizar', [GinicioController::class, 'actualizarGinicio'])->name('Ginicio.actualizar');

        Route::get('/Gcartera', [CarteraController::class, 'index'])->name('Gcartera.index');
        Route::post('/Gcartera/actualizar', [CarteraController::class, 'actualizar'])->name('Gcartera.actualizar');
        Route::get('/Gcartera/documento/{documento}', [CarteraController::class, 'detalle'])->name('Gcartera.detalle');

        Route::get('/Gproveedores', [ProveedoresController::class, 'index'])->name('Gproveedores.index');
        Route::post('/Gproveedores/actualizar', [ProveedoresController::class, 'actualizar'])->name('Gproveedores.actualizar');
        Route::get('/Gproveedores/documento/{documento}', [ProveedoresController::class, 'detalle'])->name('Gproveedores.detalle');

        Route::get('/Gmetas', [MetasController::class, 'index'])->name('Gmetas.index');
        Route::post('/Gmetas/upsert', [MetasController::class, 'upsert'])->name('Gmetas.upsert');
        Route::post('/Gmetas/masivo', [MetasController::class, 'masivo'])->name('Gmetas.masivo');
        Route::delete('/Gmetas/{id}', [MetasController::class, 'destroy'])->name('Gmetas.destroy');


        Route::get('/Ginicio/odoo-resumen', [GinicioController::class, 'odooResumen'])->name('Ginicio.odooResumen');

        // Configuración de listas de precios (Compra / Formulación / etc.)
        Route::get('/Gtarifas', [ListasPreciosController::class, 'index'])->name('Gtarifas.index');
        Route::post('/Gtarifas', [ListasPreciosController::class, 'store'])->name('Gtarifas.store');
        Route::put('/Gtarifas/{listaPrecio}', [ListasPreciosController::class, 'update'])->name('Gtarifas.update');
        Route::delete('/Gtarifas/{listaPrecio}', [ListasPreciosController::class, 'destroy'])->name('Gtarifas.destroy');
        Route::post('/Gtarifas/sincronizar', [ListasPreciosController::class, 'sincronizar'])->name('Gtarifas.sincronizar');
        Route::post('/Gtarifas/odoo-config', [ListasPreciosController::class, 'odooConfigSave'])->name('Gtarifas.odooConfigSave');

        // Zonas de visita (pestaña "Zonas" en Configuración)
        Route::post('/Gzonas', [ZonasController::class, 'store'])->name('Gzonas.store');
        Route::put('/Gzonas/{zona}', [ZonasController::class, 'update'])->name('Gzonas.update');
        Route::delete('/Gzonas/{zona}', [ZonasController::class, 'destroy'])->name('Gzonas.destroy');

        // Categorías de médicos por desempeño mensual (pestaña "Categorías" en Configuración)
        Route::post('/Gcategorias', [CategoriasController::class, 'store'])->name('Gcategorias.store');
        Route::put('/Gcategorias/{categoria}', [CategoriasController::class, 'update'])->name('Gcategorias.update');
        Route::delete('/Gcategorias/{categoria}', [CategoriasController::class, 'destroy'])->name('Gcategorias.destroy');

        // El listado de usuarios ahora vive en Configuración (pestaña "Usuarios").
        Route::get('/Gusuarios', fn() => redirect('/Gtarifas?tab=usuarios'))->name('Gusuarios.index');
        Route::post('/Gusuarios', [UsuarioController::class, 'store'])->name('Gusuarios.store');
        Route::put('/Gusuarios/{id}', [UsuarioController::class, 'update'])->name('Gusuarios.update');
        Route::delete('/Gusuarios/{id}', [UsuarioController::class, 'destroy'])->name('Gusuarios.destroy');

        // CRUD de Visitadores unificado
        Route::get('/Gvisitadores', [DvisitadoresController::class, 'index'])->name('Gvisitadores.index');
        Route::get('/Gvisitadores/{id}/detalle', [DvisitadoresController::class, 'show'])->name('Gvisitadores.show');
        Route::post('/Gvisitadores', [DvisitadoresController::class, 'store'])->name('Gvisitadores.store');
        Route::put('/Gvisitadores/{visitador}', [DvisitadoresController::class, 'update'])->name('Gvisitadores.update');
        Route::patch('/Gvisitadores/{id}/toggle-estado', [DvisitadoresController::class, 'toggleEstado'])->name('Gvisitadores.toggleEstado');

        // CRUD de Médicos (Aquí se ejecutan los datos del Medico2Controller)
        Route::get('/Gmedicos', [Medico2Controller::class, 'index'])->name('Gmedicos.index');
        Route::get('/Gmedicos/{id}/detalle', [Medico2Controller::class, 'show'])->name('Gmedicos.show');
        Route::post('/Gmedicos', [Medico2Controller::class, 'store'])->name('Gmedicos.store');
        Route::put('/Gmedicos/{medico}', [Medico2Controller::class, 'update'])->name('Gmedicos.update');
        Route::delete('/Gmedicos/{medico}', [Medico2Controller::class, 'destroy'])->name('Gmedicos.destroy');


        Route::get('/Gvisitas', [VisitasController::class, 'index'])->name('Gvisitas.index');
        Route::post('/Gvisitas', [VisitasController::class, 'store'])->name('Gvisitas.store');
        // Cambiamos {visita} por {id}
        Route::put('/Gvisitas/{id}', [VisitasController::class, 'update'])->name('Gvisitas.update');
        Route::delete('/Gvisitas/{id}', [VisitasController::class, 'destroy'])->name('Gvisitas.destroy');
        Route::delete('/Gvisitas', [VisitasController::class, 'destroyBulk'])->name('Gvisitas.destroyBulk');
        // Buscador de ID
        Route::get('/usuarios/buscar/{id}', [DvisitadoresController::class, 'buscarUsuario'])->name('usuarios.buscar');

        Route::get('/medicos/exportar', [Medico2Controller::class, 'exportar'])->name('Gmedicos.exportar');
        Route::post('/medicos/importar', [Medico2Controller::class, 'importar'])->name('Gmedicos.importar');
        Route::post('/medicos/vincular-visitador', [Medico2Controller::class, 'vincularVisitador'])->name('medicos.vincular-visitador');
        Route::post('/medicos/eliminar-masivo', [Medico2Controller::class, 'eliminarMasivo'])->name('medicos.eliminar-masivo');
    
            // Rutas para Productos
        Route::get('/Gproductos', [ProductosController::class, 'index'])->name('Gproductos.index');
        Route::post('/Gproductos', [ProductosController::class, 'store'])->name('Gproductos.store');
        Route::put('/Gproductos/{producto}', [ProductosController::class, 'update'])->name('Gproductos.update');
        Route::post('/Gproductos/destroy/{producto?}', [ProductosController::class, 'destroy'])
    ->name('Gproductos.destroy');
        Route::get('/productos/buscar', [ProductosController::class, 'index'])->name('admin.productos');


        // Ruta para descargar el Excel (Exportar)
    Route::get('productos/exportar', [ProductosController::class, 'export'])->name('productos.export');

    // Ruta para procesar el archivo subido (Importar)
    Route::post('productos/importar', [ProductosController::class, 'import'])->name('productos.import');
   


    Route::get('/GmedicosTemporales', [MedicoTemporalController::class, 'index'])->name('GmedicosTemporales.index');
    Route::get('/GmedicosTemporales/{id}/estadisticas', [MedicoTemporalController::class, 'estadisticas'])->name('GmedicosTemporales.estadisticas');
    Route::post('/GmedicosTemporales/{id}/promover', [MedicoTemporalController::class, 'promover'])->name('GmedicosTemporales.promover');
    Route::delete('/GmedicosTemporales/{id}', [MedicoTemporalController::class, 'destroy'])->name('GmedicosTemporales.destroy');
    Route::delete('/GmedicosTemporales', [MedicoTemporalController::class, 'destroyMultiple'])->name('GmedicosTemporales.destroyMultiple');

    Route::get('/medicos/documento/{documento}/detalle', [Medico2Controller::class, 'showPorDocumento'])
    ->name('Gmedicos.showPorDocumento');

    // Cambia el ->name(...) para que coincida con tu estructura actual
Route::post('/medicos-temporales/importar', [MedicoTemporalController::class, 'importar'])
    ->name('GmedicosTemporales.importar');

Route::get('administrador/medicos/{id}/alertas-productos', [
    Medico2Controller::class, 
    'alertasProductos'
])->name('Gmedicos.alertas');

Route::get('/medicos-temporales/exportar', [MedicoTemporalController::class, 'exportar'])
    ->name('GmedicosTemporales.exportar');


    Route::get('/GmedicosTemporales/plantilla', [MedicoTemporalController::class, 'descargarPlantilla'])
    ->name('GmedicosTemporales.plantilla');

    Route::get('/medicos/documento/{documento}/alertas', [Medico2Controller::class, 'alertasPorDocumento'])
    ->name('Gmedicos.alertasPorDocumento');

    Route::post('/medicos/documento/{documento}/sincronizar-categoria', [Medico2Controller::class, 'sincronizarCategoriaPorDocumento'])
    ->name('Gmedicos.sincronizarCategoria');
  
Route::get('/Gmetas/odoo-stats/{visitador}', [MetasController::class, 'odooStats'])
    ->name('Gmetas.odooStats');


    Route::get('/Gvisitadores/{visitador}/odoo-stats', [DvisitadoresController::class, 'odooStats'])
    ->name('Gvisitadores.odooStats');

  
 });

Route::middleware(['auth', 'verified'])->prefix('odoo')->name('odoo.')->group(function () {
 
    /*
    |------------------------------------------------------------------
    | Vista principal: Consulta de Clientes en Odoo
    |------------------------------------------------------------------
    | GET /odoo/medicos
    | Buscador por número de documento — al enviar el formulario navega
    | directo al panel gerencial del cliente (Gmedicos.showPorDocumento),
    | que funciona para cualquier documento esté o no registrado.
    |------------------------------------------------------------------
    */
    Route::get('/medicos', [OdooController::class, 'index'])
        ->name('medicos');

    // Sugerencias de autocompletado (nombre o documento) para el buscador de arriba.
    Route::get('/medicos/buscar', [OdooController::class, 'buscarSugerencias'])
        ->name('medicos.buscar');

    // Sincronización — carga de tarifas/pricelists de Odoo hacia la app
    Route::get('/odoo/sync',          [OdooSyncController::class, 'index']);
    Route::post('/odoo/sync/preview', [OdooSyncController::class, 'previsualizar']);
    Route::post('/odoo/sync/import',  [OdooSyncController::class, 'importar']);



    

});





    /*
    |----------------------------------------------------------------------------------------
    |--- GRUPO VISITADOR (id_rol 2) ---
    |----------------------------------------------------------------------------------------*/
        Route::middleware(['role:2'])->group(function () {
            // El Panel pasa por el controlador y carga los datos reales
            Route::get('/panel', [VisitadorController::class, 'index'])->name('panel');

            // Ranking de médicos (TopMedicos.jsx)
            Route::get('/visitador/top-medicos', [TopMedicosController::class, 'index'])->name('visitador.top-medicos');
            Route::get('/visitador/top-medicos/detalle/{documento}', [TopMedicosController::class, 'detalleTop'])->name('visitador.top-medicos.detalle');
            // Alias sin "/detalle/": mismo controlador, sin nombre propio para no colisionar con el anterior.
            Route::get('/visitador/top-medicos/{documento}', [TopMedicosController::class, 'detalleTop']);
            Route::post('/visitador/refrescar-todo', [TopMedicosController::class, 'actualizarTodo'])->name('visitador.refrescar-todo');
            Route::post('/visitador/top-medicos/{documento}/refrescar', [TopMedicosController::class, 'refrescarMedico'])->name('visitador.top-medicos.refrescarMedico');

            Route::get('/visitador/alertas', [AlertaController::class, 'index'])->name('visitador.alertas');
            Route::get('/visitador/alertas/{documento}', [AlertaController::class, 'detalle'])->name('visitador.alertas.detalle');

            // Médicos
            Route::get('/ListadoMedicos', [MedicoController::class, 'index'])->name('medicos');
            Route::get('/DetallesTop/{id}', [MedicoController::class, 'show'])->name('medicos.show');

            // Módulo de Visitas
            Route::get('/MisVisitas', [VisitaController::class, 'index'])->name('MisVisitas.index');
            Route::post('/MisVisitas', [VisitaController::class, 'store'])->name('visitas.store');
            Route::post('/MisVisitas/{id}/efectiva', [VisitaController::class, 'marcarEfectiva'])->name('visitas.marcarEfectiva');
            Route::post('/MisVisitas/{id}/reprogramar', [VisitaController::class, 'reprogramar'])->name('MisVisitas.reprogramar');

            Route::get('/visitas', [VisitaController::class, 'index'])->name('visitas.index');

                Route::get('/panel/odoo-stats', [VisitadorController::class, 'odooStats'])->name('panel.odoo-stats');

        });

    /*
    |---------------------------------------------------------------------------------
    |--- RUTAS COMUNES (Cualquier usuario logueado) ---
    |---------------------------------------------------------------------------------
    */
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
