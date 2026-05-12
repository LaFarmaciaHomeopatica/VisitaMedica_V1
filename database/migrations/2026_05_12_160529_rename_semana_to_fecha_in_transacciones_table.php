<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // IMPORTANTE: Añade esta línea

return new class extends Migration
{
    public function up(): void
    {
        // 1. Si todavía existe 'semana', renombrarla
        if (Schema::hasColumn('transacciones', 'semana')) {
            Schema::table('transacciones', function (Blueprint $table) {
                $table->renameColumn('semana', 'fecha');
            });
        }

        // 2. LIMPIEZA RADICAL: Ponemos en NULL cualquier valor que no sea fecha 
        // para que MySQL no explote al cambiar el tipo de dato.
        DB::table('transacciones')->update(['fecha' => null]);

        // 3. Ahora sí, cambiamos el tipo de dato a DATE con seguridad
        Schema::table('transacciones', function (Blueprint $table) {
            $table->date('fecha')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('transacciones', function (Blueprint $table) {
            $table->renameColumn('fecha', 'semana');
        });
    }
};