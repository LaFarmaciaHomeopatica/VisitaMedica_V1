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
    Schema::create('metas', function (Blueprint $table) {
        $table->id(); // Este es el ID de la tabla metas (puede ser bigint, no afecta)
        
        // Creamos la columna exactamente como INT (firmado) para que coincida con visitadores.id
        $table->integer('visitador_id');
        
        // Creamos la relación
        $table->foreign('visitador_id')
              ->references('id')
              ->on('visitadores')
              ->onDelete('cascade');
        
        $table->decimal('meta_dinero', 12, 2);
        $table->integer('meta_visitas');       
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metas');
    }
};