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
        Schema::create('odoo_snapshots', function (Blueprint $table) {
            $table->id();

            // Documento del médico, o 'grupal' cuando es el ranking del Top Médicos
            $table->string('documento');

            // Rango consultado: 'mes_actual', '3m', '6m', '1y', '2y', 'all'
            $table->string('periodo');

            // Mes de referencia sobre el que se calculó el período, formato 'YYYY-MM'
            $table->string('mes');

            // Resultado completo de Odoo ya procesado (lo que hoy arma odooDatosPesados)
            $table->json('payload');

            // Momento exacto en que se consultó Odoo (para mostrar "hace X días")
            $table->timestamp('actualizado_en');

            $table->timestamps();

            // Evita duplicados: cada combinación médico+periodo+mes es única
            $table->unique(['documento', 'periodo', 'mes'], 'odoo_snapshots_unique');

            // Acelera búsquedas por documento (ej: borrar todos los snapshots de un médico)
            $table->index('documento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('odoo_snapshots');
    }
};