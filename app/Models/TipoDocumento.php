<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TipoDocumento extends Model
{
    use HasFactory;

    // Nombre exacto de la tabla en tu base de datos
    protected $table = 'tipo_documento';

    // Desactivamos timestamps si tu tabla no tiene las columnas created_at y updated_at
    public $timestamps = false;

    // Campos que permitimos que se llenen mediante arreglos (necesario para el Controller)
    protected $fillable = [
        'nombre' // O el nombre de la columna donde guardas "DNI", "Cédula", etc.
    ];

    /**
     * Relación inversa: Un tipo de documento pertenece a muchos visitadores
     */
    public function visitadores()
    {
        return $this->hasMany(Visitador::class, 'tipo_documento_id');
    }
}