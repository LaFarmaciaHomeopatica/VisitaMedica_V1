<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VisitasSeeder extends Seeder
{
    public function run(): void
    {
        $estados_pasado  = ['efectiva', 'efectiva', 'efectiva', 'efectiva', 'efectiva',
                            'cancelada', 'reprogramada', 'reprogramada', 'No contactado', 'No contactado'];
        $estados_actual  = ['efectiva', 'efectiva', 'efectiva', 'programada', 'programada',
                            'programada', 'reprogramada', 'No contactado', 'cancelada', 'efectiva'];

        $comentarios = [
            'efectiva'      => ['Visita exitosa, médico receptivo', 'Se dejó muestra del producto', 'Excelente recepción', 'Médico interesado en nueva línea'],
            'cancelada'     => ['Médico no disponible', 'Agenda llena', 'Cancelado por el médico', 'Consultorio cerrado'],
            'reprogramada'  => ['Se reprogramó para la siguiente semana', 'Médico solicitó nueva cita', 'Reprogramado por conflicto de horario'],
            'No contactado' => ['No se encontró en consultorio', 'Sin respuesta', 'En cirugía durante la visita'],
            'programada'    => ['Visita agendada', 'Pendiente de realizar', 'Confirmada con secretaria'],
        ];

        $visitas = [];
        $hoy     = Carbon::now();

        $visitadores = DB::table('visitadores')->get();

        foreach ($visitadores as $visitador) {
            $medicos = DB::table('medicos')
                ->where('visitador_id', $visitador->id)
                ->pluck('id')
                ->toArray();

            if (empty($medicos)) continue;

            for ($mesesAtras = 5; $mesesAtras >= 0; $mesesAtras--) {
                $mes       = $hoy->copy()->subMonths($mesesAtras)->startOfMonth();
                $finMes    = $mes->copy()->endOfMonth();
                $esMesAct  = $mesesAtras === 0;
                $pool      = $esMesAct ? $estados_actual : $estados_pasado;

                foreach ($medicos as $medicoId) {
                    // 1-2 visitas por médico por mes
                    $numVisitas = rand(1, 2);

                    for ($v = 0; $v < $numVisitas; $v++) {
                        $estado = $pool[array_rand($pool)];

                        // Fecha programada: día laboral aleatorio del mes
                        $diasMes = (int)$finMes->format('d');
                        $dia     = rand(1, min($diasMes, $esMesAct ? (int)$hoy->format('d') : $diasMes));
                        $hora    = rand(7, 17);
                        $fechaProg = $mes->copy()->setDay($dia)->setTime($hora, 0);

                        // Fecha realizada solo si corresponde
                        $fechaReal = null;
                        if (in_array($estado, ['efectiva', 'reprogramada'])) {
                            $fechaReal = $fechaProg->copy()->addMinutes(rand(0, 30));
                        }

                        $com = $comentarios[$estado][array_rand($comentarios[$estado])];

                        $visitas[] = [
                            'medico_id'        => $medicoId,
                            'visitador_id'     => $visitador->id,
                            'fecha_programada' => $fechaProg->toDateTimeString(),
                            'fecha_realizada'  => $fechaReal?->toDateTimeString(),
                            'estado'           => $estado,
                            'comentarios'      => $com,
                            'muestras'         => $estado === 'efectiva' ? 'Muestra entregada' : null,
                            'comentario_muestra' => null,
                        ];
                    }
                }
            }
        }

        // Insertar en lotes de 500
        foreach (array_chunk($visitas, 500) as $lote) {
            DB::table('visitas')->insert($lote);
        }

        $this->command->info('✓ ' . count($visitas) . ' visitas creadas para ' . count($visitadores) . ' visitadores.');
    }
}
