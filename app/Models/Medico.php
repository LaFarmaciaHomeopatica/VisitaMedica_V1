<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Medico extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla asociada al modelo.
     * * @var string
     */
    protected $table = 'medicos';

    /**
     * Los atributos que se pueden asignar de manera masiva.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'documento',
        'especialidad',
        'geolocalizacion',
        'direccion_detalles',
        'telefono_contacto',
        'horario_atencion',
        'visitador_id',
        'fecha_inicio_relacion',
        'tipo_documento_id',
        'nombre',
        'apellido',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'fecha_inicio_relacion' => 'date',
        'documento' => 'integer',
        'visitador_id' => 'integer',
        'tipo_documento_id' => 'integer',
    ];

    /**
     * Obtener el visitador asignado al médico.
     */
    public function visitador(): BelongsTo
    {
        return $this->belongsTo(Visitador::class, 'visitador_id');
    }

    /**
     * Accesor para obtener el nombre completo del médico.
     */
    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombre} {$this->apellido}";
    }
}