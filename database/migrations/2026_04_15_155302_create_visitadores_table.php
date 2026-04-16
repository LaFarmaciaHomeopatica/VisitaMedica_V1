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
        Schema::create('visitadores', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('usuario_id')->unique('usuario_id');
            $table->string('nombre_completo', 150);
            $table->string('documento', 50);
            $table->integer('zona_id')->nullable()->index('fk_visitador_zona');
            $table->integer('meta_visitas_mensual')->nullable()->default(0);
            $table->decimal('meta_ventas_mensual', 12)->nullable()->default(0);
            $table->enum('estado', ['Habilitado', 'Inhabilitado'])->nullable()->default('Habilitado');
            $table->timestamp('created_at')->nullable()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitadores');
    }
};
