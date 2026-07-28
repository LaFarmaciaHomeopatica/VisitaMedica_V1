<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        
        // 1. Excluimos la cookie del cifrado automático para que JS pueda leerla
        $middleware->encryptCookies(except: [
            'download_token',
        ]);

        // 2. Excluimos la ruta de exportación de la verificación CSRF (evita el error 419)
        $middleware->validateCsrfTokens(except: [
            'medicos/exportar',
            'Gmedicos/exportar', // Agregado por si tu ruta lleva la 'G' inicial según tu URL anterior
        ]);

        // Registro de Middlewares Globales / Web
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // REGISTRO DEL ALIAS PARA ROLES
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();