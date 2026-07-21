<?php

namespace App\Console\Commands;

use App\Models\Categoria;
use App\Models\Medico;
use App\Models\MedicoCategoriaHistorial;
use App\Services\OdooService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CalcularCategoriasMedicos extends Command
{
    /**
     * Cuántos documentos se piden a Odoo por llamada — evita mandar un XML-RPC
     * gigante de una sola vez con los ~5000+ médicos del sistema.
     */
    private const TAMANO_LOTE = 300;

    protected $signature = 'medicos:calcular-categorias {--mes= : Mes a calcular en formato YYYY-MM (por defecto: el mes anterior ya cerrado)}';

    protected $description = 'Calcula la categoría mensual de cada médico (valor comprado + formulado en Odoo) y guarda un snapshot histórico.';

    public function handle(OdooService $odoo): int
    {
        set_time_limit(0);

        $mes = $this->resolverMes();
        $fechaDesde = $mes->copy()->startOfMonth()->format('Y-m-d');
        $fechaHasta = $mes->copy()->endOfMonth()->format('Y-m-d');

        $this->info("Calculando categorías para {$mes->format('Y-m')} ({$fechaDesde} a {$fechaHasta})...");

        $categorias = Categoria::orderByDesc('valor_minimo')->get();
        if ($categorias->isEmpty()) {
            $this->error('No hay categorías configuradas en la tabla "categoria".');
            return self::FAILURE;
        }

        $medicos = Medico::whereNotNull('documento')->where('documento', '!=', '')->get(['id', 'documento']);
        $documentos = $medicos->pluck('documento')->unique()->values()->all();

        if (empty($documentos)) {
            $this->warn('No hay médicos con documento para procesar.');
            return self::SUCCESS;
        }

        $this->info(count($documentos) . ' médicos con documento, consultando Odoo en lotes de ' . self::TAMANO_LOTE . '...');

        $bar = $this->output->createProgressBar(count($documentos));
        $bar->start();

        $kpisPorDocumento = [];
        foreach (array_chunk($documentos, self::TAMANO_LOTE) as $lote) {
            $kpisPorDocumento += $odoo->getKpisGrupales($lote, $fechaDesde, $fechaHasta);
            $bar->advance(count($lote));
        }
        $bar->finish();
        $this->newLine();

        $actualizados = 0;
        foreach ($medicos as $medico) {
            $doc  = trim((string) $medico->documento);
            $kpis = $kpisPorDocumento[$doc] ?? null;

            $valorComprado  = (float) ($kpis['total_comprado'] ?? 0);
            $valorFormulado = (float) ($kpis['total_formulado'] ?? 0);
            $valorTotal     = $valorComprado + $valorFormulado;

            $categoria = $categorias->first(fn($c) => (float) $c->valor_minimo <= $valorTotal);

            MedicoCategoriaHistorial::updateOrCreate(
                ['medico_id' => $medico->id, 'mes' => $mes->format('Y-m-d')],
                [
                    'categoria_id'    => $categoria?->id,
                    'valor_comprado'  => $valorComprado,
                    'valor_formulado' => $valorFormulado,
                    'valor_total'     => $valorTotal,
                ]
            );

            $medico->update(['categoria_id' => $categoria?->id]);
            $actualizados++;
        }

        $this->info("Listo: {$actualizados} médicos actualizados para {$mes->format('Y-m')}.");

        return self::SUCCESS;
    }

    private function resolverMes(): Carbon
    {
        $mesOpcion = $this->option('mes');

        if ($mesOpcion) {
            return Carbon::createFromFormat('Y-m', $mesOpcion)->startOfMonth();
        }

        // Por defecto: el mes anterior, ya cerrado por completo — evita
        // categorizar con datos parciales de un mes que sigue en curso.
        return Carbon::now()->subMonthNoOverflow()->startOfMonth();
    }
}
