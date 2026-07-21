import React from 'react';
import { FaCalendarCheck } from 'react-icons/fa6';

const ESTADO_COLOR = {
    efectiva:        '#10b981',
    programada:      '#1C85E8',
    reprogramada:    '#f59e0b',
    cancelada:       '#ef4444',
    'No contactado': '#94a3b8',
};
const ESTADO_LABEL = {
    efectiva: 'Efectiva', programada: 'Programada', reprogramada: 'Reprogramada',
    cancelada: 'Cancelada', 'No contactado': 'No contactado',
};

const fmtFecha = (f) => {
    if (!f) return '—';
    const d = new Date(f.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return f;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Mis visitas a este médico (dato local, siempre disponible al instante) ──
const HistorialVisitas = ({ visitas = [] }) => {
    if (visitas.length === 0) return null;

    return (
        <div className="bg-white/90 rounded-[22px] border border-white/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-100">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#1C85E8] bg-blue-50 border border-blue-100">
                    <FaCalendarCheck size={14} />
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1C85E8]">
                        Mis visitas a este médico
                    </p>
                    <p className="text-xs font-black text-gray-700">
                        {visitas.length} registrada{visitas.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="divide-y divide-gray-100/80 max-h-72 overflow-y-auto">
                {visitas.map((v) => {
                    const color = ESTADO_COLOR[v.estado] ?? '#94a3b8';
                    const label = ESTADO_LABEL[v.estado] ?? v.estado;
                    return (
                        <div key={v.id} className="px-4 py-3 flex items-start gap-3">
                            <div className="flex flex-col items-center shrink-0 min-w-[70px] pt-0.5">
                                <span className="text-[10px] font-black text-gray-600">
                                    {fmtFecha(v.fecha_programada)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                        className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border"
                                        style={{ color, background: `${color}18`, borderColor: `${color}40` }}
                                    >
                                        {label}
                                    </span>
                                    {v.muestras && (
                                        <span className="text-[9px] text-gray-400 font-bold truncate">
                                            {v.muestras}
                                        </span>
                                    )}
                                </div>
                                {v.comentarios && (
                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                                        {v.comentarios}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HistorialVisitas;
