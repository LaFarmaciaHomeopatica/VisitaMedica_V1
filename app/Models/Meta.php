<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Meta extends Model
{
    use HasFactory;

    // Nombre de la tabla (opcional, pero buena práctica si Laravel busca "metas")
    protected $table = 'metas';

    // Campos que permitimos registrar en masa
    protected $fillable = [
        'visitador_id',
        'meta_dinero',
        'meta_visitas',
        'fecha_meta', // Nuevo campo para la fecha de la meta
        'fecha_fin_meta' // Nuevo campo para la fecha de fin de la meta
    ];

    /**
     * Una meta pertenece a un Visitador.
     */
    public function visitador(): BelongsTo
    {
        // Especificamos 'visitador_id' como la llave foránea explícitamente
        return $this->belongsTo(Visitador::class, 'visitador_id');
    }
}