<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visitador extends Model
{
    use HasFactory;

    // Si tu tabla NO se llama "visitadors", define esto:
    protected $table = 'visitadores';

    // Campos que se pueden llenar masivamente
    protected $fillable = [
        'usuario_id',
        'nombre_completo',
        'documento',
        'zona_id',
        'meta_visitas_mensual',
        'meta_ventas_mensual',
        'estado'
    ];

    // Laravel ya maneja created_at automáticamente
    public $timestamps = true;
}