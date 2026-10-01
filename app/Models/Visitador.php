<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visitador extends Model
{
    use HasFactory;

    protected $table = 'visitadores';
    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'documento',
        'zona_id',
        'estado',
        'tipo_documento_id',
        'nombre',
        'apellido',
        'latitud',
        'longitud',
        'ubicacion_actualizada_en',
    ];

    protected $casts = [
        'latitud'                  => 'float',
        'longitud'                 => 'float',
        'ubicacion_actualizada_en' => 'datetime',
    ];

    // --- RELACIONES ---

    public function user()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_id');
    }

    public function zona()
    {
        return $this->belongsTo(Zona::class, 'zona_id');
    }

    /**
     * Un visitador tiene muchos médicos asignados
     */
    public function medicos()
    {
        return $this->hasMany(Medico::class, 'visitador_id');
    }

    /**
     * Un visitador genera muchas visitas
     */
    public function visitas()
    {
        return $this->hasMany(Visita::class, 'visitador_id');
    }

    /**
     * Un visitador tiene una meta (uno a uno)
     */
    public function metas()
    {
        return $this->hasOne(Meta::class, 'visitador_id');
    }
}