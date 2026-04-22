<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\visitador\MedicoController;
use App\Http\Controllers\visitador\VisitadorController;
use App\Http\Controllers\visitador\VisitaController;
use App\Http\Controllers\administrador\DvisitadoresController;
use App\Http\Controllers\administrador\UsuarioController;
use App\Http\Controllers\administrador\Medico2Controller;
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
            return Inertia::render('ADMINISTRADOR/PanelAdmin'); 
        })->name('PanelAdmin');

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
        
        // Buscador de ID
        Route::get('/usuarios/buscar/{id}', [DvisitadoresController::class, 'buscarUsuario'])->name('usuarios.buscar');

        Route::get('/medicos/exportar', [Medico2Controller::class, 'exportar'])->name('Gmedicos.exportar');
Route::post('/medicos/importar', [Medico2Controller::class, 'importar'])->name('Gmedicos.importar');



Route::post('/medicos/vincular-visitador', [Medico2Controller::class, 'vincularVisitador'])
    ->name('medicos.vincular-visitador');

    Route::post('/medicos/eliminar-masivo', [Medico2Controller::class, 'eliminarMasivo'])
    ->name('medicos.eliminar-masivo');
    });

    /*
    |--- GRUPO VISITADOR (id_rol 2) ---
    */
    Route::middleware(['role:2'])->group(function () {
        Route::get('/panel', function () {
            return Inertia::render('VISITADOR/panel');
        })->name('panel');

        // Perfil Visitador
        Route::get('/visitador', [VisitadorController::class, 'index'])->name('visitador');

        // Médicos
        Route::get('/ListadoMedicos', [MedicoController::class, 'index'])->name('medicos');
        Route::get('/MedicoDetalle/{id}', [MedicoController::class, 'show'])->name('medicos.show');

        // Módulo de Visitas
        Route::get('/visitas', [VisitaController::class, 'index'])->name('visitas.index');
        Route::post('/visitas', [VisitaController::class, 'store'])->name('visitas.store');
        Route::post('/visitas/{id}/efectiva', [VisitaController::class, 'marcarEfectiva'])->name('visitas.efectiva');
        Route::post('/visitas/{id}/reprogramar', [VisitaController::class, 'reprogramar'])->name('visitas.reprogramar');
        Route::post('/visitas/{id}/cancelar', [VisitaController::class, 'cancelar'])->name('visitas.cancelar');

        // Otros módulos del Visitador
        Route::get('/GestionVisita', function () {
            return Inertia::render('VISITADOR/GestionVisita');
        })->name('gestion.visita');

        Route::get('/ProductoCatalogo', function () {
            return Inertia::render('VISITADOR/ProductoCatalogo');
        })->name('productos');

        Route::get('/CalendarioVisitas', function () {
            return Inertia::render('VISITADOR/CalendarioVisitas');
        })->name('calendario');
    });

    /*
    |--- RUTAS COMUNES (Cualquier usuario logueado) ---
    */
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});