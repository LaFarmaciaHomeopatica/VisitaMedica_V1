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
            $table->foreign(['usuario_id'], 'fk_visitador_usuario')->references(['id'])->on('usuarios')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['zona_id'], 'fk_visitador_zona')->references(['id'])->on('zonas')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitadores', function (Blueprint $table) {
            $table->dropForeign('fk_visitador_usuario');
            $table->dropForeign('fk_visitador_zona');
        });
    }
};
