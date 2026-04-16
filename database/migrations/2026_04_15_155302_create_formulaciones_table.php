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
        Schema::create('formulaciones', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('medico_id')->index('fk_formula_medico');
            $table->integer('producto_id')->index('fk_formula_producto');
            $table->integer('cantidad')->default(1);
            $table->decimal('monto_total', 12);
            $table->date('fecha_registro');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formulaciones');
    }
};
