// database/migrations/xxxx_add_ubicacion_to_visitas_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('visitas', function (Blueprint $table) {
            $table->decimal('latitud', 10, 7)->nullable()->after('comentario_muestra');
            $table->decimal('longitud', 10, 7)->nullable()->after('latitud');
        });
    }

    public function down(): void
    {
        Schema::table('visitas', function (Blueprint $table) {
            $table->dropColumn(['latitud', 'longitud']);
        });
    }
};