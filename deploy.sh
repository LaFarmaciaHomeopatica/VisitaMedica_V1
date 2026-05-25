#!/bin/bash
# ================================================================
# Script de despliegue VisitaMedica – GoDaddy
# ================================================================

echo "==> Verificando versión de PHP..."
php -v | head -1
php -r "if(version_compare(PHP_VERSION,'8.2.0','<')){echo 'ERROR: PHP '.PHP_VERSION.' detectado. Laravel 11 requiere PHP 8.2+'.PHP_EOL;exit(1);}" || exit 1
echo "      PHP OK"

echo "==> [1/6] Copiando .env de producción..."
cp .env.production .env
echo ""
echo "  *** IMPORTANTE: edita .env con tus datos de base de datos ***"
echo "      nano .env"
echo ""
read -p "  Presiona ENTER cuando hayas guardado el .env..."

echo "==> [2/6] Instalando dependencias (sin devtools)..."
composer install --no-dev --optimize-autoloader --ignore-platform-reqs --no-interaction

echo "==> [3/6] Limpiando cachés previos..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo "==> [4/6] Ejecutando migraciones..."
php artisan migrate --force

echo "==> [5/6] Creando enlace de storage..."
php artisan storage:link

echo "==> [6/6] Ajustando permisos..."
find storage -type d -exec chmod 775 {} \;
find bootstrap/cache -type d -exec chmod 775 {} \;

echo ""
echo "==> Cacheando para producción..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "✓ Despliegue completado."
echo ""
echo "  Recuerda cambiar APP_DEBUG=false en .env cuando todo funcione."
