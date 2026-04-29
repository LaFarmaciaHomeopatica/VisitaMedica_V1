<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medicos', function (Blueprint $table) {
            // Se usa unsignedBigInteger porque el id() de Laravel es BigInteger por defecto
            $table->unsignedBigInteger('categoria_id')->nullable()->after('id'); 

            $table->foreign('categoria_id')
                  ->references('id')
                  ->on('categoria')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('medicos', function (Blueprint $table) {
            $table->dropForeign(['categoria_id']);
            $table->dropColumn('categoria_id');
        });
    }
};  