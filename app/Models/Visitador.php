<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visitador extends Model
{
    use HasFactory;

    // Nombre de la tabla en MySQL
    protected $table = 'visitadores';
    
    /**
     * IMPORTANTE: Como tu tabla no tiene las columnas created_at y updated_at,
     * debemos dejar esto en FALSE.
     */
    public $timestamps = false;

    // Campos permitidos para asignación masiva
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

    // Relación con el usuario del sistema
    public function user()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    // Relación con el tipo de documento
    public function tipoDocumento()
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_id');
    }
}