<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    use HasFactory;

    // Especificamos el nombre de la tabla ya que no sigue la convención plural
    protected $table = 'categoria';

    // Campos que permitimos llenar masivamente
    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    // Si no tienes las columnas 'created_at' y 'updated_at' en tu SQL, 
    // debes desactivarlas aquí:
    public $timestamps = true; 
}