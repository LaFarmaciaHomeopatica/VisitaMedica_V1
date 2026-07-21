<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListaPrecio extends Model
{
    protected $table = 'listas_precios';

    protected $fillable = [
        'odoo_id',
        'nombre',
        'categoria',
    ];
}
