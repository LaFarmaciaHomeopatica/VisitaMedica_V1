<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('etiqueta_evento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained('eventos')->onDelete('cascade');
            $table->foreignId('etiqueta_id')->constrained('etiquetas')->onDelete('cascade');
            $table->timestamps();

            // Evita duplicar la misma etiqueta en el mismo evento
            $table->unique(['evento_id', 'etiqueta_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etiqueta_evento');
    }
};