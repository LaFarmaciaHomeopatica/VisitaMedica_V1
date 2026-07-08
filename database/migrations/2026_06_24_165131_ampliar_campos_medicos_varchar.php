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
    Schema::table('medicos', function (Blueprint $table) {
        $table->string('nombre', 400)->nullable()->change();
        $table->string('apellido', 400)->nullable()->change();
        $table->string('especialidad', 400)->nullable()->change();
        $table->string('horario_atencion', 400)->nullable()->change();
        $table->string('telefono_contacto', 400)->nullable()->change();
        $table->string('geolocalizacion', 400)->nullable()->change();
    });
}

public function down(): void
{
    Schema::table('medicos', function (Blueprint $table) {
        $table->string('nombre', 100)->nullable()->change();
        $table->string('apellido', 100)->nullable()->change();
        $table->string('especialidad', 100)->nullable()->change();
        $table->string('horario_atencion', 100)->nullable()->change();
        $table->string('telefono_contacto', 50)->nullable()->change();
        $table->string('geolocalizacion', 300)->nullable()->change();
    });
}
};
