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
        Schema::create('visitas', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('medico_id')->index('fk_visita_medico');
            $table->integer('visitador_id')->index('fk_visita_visitador');
            $table->dateTime('fecha_programada');
            $table->dateTime('fecha_realizada')->nullable();
            $table->enum('estado', ['sin programar', 'programada', 'efectiva', 'No contactado', 'reprogramada', 'cancelada'])->nullable()->default('sin programar');
            $table->text('comentarios')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitas');
    }
};
