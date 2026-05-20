<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\visitador\MedicoController;
use App\Http\Controllers\visitador\VisitadorController;
use App\Http\Controllers\visitador\VisitaController;
use App\Http\Controllers\administrador\DvisitadoresController;
use App\Http\Controllers\administrador\UsuarioController;
use App\Http\Controllers\administrador\Medico2Controller;
use App\Http\Controllers\administrador\VisitasController;
use App\Http\Controllers\administrador\ProductosController;
use App\Http\Controllers\administrador\TransaccionesController;
use App\Http\Controllers\administrador\MedicoTemporalController;
use App\Http\Controllers\administrador\MetricasController;
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
        Route::get('/PanelAdmin', function () {
            return Inertia::render('ADMINISTRADOR/Ginicio'); 
        })->name('Ginicio');

        Route::get('/Ginicio', function () {
            return Inertia::render('ADMINISTRADOR/Ginicio'); 
        })->name('Ginicio');

Route::get('/Metricas', [MetricasController::class, 'index'])->name('Metricas.index');




        Route::get('/Gusuarios', [UsuarioController::class, 'index'])->name('Gusuarios.index');
        Route::post('/Gusuarios', [UsuarioController::class, 'store'])->name('Gusuarios.store');
        Route::put('/Gusuarios/{id}', [UsuarioController::class, 'update'])->name('Gusuarios.update');
        Route::delete('/Gusuarios/{id}', [UsuarioController::class, 'destroy'])->name('Gusuarios.destroy');

        // CRUD de Visitadores unificado
        Route::get('/Gvisitadores', [DvisitadoresController::class, 'index'])->name('Gvisitadores.index');
        Route::post('/Gvisitadores', [DvisitadoresController::class, 'store'])->name('Gvisitadores.store');
        Route::put('/Gvisitadores/{visitador}', [DvisitadoresController::class, 'update'])->name('Gvisitadores.update');
        Route::delete('/Gvisitadores/{visitador}', [DvisitadoresController::class, 'destroy'])->name('Gvisitadores.destroy');

        // CRUD de Médicos (Aquí se ejecutan los datos del Medico2Controller)
        Route::get('/Gmedicos', [Medico2Controller::class, 'index'])->name('Gmedicos.index');
        Route::post('/Gmedicos', [Medico2Controller::class, 'store'])->name('Gmedicos.store');
        Route::put('/Gmedicos/{medico}', [Medico2Controller::class, 'update'])->name('Gmedicos.update');
        Route::delete('/Gmedicos/{medico}', [Medico2Controller::class, 'destroy'])->name('Gmedicos.destroy');


        Route::get('/Gvisitas', [VisitasController::class, 'index'])->name('Gvisitas.index');
        Route::post('/Gvisitas', [VisitasController::class, 'store'])->name('Gvisitas.store');
        // Cambiamos {visita} por {id}
        Route::put('/Gvisitas/{id}', [VisitasController::class, 'update'])->name('Gvisitas.update');
        Route::delete('/Gvisitas/{id}', [VisitasController::class, 'destroy'])->name('Gvisitas.destroy');
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
    });



    Route::get('/Gtransacciones', [TransaccionesController::class, 'index'])->name('Gtransacciones.index');
    Route::post('/Gtransacciones', [TransaccionesController::class, 'store'])->name('Gtransacciones.store');
    Route::put('/Gtransacciones/{transaccion}', [TransaccionesController::class, 'update'])->name('Gtransacciones.update');
    Route::delete('/Gtransacciones/{transaccion}', [TransaccionesController::class, 'destroy'])->name('Gtransacciones.destroy');

    Route::delete('/Gtransacciones-multiple', [TransaccionesController::class, 'destroyMultiple'])->name('Gtransacciones.destroy_multiple');


    Route::get('/GmedicosTemporales', [MedicoTemporalController::class, 'index'])->name('GmedicosTemporales.index');
    Route::post('/GmedicosTemporales/{id}/promover', [MedicoTemporalController::class, 'promover'])->name('GmedicosTemporales.promover');

   // Ejemplo de cómo deberían estar tus rutas
Route::get('/Gtransacciones/exportar', [TransaccionesController::class, 'exportar'])->name('Gtransacciones.exportar');
Route::post('/Gtransacciones/importar', [TransaccionesController::class, 'importar'])->name('Gtransacciones.importar');





    /*
    |----------------------------------------------------------------------------------------
    |--- GRUPO VISITADOR (id_rol 2) ---
    |----------------------------------------------------------------------------------------*/
        Route::middleware(['role:2'])->group(function () {
       // 🚀 AHORA SÍ: El Panel pasa por el controlador y cargará los datos reales
    Route::get('/panel', [VisitadorController::class, 'index'])->name('panel');

    
        // Médicos
        Route::get('/ListadoMedicos', [MedicoController::class, 'index'])->name('medicos');
        Route::get('/MedicoDetalle/{id}', [MedicoController::class, 'show'])->name('medicos.show');

        // Módulo de Visitas
        Route::get('/MisVisitas', [VisitaController::class, 'index'])->name('MisVisitas.index');
        Route::post('/MisVisitas', [VisitaController::class, 'store'])->name('visitas.store');
        Route::post('/MisVisitas/{id}/efectiva', [VisitaController::class, 'marcarEfectiva'])->name('MisVisitas.  efectiva');
        Route::post('/MisVisitas/{id}/reprogramar', [VisitaController::class, 'reprogramar'])->name('MisVisitas.reprogramar');
        Route::post('/MisVisitas/{id}/cancelar', [VisitaController::class, 'cancelar'])->name('MisVisitas.cancelar');

        Route::get('/perfil-visitador', [VisitaController::class, 'perfil'])->name('visitador.perfil');

        Route::get('/visitas', [VisitaController::class, 'index'])->name('visitas.index');

       
        Route::post('/MisVisitas/{id}/efectiva', [VisitaController::class, 'marcarEfectiva'])->name('visitas.marcarEfectiva');
        Route::post('/MisVisitas', [VisitaController::class, 'store'])->name('visitas.store');


       
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