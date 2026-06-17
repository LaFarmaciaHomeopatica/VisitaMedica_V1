<?php

namespace App\Http\Controllers\administrador;

use App\Http\Controllers\Controller;
use App\Models\Transaccion;
use App\Models\Medico;
use App\Models\MedicoTemporal;
use App\Models\Productos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Exports\TransaccionesExport;
use App\Imports\TransaccionesImport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class TransaccionesController extends Controller
{
    public function index()
    {
        $tempNombres = MedicoTemporal::pluck('nombre_referencia', 'documento');

        $transacciones = Transaccion::with([
            'medico:documento,nombre,apellido',
            'producto:codigo,nombre'
        ])->latest('updated_at')->get()->map(function ($t) use ($tempNombres) {
            if (!$t->medico) {
                $t->medico_temporal_nombre = $tempNombres[$t->medico_documento] ?? null;
            }
            return $t;
        });

        $calendarData = DB::table('transacciones')
            ->select(
                DB::raw('DATE(fecha) as dia'),
                DB::raw('COUNT(*) as total_tx'),
                DB::raw('COUNT(DISTINCT medico_documento) as total_medicos')
            )
            ->groupBy('dia')
            ->orderBy('dia')
            ->get()
            ->mapWithKeys(fn($d) => [$d->dia => [
                'total_tx' => (int) $d->total_tx,
                'medicos'  => (int) $d->total_medicos,
            ]]);

        return Inertia::render('ADMINISTRADOR/TRANSACCIONES/Gtransacciones', [
            'transacciones' => $transacciones,
            'medicos'       => Medico::select('nombre', 'apellido', 'documento')->get(),
            'productos'     => Productos::select('nombre', 'codigo')->get(),
            'calendarData'  => $calendarData,
        ]);
    }

    /**
     * Descargar plantilla vacía para importación
     */
    public function plantilla()
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Transacciones');

        $headers = [
            'fecha', 'documento_medico', 'nombre_medico', 'codigo_producto',
            'unidades_formuladas', 'unidades_compradas', 'valor_formulado', 'valor_comprado',
        ];

        $sheet->fromArray($headers, null, 'A1');

        // Estilo encabezado
        $sheet->getStyle('A1:H1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 11],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                       'startColor' => ['argb' => 'FF3D3FD8']],
            'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
        ]);

        // Fila de ejemplo
        $sheet->fromArray([
            '2026-05-23', '12345678', 'Dr. Juan García', 'PROD-001', 10, 5, 500000, 250000,
        ], null, 'A2');

        $sheet->getStyle('A2:H2')->getFont()->setItalic(true);
        $sheet->getStyle('A2:H2')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFFFF8E1');

        // Anchos
        foreach (['A' => 14, 'B' => 18, 'C' => 28, 'D' => 16, 'E' => 22, 'F' => 22, 'G' => 18, 'H' => 18] as $col => $w) {
            $sheet->getColumnDimension($col)->setWidth($w);
        }

        $sheet->freezePane('A2');

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = 'plantilla_transacciones.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Exportar transacciones a Excel
     */
   public function exportar(Request $request)
    {
        // Validamos que si envían 'ids', sea un arreglo válido
        $request->validate([
            'ids' => 'nullable|array',
            'ids.*' => 'exists:transacciones,id'
        ]);

        $ids = $request->input('ids', []); // Si no viene nada, por defecto es un array vacío

        // Pasamos los IDs al constructor de nuestra clase de exportación
        return Excel::download(
            new TransaccionesExport($ids), 
            'reporte_transacciones_' . now()->format('d-m-Y') . '.xlsx'
        );
    }

    /**
     * Importar transacciones desde Excel (Versión Limpia)
     */
    public function importar(Request $request)
    {
        $request->validate([
            'archivo' => 'required|mimes:xlsx,xls,csv',
        ]);

        try {
            $mes    = $request->input('mes_referencia', now()->format('Y-m'));
            $import = new TransaccionesImport($mes);

            Excel::import($import, $request->file('archivo'));

            return redirect()->back()->with('import_result', [
                'ok'               => true,
                'importadas'       => $import->importadas,
                'actualizadas'     => $import->actualizadas,
                'pendientes'       => $import->pendientes,
                'invalidas'        => $import->invalidas,
                'codigosNoExisten' => $import->codigosNoExisten,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('import_result', [
                'ok'    => false,
                'error' => 'Error al procesar el archivo: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Obtener métricas mensuales para el dashboard/vista
     */
    public function metricas(Request $request)
    {
        // Aquí es donde la magia ocurre: el filtro de fecha se aplica aquí
        // para que las métricas sean exactas aunque el Excel traiga otros meses.
        $mes = $request->input('mes', now()->month);
        $anio = $request->input('anio', now()->year);

        $stats = Transaccion::whereMonth('fecha', $mes)
            ->whereYear('fecha', $anio)
            ->selectRaw('
                SUM(unidades_compradas) as total_compradas,
                SUM(unidades_formuladas) as total_formuladas,
                SUM(valor_comprado) as total_valor_comprado,
                SUM(valor_formulado) as total_valor_formulado
            ')
            ->first();

        return Inertia::render('ADMINISTRADOR/TRANSACCIONES/Metricas', [
            'stats' => $stats,
            'filtros' => [
                'mes' => $mes,
                'anio' => $anio
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'medico_documento'    => 'required|exists:medicos,documento',
            'producto_codigo'     => 'required|exists:productos,codigo',
            'unidades_compradas'  => 'integer|min:0',
            'unidades_formuladas' => 'integer|min:0',
            'valor_comprado'      => 'numeric|min:0',
            'valor_formulado'     => 'numeric|min:0',
            'fecha'               => 'required|date', 
        ]);

        Transaccion::create($validated);

        return redirect()->route('Gtransacciones.index')
            ->with('message', 'Transacción registrada con éxito');
    }

    public function update(Request $request, Transaccion $transaccion)
    {
        $validated = $request->validate([
            'medico_documento'    => 'required|exists:medicos,documento',
            'producto_codigo'     => 'required|exists:productos,codigo',
            'unidades_compradas'  => 'integer|min:0',
            'unidades_formuladas' => 'integer|min:0',
            'valor_comprado'      => 'numeric|min:0',
            'valor_formulado'     => 'numeric|min:0',
            'fecha'               => 'required|date', 
        ]);

        $transaccion->update($validated);

        return redirect()->route('Gtransacciones.index')
            ->with('message', 'Transacción actualizada');
    }

    public function destroy(Transaccion $transaccion)
    {
        $transaccion->delete();

        return redirect()->route('Gtransacciones.index')
            ->with('message', 'Transacción eliminada correctamente');
    }

    public function destroyMultiple(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:transacciones,id' 
        ]);

        Transaccion::whereIn('id', $request->ids)->delete();

        return redirect()->route('Gtransacciones.index')
            ->with('message', 'Selección eliminada correctamente');
    }
}