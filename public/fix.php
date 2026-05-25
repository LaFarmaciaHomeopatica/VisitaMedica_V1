<?php
header('Content-Type: text/plain; charset=utf-8');

$envPath = __DIR__ . '/../.env';
$env     = file_exists($envPath) ? file_get_contents($envPath) : '';

// Leer el APP_KEY actual
preg_match('/^APP_KEY=(.*)$/m', $env, $m);
$currentKey = trim($m[1] ?? '');

echo "APP_KEY actual: " . ($currentKey ?: '(vacío)') . "\n\n";

if ($currentKey && $currentKey !== '' && $currentKey !== 'SinDefinir') {
    echo "APP_KEY ya está definido. No se modificó el .env\n";
} else {
    // Generar una nueva clave segura
    $key = 'base64:' . base64_encode(random_bytes(32));

    if (preg_match('/^APP_KEY=.*$/m', $env)) {
        $env = preg_replace('/^APP_KEY=.*$/m', "APP_KEY=$key", $env);
    } else {
        $env .= "\nAPP_KEY=$key\n";
    }

    file_put_contents($envPath, $env);
    echo "✓ APP_KEY generado y guardado: $key\n";
}

// Limpiar cachés de bootstrap para que tome efecto
$cacheDir = __DIR__ . '/../bootstrap/cache';
foreach (glob("$cacheDir/*.php") as $f) {
    unlink($f);
}
echo "\n✓ Cachés limpiados.\n";
echo "\nRecarga https://appv.bibliotecalfh.com\n";
echo "Luego elimina fix.php y check.php del servidor.\n";
