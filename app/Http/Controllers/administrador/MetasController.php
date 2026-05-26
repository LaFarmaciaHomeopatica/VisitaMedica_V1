<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Meta;
use App\Models\Visitador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class MetasController extends Controller
{
    public function index(Request $request)
    {
        $mes = $request->input('mes', Carbon::now()->format('Y-m'));
        $inicio = Carbon::parse($mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        // Visitadores con su meta del mes seleccionado (si existe)
        $visitadores = Visitador::with(['user'])
            ->get()
            ->map(function ($v) use ($inicio) {
                $meta = Meta::where('visitador_id', $v->id)
                    ->whereYear('fecha_meta', $inicio->year)
                    ->whereMonth('fecha_meta', $inicio->month)
                    ->first();

                return [
                    'id'       => $v->id,
                    'nombre'   => $v->nombre,
                    'apellido' => $v->apellido,
                    'zona_id'  => $v->zona_id,
                    'estado'   => $v->estado,
                    'meta'     => $meta ? [
                        'id'           => $meta->id,
                        'meta_visitas' => $meta->meta_visitas,
                        'meta_dinero'  => $meta->meta_dinero,
                    ] : null,
                ];
            });

        // Progreso real del mes: visitas efectivas y valor comprado por visitador
        $progreso = DB::table('visitadores')
            ->leftJoin('visitas', function ($j) use ($inicio, $fin) {
                $j->on('visitas.visitador_id', '=', 'visitadores.id')
                  ->where('visitas.estado', 'efectiva')
                  ->whereBetween('visitas.fecha_realizada', [$inicio, $fin]);
            })
            ->leftJoin('medicos', 'visitas.medico_id', '=', 'medicos.id')
            ->leftJoin('transacciones', function ($j) use ($inicio, $fin) {
                $j->on('transacciones.medico_documento', '=', 'medicos.documento')
                  ->whereBetween('transacciones.fecha', [$inicio, $fin]);
            })
            ->select(
                'visitadores.id',
                DB::raw('COUNT(DISTINCT visitas.id) as visitas_efectivas'),
                DB::raw('COALESCE(SUM(transacciones.valor_comprado), 0) as valor_comprado')
            )
            ->groupBy('visitadores.id')
            ->get()
            ->keyBy('id');

        // Meses que ya tienen metas registradas (para el navegador)
        $mesesConMetas = DB::table('metas')
            ->select(DB::raw("DATE_FORMAT(fecha_meta, '%Y-%m') as mes"))
            ->groupBy('mes')
            ->orderByDesc('mes')
            ->pluck('mes');

        return Inertia::render('ADMINISTRADOR/METAS/Gmetas', [
            'visitadores'   => $visitadores,
            'progreso'      => $progreso,
            'mesActual'     => $mes,
            'mesesConMetas' => $mesesConMetas,
        ]);
    }

    public function upsert(Request $request)
    {
        $request->validate([
            'visitador_id'  => 'required|exists:visitadores,id',
            'mes'           => 'required|date_format:Y-m',
            'meta_visitas'  => 'nullable|integer|min:0',
            'meta_dinero'   => 'nullable|numeric|min:0',
        ]);

        $inicio = Carbon::parse($request->mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        Meta::updateOrCreate(
            [
                'visitador_id' => $request->visitador_id,
                'fecha_meta'   => $inicio->format('Y-m-d'),
            ],
            [
                'meta_visitas'   => $request->input('meta_visitas', 0),
                'meta_dinero'    => $request->input('meta_dinero', 0),
                'fecha_fin_meta' => $fin->format('Y-m-d'),
            ]
        );

        return back()->with('message', 'Meta guardada');
    }

    public function masivo(Request $request)
    {
        $request->validate([
            'mes'          => 'required|date_format:Y-m',
            'meta_visitas' => 'nullable|integer|min:0',
            'meta_dinero'  => 'nullable|numeric|min:0',
        ]);

        $inicio = Carbon::parse($request->mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        $visitadores = Visitador::all('id');

        foreach ($visitadores as $v) {
            Meta::updateOrCreate(
                [
                    'visitador_id' => $v->id,
                    'fecha_meta'   => $inicio->format('Y-m-d'),
                ],
                [
                    'meta_visitas'   => $request->input('meta_visitas', 0),
                    'meta_dinero'    => $request->input('meta_dinero', 0),
                    'fecha_fin_meta' => $fin->format('Y-m-d'),
                ]
            );
        }

        return back()->with('message', 'Metas masivas aplicadas');
    }

    public function destroy($id)
    {
        Meta::findOrFail($id)->delete();
        return back()->with('message', 'Meta eliminada');
    }
}
