<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Medico extends Model
{
    use HasFactory;

    protected $table = 'medicos';

    // Desactivamos timestamps si tu tabla no tiene created_at/updated_at
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'nombre_completo',
        'documento',
        'especialidad',
        'geolocalizacion',
        'direccion_detalles',
        'telefono_contactos',
        'horario_atencion',
        'visitador_id',
        'fecha_inicio_relacion'
    ];

    

    // Relación: Un médico es asignado a un visitador
    public function visitador()
    {
        return $this->belongsTo(User::class, 'visitador_id');
    }
}