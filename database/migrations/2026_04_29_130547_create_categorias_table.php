<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
   public function up(): void
    {
        Schema::create('categoria', function (Blueprint $table) {
            $table->id(); // Crea un BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
            $table->string('nombre', 50);
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });

        // Insertar los datos iniciales
        DB::table('categoria')->insert([
            ['nombre' => 'A', 'descripcion' => ''],
            ['nombre' => 'B', 'descripcion' => ''],
            ['nombre' => 'C', 'descripcion' => ''],
            ['nombre' => 'X', 'descripcion' => ''],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('categoria');
    }
};