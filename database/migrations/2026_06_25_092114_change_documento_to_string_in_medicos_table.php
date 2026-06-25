<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('medicos', function (Blueprint $table) {
        $table->string('documento', 20)->unique()->change();
    });
}

public function down()
{
    Schema::table('medicos', function (Blueprint $table) {
        $table->integer('documento')->unique()->change();
    });
}
};
