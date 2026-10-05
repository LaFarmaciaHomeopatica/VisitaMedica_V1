<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos', function (Blueprint $table) {
            $table->id();
            $table->integer('visitador_id'); // igual que visitadores.id (int con signo)
            $table->string('nombre_evento');
            $table->text('comentario')->nullable();
            $table->string('ubicacion')->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->dateTime('fecha_programada')->nullable();
            $table->dateTime('fecha_realizada')->nullable();
            $table->dateTime('fecha_fin_real')->nullable();
            $table->string('estado')->default('programado');

            $table->index('visitador_id');
            $table->foreign('visitador_id')->references('id')->on('visitadores');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos');
    }
};