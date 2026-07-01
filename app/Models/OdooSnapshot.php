<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OdooSnapshot extends Model
{
    protected $table = 'odoo_snapshots';

    protected $fillable = [
        'documento',
        'periodo',
        'mes',
        'payload',
        'actualizado_en',
    ];

    protected $casts = [
        'payload' => 'array',
        'actualizado_en' => 'datetime',
    ];

    /**
     * Busca un snapshot existente para la combinación documento+periodo+mes.
     */
    public static function buscar(string $documento, string $periodo, string $mes): ?self
    {
        return static::where('documento', $documento)
            ->where('periodo', $periodo)
            ->where('mes', $mes)
            ->first();
    }

    /**
     * Crea o actualiza el snapshot para esa combinación (usado al refrescar).
     */
    public static function guardar(string $documento, string $periodo, string $mes, array $payload): self
    {
        return static::updateOrCreate(
            ['documento' => $documento, 'periodo' => $periodo, 'mes' => $mes],
            ['payload' => $payload, 'actualizado_en' => now()]
        );
    }
}