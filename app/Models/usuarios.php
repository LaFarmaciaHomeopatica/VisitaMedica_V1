<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * IMPORTANTE: Laravel por defecto busca la tabla 'users'.
     * Aquí le indicamos que use tu tabla real.
     */
    protected $table = 'usuarios';

    /**
     * Los atributos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'username',
        'password',
        'id_rol',
        'estado',
    ];

    /**
     * Los atributos que deben estar ocultos para la serialización.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Relación con el modelo Visitador (opcional, pero útil)
     */
    public function visitador()
    {
        return $this->hasOne(Visitador::class, 'usuario_id');
    }

    public function rol()
{
    // Relación: Un usuario pertenece a un Rol
    // 'id_rol' es la llave foránea en tu tabla 'usuarios'
    return $this->belongsTo(Rol::class, 'id_rol');
}
}