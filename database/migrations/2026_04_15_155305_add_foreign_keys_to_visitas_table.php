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
        Schema::table('visitas', function (Blueprint $table) {
            $table->foreign(['medico_id'], 'fk_visita_medico')->references(['id'])->on('medicos')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['visitador_id'], 'fk_visita_visitador')->references(['id'])->on('visitadores')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitas', function (Blueprint $table) {
            $table->dropForeign('fk_visita_medico');
            $table->dropForeign('fk_visita_visitador');
        });
    }
};
