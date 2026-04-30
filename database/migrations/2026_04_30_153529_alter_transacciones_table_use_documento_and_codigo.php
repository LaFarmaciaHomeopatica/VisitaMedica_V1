<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transacciones', function (Blueprint $table) {
            // 1. Eliminamos las restricciones de llave foránea antiguas si existen
            // El nombre suele ser: tabla_columna_foreign
            $table->dropForeign(['medico_id']);
            $table->dropForeign(['producto_id']);

            // 2. Eliminamos las columnas de ID
            $table->dropColumn(['medico_id', 'producto_id']);

            // 3. Agregamos las nuevas columnas de negocio (Desacopladas)
            // Usamos string para documentos con letras o códigos con guiones
            $table->string('medico_documento', 20)->after('id');
            $table->string('producto_codigo', 50)->after('medico_documento');
            
            // Opcional: Agregar un índice para búsquedas rápidas, 
            // pero sin la rigidez de una llave foránea que impida borrar el origen.
            $table->index('medico_documento');
            $table->index('producto_codigo');
        });
    }

    public function down(): void
    {
        Schema::table('transacciones', function (Blueprint $table) {
            $table->dropColumn(['medico_documento', 'producto_codigo']);
            $table->integer('medico_id');
            $table->integer('producto_id');
        });
    }
};