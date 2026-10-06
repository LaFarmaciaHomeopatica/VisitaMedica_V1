<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Etiqueta extends Model
{
    protected $table = 'etiquetas';

    protected $fillable = [
        'nombre',
        'color',
    ];

    public function eventos(): BelongsToMany
    {
        return $this->belongsToMany(Evento::class, 'etiqueta_evento');
    }


    
}

