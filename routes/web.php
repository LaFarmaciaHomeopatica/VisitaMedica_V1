<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return Inertia::render('inicio/Login_1'); 
});

Route::get('/panel', function () {
    return Inertia::render('inicio/panel');
})->name('panel');

Route::get('/ListadoMedicos', function () {
    return Inertia::render('inicio/ListadoMedicos'); 
});

Route::get('/visitador', function () {
    return Inertia::render('inicio/visitador'); 
});
Route::get('/MedicoDetalle', function () {
    return Inertia::render('inicio/MedicoDetalle'); 
});

Route::get('/GestionVisita', function () {
    return Inertia::render('inicio/GestionVisita'); 
});

Route::get('/ProductoCatalogo', function () {
    return Inertia::render('inicio/ProductoCatalogo'); 
});



Route::get('/CalendarioVisitas', function () {
    return Inertia::render('inicio/CalendarioVisitas'); 
});














//esto venia por defecto no lo elimino por que se bugea._.

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
