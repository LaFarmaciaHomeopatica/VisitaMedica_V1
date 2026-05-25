<?php
header('Content-Type: text/plain; charset=utf-8');

$log = __DIR__ . '/../storage/logs/laravel.log';

// Limpiar log antiguo
file_put_contents($log, '');
echo "Log limpiado. Ahora:\n\n";
echo "1. Ve a la app y repite la acción que da error (DELETE)\n";
echo "2. Vuelve a abrir esta URL\n";
echo "   https://appv.bibliotecalfh.com/check.php?ver=1\n";

// Segunda visita: mostrar log nuevo
if (isset($_GET['ver'])) {
    $content = file_get_contents($log);
    echo $content ?: "Log aún vacío — el error no es de Laravel (posible bloqueo de Apache/WAF).\n";
    echo "\n\n--- .htaccess actual ---\n";
    echo file_get_contents(__DIR__ . '/.htaccess');
}
