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
        Schema::create('tipo_documento', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('nombre', 50)->unique();
        });

        DB::table('tipo_documento')->insert([
            ['nombre' => 'Cédula de Ciudadanía'],
            ['nombre' => 'Cédula de Extranjería'],
            ['nombre' => 'Tarjeta de Identidad'],
            ['nombre' => 'Pasaporte'],
            ['nombre' => 'NIT'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipo_documento');
    }
};
