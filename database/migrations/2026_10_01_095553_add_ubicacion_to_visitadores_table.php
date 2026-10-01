<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitadores', function (Blueprint $table) {
            $table->decimal('latitud', 10, 7)->nullable()->after('estado');
            $table->decimal('longitud', 10, 7)->nullable()->after('latitud');
            $table->timestamp('ubicacion_actualizada_en')->nullable()->after('longitud');
        });
    }

    public function down(): void
    {
        Schema::table('visitadores', function (Blueprint $table) {
            $table->dropColumn(['latitud', 'longitud', 'ubicacion_actualizada_en']);
        });
    }
};