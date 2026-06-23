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
        'fecha_fin_real',
        'estado',
        'comentarios',
        'muestras',           // Nuevo campo
        'comentario_muestra',  // Nuevo campo
              'latitud',   // ← nuevo
    'longitud',  // ← nuevo
        
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

    protected $casts = [
        'fecha_programada' => 'datetime:Y-m-d H:i',
        'fecha_realizada'  => 'datetime:Y-m-d H:i',  // ← agregar esta
    'fecha_fin_real'   => 'datetime:Y-m-d H:i',  // ← agregar esta
    ];
}