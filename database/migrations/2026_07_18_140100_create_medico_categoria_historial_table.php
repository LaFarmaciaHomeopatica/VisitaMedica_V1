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
        Schema::create('medico_categoria_historial', function (Blueprint $table) {
            $table->id();
            // medicos.id es INT firmado (no BIGINT ni UNSIGNED), así que no se
            // puede usar foreignId() aquí — el tipo debe calzar exacto para la FK.
            $table->integer('medico_id');
            $table->foreign('medico_id')->references('id')->on('medicos')->cascadeOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categoria')->nullOnDelete();
            $table->date('mes'); // Primer día del mes que representa esta foto (ej. 2026-07-01)
            $table->decimal('valor_comprado', 12, 2)->default(0);
            $table->decimal('valor_formulado', 12, 2)->default(0);
            $table->decimal('valor_total', 12, 2)->default(0);
            $table->timestamp('created_at')->nullable()->useCurrent();

            $table->unique(['medico_id', 'mes']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medico_categoria_historial');
    }
};
