<?php
// Script de reparación de directorios – ejecutar UNA VEZ en producción
// Luego eliminar este archivo del servidor
header('Content-Type: text/plain; charset=utf-8');

$base = __DIR__ . '/..';

$dirs = [
    'storage/framework/cache/data',
    'storage/framework/cache/laravel-excel',
    'storage/framework/sessions',
    'storage/framework/testing',
    'storage/framework/views',
    'storage/app/public',
    'storage/app/private',
    'storage/logs',
    'bootstrap/cache',
];

foreach ($dirs as $dir) {
    $path = "$base/$dir";
    if (!is_dir($path)) {
        mkdir($path, 0775, true);
        echo "✓ Creado: $dir\n";
    } else {
        chmod($path, 0775);
        echo "✓ OK (ya existía): $dir\n";
    }
}

// Limpiar cachés de bootstrap
foreach (glob("$base/bootstrap/cache/*.php") as $f) {
    unlink($f);
    echo "✓ Cache eliminado: " . basename($f) . "\n";
}

echo "\nListo. Ahora ejecuta: php artisan cache:clear\n";
echo "Luego elimina este archivo: public/mkdirs.php\n";
