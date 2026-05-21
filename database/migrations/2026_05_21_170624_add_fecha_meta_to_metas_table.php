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
        Schema::table('metas', function (Blueprint $blueprint) {
            // Se agrega el campo tipo fecha, permitiendo nulos por si hay registros viejos
            $blueprint->date('fecha_meta')->nullable()->after('meta_visitas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('metas', function (Blueprint $blueprint) {
            $blueprint->dropColumn('fecha_meta');
        });
    }
};