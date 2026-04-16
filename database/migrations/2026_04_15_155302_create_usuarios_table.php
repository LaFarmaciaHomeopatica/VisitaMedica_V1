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
        Schema::create('usuarios', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('username', 150)->unique('email');
            $table->string('password');
            $table->integer('id_rol')->index('fk_usuario_rol');
            $table->timestamp('created_at')->nullable()->useCurrent();

            $table->unique(['username'], 'username');
            $table->unique(['username'], 'usuario');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
