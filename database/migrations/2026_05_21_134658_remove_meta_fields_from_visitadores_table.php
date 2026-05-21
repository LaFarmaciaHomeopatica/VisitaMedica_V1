<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('visitadores', function (Blueprint $table) {
            // Eliminamos los campos que no necesitas
            $table->dropColumn(['meta_visitas_mensual', 'meta_ventas_mensual']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitadores', function (Blueprint $table) {
            // Por si necesitas revertir la migración, definimos cómo recrearlos.
            // Asegúrate de cambiar 'integer' por el tipo de dato original que tenían (float, decimal, etc.)
            $table->integer('meta_visitas_mensual')->nullable();
            $table->integer('meta_ventas_mensual')->nullable();
        });
    }
};