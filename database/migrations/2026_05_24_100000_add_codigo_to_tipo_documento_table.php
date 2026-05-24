<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tipo_documento', function (Blueprint $table) {
            $table->string('codigo', 10)->nullable()->unique()->after('id');
        });

        DB::table('tipo_documento')->where('nombre', 'Cédula de Ciudadanía')->update(['codigo' => 'CC']);
        DB::table('tipo_documento')->where('nombre', 'Cédula de Extranjería')->update(['codigo' => 'CE']);
        DB::table('tipo_documento')->where('nombre', 'Tarjeta de Identidad')->update(['codigo' => 'TI']);
        DB::table('tipo_documento')->where('nombre', 'Pasaporte')->update(['codigo' => 'PAS']);
        DB::table('tipo_documento')->where('nombre', 'NIT')->update(['codigo' => 'NIT']);
    }

    public function down(): void
    {
        Schema::table('tipo_documento', function (Blueprint $table) {
            $table->dropColumn('codigo');
        });
    }
};
