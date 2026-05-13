<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitas', function (Blueprint $table) {
            // Agregamos los campos como nullable
            $table->string('muestras')->nullable()->after('id'); 
            $table->text('comentario_muestra')->nullable()->after('muestras');
        });
    }

    public function down(): void
    {
        Schema::table('visitas', function (Blueprint $table) {
            // Eliminamos los campos en caso de rollback
            $table->dropColumn(['muestras', 'comentario_muestra']);
        });
    }
};