<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visita extends Model
{
    protected $table = 'visitas';

    protected $fillable = [
        'medico_id',
        'visitador_id',
        'fecha_programada',
        'fecha_realizada',
        'estado',
        'comentarios'
    ];

    //  Relación con Médico
    public function medico()
    {
        return $this->belongsTo(Medico::class);
    }

    //  Relación con Visitador
    public function visitador()
    {
        return $this->belongsTo(Visitador::class);
    }
}