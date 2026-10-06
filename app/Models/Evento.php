<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Evento extends Model
{
    protected $table = 'eventos';
    public $timestamps = false;

    protected $fillable = [
        'visitador_id',
        'nombre_evento',
        'comentario',
        'ubicacion',
        'latitud',
        'longitud',
        'fecha_programada',
        'fecha_fin_programada',
        'fecha_realizada',
        'fecha_fin_real',
        'estado',
    ];

    protected $casts = [
        'fecha_programada'     => 'datetime:Y-m-d H:i',
        'fecha_fin_programada' => 'datetime:Y-m-d H:i',
        'fecha_realizada'      => 'datetime:Y-m-d H:i',
        'fecha_fin_real'       => 'datetime:Y-m-d H:i',
    ];

    public function visitador(): BelongsTo
    {
        return $this->belongsTo(Visitador::class);
    }

    /**
     * Relación muchos a muchos con Etiquetas.
     */
    public function etiquetas(): BelongsToMany
    {
        // ⚠️ Asegúrate si el nombre exacto de la tabla pivote en MySQL es 'etiqueta_evento' o 'evento_etiqueta'
        return $this->belongsToMany(Etiqueta::class, 'etiqueta_evento', 'evento_id', 'etiqueta_id');
    }

    /**
     * Devuelve los IDs de visitadores que ya tienen un evento activo
     * que se cruza con el horario indicado.
     */
    public static function visitadoresOcupados(array $visitadorIds, $inicio, $fin = null, $ignorarId = null): array
    {
        $query = static::whereIn('visitador_id', $visitadorIds)
            ->where('estado', '!=', 'cancelado')
            ->whereNotNull('fecha_fin_programada');

        if ($ignorarId) {
            $query->where('id', '!=', $ignorarId);
        }

        if ($fin) {
            $query->where('fecha_programada', '<', $fin)
                  ->where('fecha_fin_programada', '>', $inicio);
        } else {
            $query->where('fecha_programada', '<=', $inicio)
                  ->where('fecha_fin_programada', '>', $inicio);
        }

        return $query->pluck('visitador_id')->unique()->values()->all();
    }
}