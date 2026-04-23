<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Visita extends Model
{
    protected $table = 'visitas';
    public $timestamps = false;

    protected $fillable = [
        'medico_id',
        'visitador_id',
        'fecha_programada',
        'fecha_realizada',
        'estado',
        'comentarios'
    ];

    //  Relación con Médico
    public function medico()
    {
        return $this->belongsTo(Medico::class);
    }

    //  Relación con Visitador
    public function visitador()
    {
        return $this->belongsTo(Visitador::class);
    }


    public static function getPossibleStatuses()
{
    // CAMBIO CLAVE: Pasa el string directo, sin DB::raw()
    $results = DB::select("SHOW COLUMNS FROM visitas WHERE Field = 'estado'");
    
    if (empty($results)) {
        return [];
    }

    $type = $results[0]->Type;
    
    // Extraemos los valores del enum('valor1','valor2')
    preg_match('/^enum\((.*)\)$/', $type, $matches);
    
    if (!isset($matches[1])) {
        return [];
    }

    $enum = array();
    foreach(explode(',', $matches[1]) as $value){
        $v = trim($value, "'");
        $enum[] = $v;
    }
    
    return $enum;
}

}