<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\visitador\MedicoController;
use App\Http\Controllers\visitador\VisitadorController;
use App\Http\Controllers\visitador\VisitaController; // 👈 IMPORTANTE
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
| RUTAS PROTEGIDAS
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    // Panel
    Route::get('/panel', function () {
        return Inertia::render('VISITADOR/panel');
    })->name('panel');

    // Perfil Visitador
    Route::get('/visitador', [VisitadorController::class, 'index'])->name('visitador');

    // Médicos
    Route::get('/ListadoMedicos', [MedicoController::class, 'index'])->name('medicos');
    Route::get('/MedicoDetalle/{id}', [MedicoController::class, 'show'])->name('medicos.show');

    // 🔥 VISITAS (NUEVO)
    Route::get('/visitas', [VisitaController::class, 'index'])->name('visitas.index');
    Route::post('/visitas', [VisitaController::class, 'store'])->name('visitas.store');
    Route::post('/visitas/{id}/efectiva', [VisitaController::class, 'marcarEfectiva'])->name('visitas.efectiva');
    Route::post('/visitas/{id}/reprogramar', [VisitaController::class, 'reprogramar'])->name('visitas.reprogramar');
    Route::post('/visitas/{id}/cancelar', [VisitaController::class, 'cancelar'])->name('visitas.cancelar');

    // Otros módulos
    Route::get('/GestionVisita', function () {
        return Inertia::render('VISITADOR/GestionVisita');
    })->name('gestion.visita');

    Route::get('/ProductoCatalogo', function () {
        return Inertia::render('VISITADOR/ProductoCatalogo');
    })->name('productos');

    Route::get('/CalendarioVisitas', function () {
        return Inertia::render('VISITADOR/CalendarioVisitas');
    })->name('calendario');

    // Perfil usuario
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/dashboard', function () {
    return redirect()->route('panel');
})->middleware(['auth']);