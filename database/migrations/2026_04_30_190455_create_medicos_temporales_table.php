<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medicos_temporales', function (Blueprint $table) {
            $table->id();
            // El documento es nuestra ancla para saber de quién hablamos
            $table->string('documento')->unique(); 
            // Guardamos el nombre tal cual viene en el Excel (puede tener errores)
            $table->string('nombre_referencia')->nullable();
            // Campos de trazabilidad (útiles para saber cuándo se subió ese Excel)
            $table->string('origen_datos')->default('importacion_excel');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicos_temporales');
    }
};