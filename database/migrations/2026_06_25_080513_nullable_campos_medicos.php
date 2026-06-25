<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('medicos', function (Blueprint $table) {
        $table->string('apellido', 400)->nullable()->change();
        $table->string('especialidad', 400)->nullable()->change();
        $table->string('geolocalizacion', 400)->nullable()->change();
        $table->string('direccion_detalles', 400)->nullable()->change();
        $table->string('telefono_contacto', 400)->nullable()->change();
        $table->string('horario_atencion', 400)->nullable()->change();
        $table->date('fecha_inicio_relacion')->nullable()->change();
    });
}

public function down(): void
{
    Schema::table('medicos', function (Blueprint $table) {
        $table->string('apellido', 100)->nullable(false)->change();
        $table->string('especialidad', 100)->nullable(false)->change();
        $table->string('geolocalizacion', 300)->nullable(false)->change();
        $table->string('direccion_detalles')->nullable(false)->change();
        $table->string('telefono_contacto', 50)->nullable(false)->change();
        $table->string('horario_atencion', 100)->nullable(false)->change();
        $table->date('fecha_inicio_relacion')->nullable(false)->change();
    });
}
};
