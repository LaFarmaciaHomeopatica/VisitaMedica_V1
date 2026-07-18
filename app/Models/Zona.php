<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Zona extends Model
{
    protected $table = 'zonas';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'poligono',
    ];

    protected $casts = [
        'poligono' => 'array',
    ];

    public function visitadores()
    {
        return $this->hasMany(Visitador::class, 'zona_id');
    }
}
