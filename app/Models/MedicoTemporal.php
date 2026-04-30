<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicoTemporal extends Model
{
    protected $table = 'medicos_temporales';
    protected $fillable = ['documento', 'nombre_referencia', 'origen_datos'];

    // Relación: Un médico temporal puede tener muchas transacciones
    public function transacciones()
    {
        return $this->hasMany(Transaccion::class, 'medico_documento', 'documento');
    }
}