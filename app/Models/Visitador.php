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
        'meta_visitas_mensual',
        'meta_ventas_mensual',
        'estado',
        'tipo_documento_id',
        'nombre',
        'apellido'
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

    /**
     * Relación con los Médicos
     * Un visitador tiene muchos médicos asignados
     */
    public function medicos()
    {
        // Verifica que en tu tabla 'medicos' la columna se llame 'visitador_id'
        return $this->hasMany(Medico::class, 'visitador_id');
    }

    /**
     * Relación con las Visitas
     * Un visitador genera muchas visitas
     */
    public function visitas()
    {
        return $this->hasMany(Visita::class, 'visitador_id');
    }
}