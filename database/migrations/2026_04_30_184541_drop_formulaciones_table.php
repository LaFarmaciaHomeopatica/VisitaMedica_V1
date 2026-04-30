<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Desactivar restricciones de llaves foráneas (opcional pero seguro)
        Schema::disableForeignKeyConstraints();

        // 2. Eliminar la tabla
        Schema::dropIfExists('formulaciones');

        // 3. Reactivar restricciones
        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // Aquí podrías definir la creación de la tabla de nuevo 
        // por si necesitas hacer un 'rollback', pero si estás seguro 
        // de eliminarla, puedes dejarlo vacío o con la estructura previa.
    }
};