<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaccion extends Model
{
    use HasFactory;

    // Laravel buscará "transaccions" por defecto, así que definimos el nombre real:
    protected $table = 'transacciones';

    // Campos que se pueden llenar masivamente
    protected $fillable = [
        'medico_documento', // Antes medico_id
    'producto_codigo',
        'unidades_compradas',
        'unidades_formuladas',
        'valor_comprado',
        'valor_formulado',
        'fecha',
    ];

    /**
     * Relación con el Médico
     */
   public function medico()
{
    // Relacionamos 'medico_documento' de esta tabla con 'documento' de la tabla Medico
    return $this->belongsTo(Medico::class, 'medico_documento', 'documento');
}

public function producto()
{
    // Relacionamos 'producto_codigo' de esta tabla con 'codigo' de la tabla Producto
    return $this->belongsTo(Productos::class, 'producto_codigo', 'codigo');
}
}   