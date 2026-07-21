<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categoria', function (Blueprint $table) {
            // Umbral mínimo mensual (valor comprado + valor formulado) para calificar
            // en esta categoría. Se evalúa de mayor a menor: un médico queda en la
            // categoría de mayor valor_minimo que no supere su total del mes.
            $table->decimal('valor_minimo', 12, 2)->default(0)->after('descripcion');
        });

        // Valores de partida razonables para las 4 categorías ya existentes
        // (A/B/C/X); el admin los puede ajustar desde Configuración > Categorías.
        DB::table('categoria')->where('nombre', 'A')->update(['valor_minimo' => 5000000]);
        DB::table('categoria')->where('nombre', 'B')->update(['valor_minimo' => 2000000]);
        DB::table('categoria')->where('nombre', 'C')->update(['valor_minimo' => 500000]);
        DB::table('categoria')->where('nombre', 'X')->update(['valor_minimo' => 0]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categoria', function (Blueprint $table) {
            $table->dropColumn('valor_minimo');
        });
    }
};
