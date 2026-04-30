<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
   public function up(): void
{
    // 1. Asegúrate de borrar la tabla antes de reintentar
    Schema::dropIfExists('transacciones');

    Schema::create('transacciones', function (Blueprint $table) {
        // Usamos increments() para que el ID de esta tabla sea INT y no BIGINT
        $table->increments('id'); 

        // Usamos unsignedInteger para que coincida exactamente con medicos y productos
        $table->integer('medico_id');
        $table->integer('producto_id');

        $table->integer('unidades_compradas')->default(0);
        $table->integer('unidades_formuladas')->default(0);
        $table->decimal('valor_comprado', 10, 2)->default(0);
        $table->decimal('valor_formulado', 10, 2)->default(0);
        $table->integer('semana');

        $table->timestamps();

        // Definición manual de llaves foráneas
        $table->foreign('medico_id')
              ->references('id')
              ->on('medicos')
              ->onDelete('cascade');

        $table->foreign('producto_id')
              ->references('id')
              ->on('productos')
              ->onDelete('cascade');
    });
}
};