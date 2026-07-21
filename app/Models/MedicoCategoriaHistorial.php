<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicoCategoriaHistorial extends Model
{
    protected $table = 'medico_categoria_historial';

    public $timestamps = false;

    protected $fillable = [
        'medico_id',
        'categoria_id',
        'mes',
        'valor_comprado',
        'valor_formulado',
        'valor_total',
    ];

    protected $casts = [
        'mes'             => 'date',
        'valor_comprado'  => 'decimal:2',
        'valor_formulado' => 'decimal:2',
        'valor_total'     => 'decimal:2',
    ];

    public function medico()
    {
        return $this->belongsTo(Medico::class, 'medico_id');
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }
}
