<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'etiquetas', // <-- Agregado
    ];

    protected $casts = [
        'fecha_programada'     => 'datetime:Y-m-d H:i',
        'fecha_fin_programada' => 'datetime:Y-m-d H:i',
        'fecha_realizada'      => 'datetime:Y-m-d H:i',
        'fecha_fin_real'       => 'datetime:Y-m-d H:i',
        'etiquetas'            => 'array', // <-- Agregado (convierte el JSON de DB a array de PHP)
    ];

    public function visitador()
    {
        return $this->belongsTo(Visitador::class);
    }

    /**
     * Devuelve los IDs de visitadores (de la lista dada) que ya tienen un evento
     * activo que se cruza con el horario indicado.
     *
     * - Con $fin: compara rangos (evento contra evento).
     * - Sin $fin: compara un instante (una visita).
     * Los eventos cancelados no bloquean.
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