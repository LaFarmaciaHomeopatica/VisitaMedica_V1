<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Visitador;
use App\Models\User;
use App\Models\TipoDocumento;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DvisitadoresController extends Controller
{
    public function index()
    {
        $visitadores = Visitador::with(['tipoDocumento', 'user', 'metas' => function ($query) {
            $query->latest('fecha_meta')->limit(1);
        }])->get();

        $usuariosOcupados = Visitador::pluck('usuario_id')->filter()->values();
        $usuariosLibres = User::whereNotIn('id', $usuariosOcupados)
            ->select('id', 'username')
            ->orderBy('username')
            ->get();

        return Inertia::render('ADMINISTRADOR/VISITADORES/Gvisitadores', [
            'visitadores'    => $visitadores,
            'tiposDocumento' => TipoDocumento::all(['id', 'codigo', 'nombre']),
            'usuariosLibres' => $usuariosLibres,
        ]);
    }

    public function buscarUsuario($id)
    {
        $usuario = User::find($id);
        
        if ($usuario) {
            return response()->json([
                'success' => true,
                'nombre' => $usuario->username 
            ]);
        }

        return response()->json([
            'success' => false,
            'nombre' => null
        ], 404);
    }

    public function store(Request $request)
    {
        $request->validate([
            'usuario_id' => 'required|exists:usuarios,id|unique:visitadores,usuario_id',
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento_id' => 'required|exists:tipo_documento,id',
            'documento' => 'required|string|unique:visitadores,documento',
            'zona_id' => 'required',
            'estado' => 'required|in:Habilitado,Inhabilitado',
        ]);

        Visitador::create($request->all());

        return Redirect::route('Gvisitadores.index')->with('message', 'Registrado con éxito');
    }

    public function update(Request $request, $id)
    {
        $visitador = Visitador::findOrFail($id);

        $request->validate([
            'usuario_id' => 'required|exists:usuarios,id|unique:visitadores,usuario_id,' . $visitador->id,
            'nombre' => 'required|string|max:255',
            'apellido' => 'required|string|max:255',
            'tipo_documento_id' => 'required|exists:tipo_documento,id',
            'documento' => 'required|string|unique:visitadores,documento,' . $visitador->id,
            'zona_id' => 'required',
            'estado' => 'required|in:Habilitado,Inhabilitado',
        ]);

        $visitador->update($request->all());

        return Redirect::back()->with('message', 'Registro actualizado');
    }

    public function toggleEstado($id)
    {
        $visitador = Visitador::findOrFail($id);
        $visitador->estado = $visitador->estado === 'Habilitado' ? 'Inhabilitado' : 'Habilitado';
        $visitador->save();

        return Redirect::back()->with('success', 'Estado actualizado.');
    }

    public function show($id, \Illuminate\Http\Request $request)
    {
        $visitador = Visitador::with(['tipoDocumento', 'user'])->findOrFail($id);
        $mesParam        = $request->input('mes', Carbon::now()->format('Y-m'));
        $mesInicio       = Carbon::parse($mesParam . '-01')->startOfMonth();
        $mesFin          = $mesInicio->copy()->endOfMonth();

        // --- KPIs de visitas del mes seleccionado ---
        $visitasStats = DB::table('visitas')
            ->where('visitador_id', $id)
            ->whereBetween('fecha_programada', [$mesInicio, $mesFin])
            ->select(
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN estado = 'efectiva'      THEN 1 ELSE 0 END) as efectivas"),
                DB::raw("SUM(CASE WHEN estado = 'programada'    THEN 1 ELSE 0 END) as programadas"),
                DB::raw("SUM(CASE WHEN estado = 'cancelada'     THEN 1 ELSE 0 END) as canceladas"),
                DB::raw("SUM(CASE WHEN estado = 'reprogramada'  THEN 1 ELSE 0 END) as reprogramadas"),
                DB::raw("SUM(CASE WHEN estado = 'No contactado' THEN 1 ELSE 0 END) as no_contactados")
            )->first();

        // --- Todos los médicos históricos del visitador (sin filtro de mes) ---
        // Se usa para transacciones y tendencia, ya que un médico puede comprar
        // en meses donde el visitador no le hizo visita ese mes específico.
        $todosMedicosDoc = DB::table('visitas')
            ->where('visitas.visitador_id', $id)
            ->join('medicos', 'visitas.medico_id', '=', 'medicos.id')
            ->pluck('medicos.documento')
            ->unique()
            ->values();

        // --- Médicos visitados en el mes seleccionado (para KPI y tabla) ---
        $medicos = DB::table('visitas')
            ->where('visitas.visitador_id', $id)
            ->whereBetween('visitas.fecha_programada', [$mesInicio, $mesFin])
            ->join('medicos', 'visitas.medico_id', '=', 'medicos.id')
            ->select(
                'medicos.id',
                'medicos.documento',
                'medicos.nombre as nombre',
                'medicos.especialidad',
                DB::raw('COUNT(visitas.id) as total_visitas'),
                DB::raw("SUM(CASE WHEN visitas.estado = 'efectiva' THEN 1 ELSE 0 END) as efectivas"),
                DB::raw('MAX(visitas.fecha_programada) as ultima_visita')
            )
            ->groupBy('medicos.id', 'medicos.documento', 'medicos.nombre', 'medicos.especialidad')
            ->orderByDesc('total_visitas')
            ->get();

        // --- Transacciones del mes seleccionado usando TODOS los médicos históricos ---
        $txStats = DB::table('transacciones')
            ->whereIn('medico_documento', $todosMedicosDoc)
            ->whereBetween('fecha', [$mesInicio, $mesFin])
            ->select(
                DB::raw('COALESCE(SUM(valor_comprado), 0)      as total_valor_comprado'),
                DB::raw('COALESCE(SUM(valor_formulado), 0)     as total_valor_formulado'),
                DB::raw('COALESCE(SUM(unidades_compradas), 0)  as total_unidades'),
                DB::raw('COUNT(*) as total_transacciones')
            )->first();

        // --- Top productos del mes (de todos sus médicos históricos) ---
        $topProductos = DB::table('transacciones')
            ->join('productos', 'transacciones.producto_codigo', '=', 'productos.codigo')
            ->whereIn('transacciones.medico_documento', $todosMedicosDoc)
            ->whereBetween('transacciones.fecha', [$mesInicio, $mesFin])
            ->select(
                'productos.nombre',
                DB::raw('SUM(transacciones.valor_comprado) as valor_comprado'),
                DB::raw('SUM(transacciones.unidades_compradas) as unidades')
            )
            ->groupBy('productos.nombre')
            ->orderByDesc('valor_comprado')
            ->take(5)->get();

        // --- Tendencia mensual histórica (usa todos los médicos, sin filtro de mes) ---
        $tendencia = DB::table('transacciones')
            ->whereIn('medico_documento', $todosMedicosDoc)
            ->select(
                DB::raw("DATE_FORMAT(fecha, '%Y-%m') as mes"),
                DB::raw('SUM(valor_comprado)  as valor_comprado'),
                DB::raw('SUM(valor_formulado) as valor_formulado')
            )
            ->groupBy('mes')->orderBy('mes')->get();

        // --- Historial de visitas del mes seleccionado ---
        $visitas = DB::table('visitas')
            ->where('visitas.visitador_id', $id)
            ->whereBetween('visitas.fecha_programada', [$mesInicio, $mesFin])
            ->leftJoin('medicos', 'visitas.medico_id', '=', 'medicos.id')
            ->select(
                'visitas.id',
                'visitas.estado',
                'visitas.fecha_programada',
                'visitas.fecha_realizada',
                'visitas.comentarios',
                'medicos.nombre as nombre_medico',
                'medicos.especialidad'
            )
            ->orderByDesc('visitas.fecha_programada')
            ->take(20)->get();

        // --- Meta del mes seleccionado (registrada desde /Gmetas) ---
        $metaActiva = DB::table('metas')
            ->where('visitador_id', $id)
            ->whereYear('fecha_meta',  $mesInicio->year)
            ->whereMonth('fecha_meta', $mesInicio->month)
            ->first();

        // --- Progreso real del mes (visitas efectivas + valor de todos sus médicos) ---
        $visitasEfectivasMes = DB::table('visitas')
            ->where('visitador_id', $id)
            ->where('estado', 'efectiva')
            ->whereBetween('fecha_realizada', [$mesInicio, $mesFin])
            ->count();

        $valorCompradoMes = DB::table('transacciones')
            ->whereIn('medico_documento', $todosMedicosDoc)
            ->whereBetween('fecha', [$mesInicio, $mesFin])
            ->sum('valor_comprado');

        $progresoMeta = [
            'visitas_efectivas' => $visitasEfectivasMes,
            'valor_comprado'    => (float) $valorCompradoMes,
        ];

        return Inertia::render('ADMINISTRADOR/VISITADORES/VisitadorDetalle', [
            'visitador'    => $visitador,
            'visitasStats' => $visitasStats,
            'medicos'      => $medicos,
            'txStats'      => $txStats,
            'topProductos' => $topProductos,
            'tendencia'    => $tendencia,
            'visitas'      => $visitas,
            'metaActiva'   => $metaActiva,
            'progresoMeta' => $progresoMeta,
            'mesActual'    => $mesParam,
        ]);
    }
}