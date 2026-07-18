<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Listas de precios (pricelists) traídas desde Odoo, clasificadas
     * manualmente según si el pedido asociado cuenta como Compra o
     * Formulación (o una categoría propia del negocio).
     */
    public function up(): void
    {
        Schema::create('listas_precios', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('odoo_id')->nullable()->unique();
            $table->string('nombre');
            $table->string('categoria');
            $table->timestamps();
        });

        DB::table('listas_precios')->insert([
            ['odoo_id' => 1,    'nombre' => 'Tarifa pública',              'categoria' => 'Formulación',    'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 3,    'nombre' => 'Tarifa Paciente -5%',         'categoria' => 'Formulación',    'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 7,    'nombre' => 'Tarifa Paciente -10%',        'categoria' => 'Formulación',    'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 8,    'nombre' => 'Tarifa Paciente -15%',        'categoria' => 'Formulación',    'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 21,   'nombre' => 'Tarifa Paciente -15%',        'categoria' => 'Formulación',    'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 4,    'nombre' => 'Tarifa médico',               'categoria' => 'Compra',         'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 5,    'nombre' => 'Tarifa PM5%',                 'categoria' => 'Compra',         'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 14,   'nombre' => 'Tarifa PMHN10%',              'categoria' => 'Compra',         'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 9,    'nombre' => 'Tarifa PMH10%',               'categoria' => 'Compra',         'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 12,   'nombre' => 'Tarifa PMHN12%',              'categoria' => 'Compra',         'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 6,    'nombre' => 'Tarifa Positiva',             'categoria' => 'Solo Positiva',  'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 2528, 'nombre' => 'Tarifa Empleados',            'categoria' => 'Solo Empleados', 'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 2530, 'nombre' => 'Negociación esp',             'categoria' => 'Compra',         'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 2531, 'nombre' => 'Tarifa Somos Primero',        'categoria' => 'Formulación',    'created_at' => now(), 'updated_at' => now()],
            ['odoo_id' => 2532, 'nombre' => 'Tarifa Colpatria Empleados',  'categoria' => 'Formulación',    'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('listas_precios');
    }
};
