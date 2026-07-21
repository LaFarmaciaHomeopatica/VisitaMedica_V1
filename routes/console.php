<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Cierra el mes anterior: calcula la categoría de cada médico (comprado +
// formulado en Odoo) y guarda el snapshot histórico para poder ver tendencia.
Schedule::command('medicos:calcular-categorias')
    ->monthlyOn(1, '03:00')
    ->withoutOverlapping();
