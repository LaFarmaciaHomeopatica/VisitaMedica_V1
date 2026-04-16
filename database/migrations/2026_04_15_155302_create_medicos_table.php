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
        Schema::create('medicos', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('usuario_id')->nullable()->unique('usuario_id');
            $table->string('nombre_completo', 150);
            $table->bigInteger('documento')->unique('documento');
            $table->string('especialidad', 100);
            $table->string('geolocalizacion', 300);
            $table->text('direccion_detalles')->nullable();
            $table->string('telefono_contacto', 50)->nullable();
            $table->string('horario_atencion', 100)->nullable();
            $table->integer('visitador_id')->nullable()->index('fk_visitador_asignado');
            $table->date('fecha_inicio_relacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicos');
    }
};
