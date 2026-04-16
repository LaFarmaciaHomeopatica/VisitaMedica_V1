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
        Schema::table('formulaciones', function (Blueprint $table) {
            $table->foreign(['medico_id'], 'fk_formula_medico')->references(['id'])->on('medicos')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['producto_id'], 'fk_formula_producto')->references(['id'])->on('productos')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('formulaciones', function (Blueprint $table) {
            $table->dropForeign('fk_formula_medico');
            $table->dropForeign('fk_formula_producto');
        });
    }
};
