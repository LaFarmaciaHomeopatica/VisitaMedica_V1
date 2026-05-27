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
        $mes    = $request->input('mes', Carbon::now()->format('Y-m'));
        $inicio = Carbon::parse($mes . '-01')->startOfMonth();
        $fin    = $inicio->copy()->endOfMonth();

        // Visitadores con su meta del mes seleccionado
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

        // 1. Visitas efectivas por visitador en el mes
        $visitasEfectivas = DB::table('visitas')
            ->where('estado', 'efectiva')
            ->whereYear('fecha_realizada', $inicio->year)
            ->whereMonth('fecha_realizada', $inicio->month)
            ->select('visitador_id', DB::raw('COUNT(*) as visitas_efectivas'))
            ->groupBy('visitador_id')
            ->pluck('visitas_efectivas', 'visitador_id');

        // 2. Valor comprado por visitador: médicos asignados directamente
        $ventasPorVisitador = DB::table('medicos')
            ->join('transacciones', function ($j) use ($inicio) {
                $j->on('transacciones.medico_documento', '=', DB::raw('CAST(medicos.documento AS CHAR)'))
                  ->whereYear('transacciones.fecha', $inicio->year)
                  ->whereMonth('transacciones.fecha', $inicio->month);
            })
            ->select(
                'medicos.visitador_id',
                DB::raw('SUM(transacciones.valor_comprado) as valor_comprado')
            )
            ->groupBy('medicos.visitador_id')
            ->pluck('valor_comprado', 'visitador_id');

        // 3. Combina en la estructura que espera el frontend
        $progreso = Visitador::all('id')->mapWithKeys(function ($v) use ($visitasEfectivas, $ventasPorVisitador) {
            return [
                $v->id => (object)[
                    'id'                => $v->id,
                    'visitas_efectivas' => $visitasEfectivas[$v->id] ?? 0,
                    'valor_comprado'    => (float) ($ventasPorVisitador[$v->id] ?? 0),
                ]
            ];
        });

        // Meses que ya tienen metas registradas
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

        foreach (Visitador::all('id') as $v) {
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