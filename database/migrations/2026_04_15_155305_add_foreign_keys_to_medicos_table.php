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
        Schema::table('medicos', function (Blueprint $table) {
            $table->foreign(['usuario_id'], 'fk_medico_usuario')->references(['id'])->on('usuarios')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['visitador_id'], 'fk_visitador_asignado')->references(['id'])->on('visitadores')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicos', function (Blueprint $table) {
            $table->dropForeign('fk_medico_usuario');
            $table->dropForeign('fk_visitador_asignado');
        });
    }
};
