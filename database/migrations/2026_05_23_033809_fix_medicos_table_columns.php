<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medicos', function (Blueprint $table) {
            $table->string('nombre', 100)->nullable()->after('usuario_id');
            $table->string('apellido', 100)->nullable()->after('nombre');
            $table->unsignedInteger('tipo_documento_id')->nullable()->after('documento');
        });

        // Migrar datos: nombre_completo → nombre + apellido
        DB::statement("UPDATE medicos SET nombre = SUBSTRING_INDEX(nombre_completo, ' ', 1), apellido = TRIM(SUBSTR(nombre_completo, INSTR(nombre_completo, ' '))) WHERE nombre_completo IS NOT NULL");

        Schema::table('medicos', function (Blueprint $table) {
            $table->dropColumn('nombre_completo');
        });
    }

    public function down(): void
    {
        Schema::table('medicos', function (Blueprint $table) {
            $table->string('nombre_completo', 150)->nullable()->after('usuario_id');
        });

        DB::statement("UPDATE medicos SET nombre_completo = CONCAT(COALESCE(nombre,''), ' ', COALESCE(apellido,''))");

        Schema::table('medicos', function (Blueprint $table) {
            $table->dropColumn(['nombre', 'apellido', 'tipo_documento_id']);
        });
    }
};
