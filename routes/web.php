<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\visitador\MedicoController; // <--- Importamos el nuevo controlador
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::get('/test', function () {
    return 'OK';
});

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
| RUTAS PROTEGIDAS (Solo usuarios autenticados)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    
    // Panel Principal
    Route::get('/panel', function () {
        return Inertia::render('inicio/panel');
    })->name('panel');

    // --- MÓDULO DE MÉDICOS ---
    // Esta ruta carga el listado completo
    Route::get('/ListadoMedicos', [MedicoController::class, 'index'])->name('medicos');
    
    // Esta ruta carga el detalle de un médico específico usando su ID
    Route::get('/MedicoDetalle/{id}', [MedicoController::class, 'show'])->name('medicos.show');

    // Otros Módulos
    Route::get('/visitador', function () { return Inertia::render('inicio/visitador'); })->name('visitador');
    Route::get('/GestionVisita', function () { return Inertia::render('inicio/GestionVisita'); })->name('gestion.visita');
    Route::get('/ProductoCatalogo', function () { return Inertia::render('inicio/ProductoCatalogo'); })->name('productos');
    Route::get('/CalendarioVisitas', function () { return Inertia::render('inicio/CalendarioVisitas'); })->name('calendario');

    // Perfil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/dashboard', function () {
    return redirect()->route('panel');
})->middleware(['auth']);