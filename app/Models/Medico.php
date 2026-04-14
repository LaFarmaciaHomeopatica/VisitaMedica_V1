<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medico extends Model
{
    use HasFactory;

    protected $table = 'medicos';

    protected $fillable = [
        'usuario_id',
        'nombre_completo',
        'documento',
        'especialidad',
        'geolocalizacion',
        'direccion_details',
        'telefono_contacto',
        'horario_atencion',
        'visitador_id',
        'fecha_inicio_relacion'
    ];
}