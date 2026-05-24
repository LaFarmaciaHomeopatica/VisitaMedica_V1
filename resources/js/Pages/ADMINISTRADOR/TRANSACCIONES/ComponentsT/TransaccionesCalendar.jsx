import React, { useState, useMemo } from 'react';

const DAYS_HDR  = ['L','M','X','J','V','S','D'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SH = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function pad(n) { return String(n).padStart(2, '0'); }
function toStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDow(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

const SCALE = [
    { min: 0,  max: 0,  bg: '#e2e8f0', label: 'Sin datos' },
    { min: 1,  max: 3,  bg: '#bfdbfe' },
    { min: 4,  max: 7,  bg: '#60a5fa' },
    { min: 8,  max: 14, bg: '#3b82f6' },
    { min: 15, max: Infinity, bg: '#1e40af', label: 'Alta actividad' },
];

function cellBg(medicos) {
    return SCALE.find(s => medicos >= s.min && medicos <= s.max)?.bg ?? '#e2e8f0';
}

const fmt = n => new Intl.NumberFormat('es-CO').format(n ?? 0);

export default function TransaccionesCalendar({ calendarData = {}, onDayClick }) {
    const currentYear = new Date().getFullYear();

    const years = useMemo(() => {
        const set = new Set(Object.keys(calendarData).map(d => Number(d.slice(0, 4))));
        set.add(currentYear);
        return Array.from(set).sort((a, b) => b - a);
    }, [calendarData]);

    const [year,    setYear]    = useState(currentYear);
    const [tooltip, setTooltip] = useState(null);

    const yearStr    = String(year);
    const totalDias  = Object.keys(calendarData).filter(d => d.startsWith(yearStr)).length;
    const totalTxYr  = Object.entries(calendarData)
        .filter(([d]) => d.startsWith(yearStr))
        .reduce((s, [, v]) => s + v.total_tx, 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 w-full">

            {/* ── Encabezado ── */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Actividad</p>
                    <p className="text-[13px] font-black text-slate-800">Mapa de calor — registros por día</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        <span className="font-black text-blue-600">{fmt(totalDias)}</span> días con actividad ·{' '}
                        <span className="font-black text-slate-600">{fmt(totalTxYr)}</span> transacciones en {year}
                    </p>
                </div>
                <div className="flex gap-1 shrink-0">
                    {years.map(y => (
                        <button key={y} onClick={() => setYear(y)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition ${
                                    year === y
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}>
                            {y}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Grid de 12 meses ── */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-7">
                {Array.from({ length: 12 }, (_, m) => {
                    const days    = daysInMonth(year, m);
                    const offset  = firstDow(year, m);
                    const mKey    = `${yearStr}-${pad(m + 1)}`;
                    const mTx     = Object.entries(calendarData)
                        .filter(([d]) => d.startsWith(mKey))
                        .reduce((s, [, v]) => s + v.total_tx, 0);
                    const mDias   = Object.keys(calendarData).filter(d => d.startsWith(mKey)).length;

                    return (
                        <div key={m} className="min-w-0 flex flex-col gap-1">

                            {/* Cabecera del mes */}
                            <div className="flex items-baseline justify-between mb-0.5">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                    {MONTHS_ES[m]}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400">
                                    {mDias > 0 ? `${mDias} d · ${fmt(mTx)} tx` : 'sin datos'}
                                </span>
                            </div>

                            {/* Cabecera días de semana */}
                            <div className="grid grid-cols-7 mb-0.5">
                                {DAYS_HDR.map((d, i) => (
                                    <span key={i} className="text-center text-[7px] font-black text-slate-300 select-none">
                                        {d}
                                    </span>
                                ))}
                            </div>

                            {/* Celdas */}
                            <div className="grid grid-cols-7 gap-[2px]">
                                {/* Relleno inicial */}
                                {Array.from({ length: offset }).map((_, i) => (
                                    <div key={`pad-${i}`} className="aspect-square" />
                                ))}

                                {/* Días */}
                                {Array.from({ length: days }, (_, d) => {
                                    const day     = d + 1;
                                    const dateStr = toStr(year, m, day);
                                    const entry   = calendarData[dateStr];
                                    const medicos = entry?.medicos  ?? 0;
                                    const totalTx = entry?.total_tx ?? 0;

                                    return (
                                        <div
                                            key={day}
                                            className={`aspect-square rounded-[3px] transition-opacity hover:opacity-75 ${totalTx > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                                            style={{ background: cellBg(medicos) }}
                                            onClick={() => totalTx > 0 && onDayClick?.(dateStr)}
                                            onMouseEnter={e => setTooltip({ dateStr, medicos, totalTx, x: e.clientX, y: e.clientY })}
                                            onMouseMove={e  => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : t)}
                                            onMouseLeave={() => setTooltip(null)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Leyenda ── */}
            <div className="flex items-center gap-2 mt-6 flex-wrap">
                {SCALE.map((s, i) => (
                    <React.Fragment key={i}>
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.bg }} />
                        {s.label && <span className="text-[8px] font-bold text-slate-400 mr-1">{s.label}</span>}
                    </React.Fragment>
                ))}
            </div>

            {/* ── Tooltip ── */}
            {tooltip && (
                <div className="fixed z-[999] pointer-events-none"
                     style={{ left: tooltip.x + 14, top: tooltip.y - 14 }}>
                    <div className="bg-slate-800 text-white rounded-xl px-4 py-2.5 shadow-2xl min-w-[150px]">
                        <p className="text-[9px] font-bold text-slate-400 mb-1">{tooltip.dateStr}</p>
                        {tooltip.totalTx > 0 ? (
                            <>
                                <p className="text-[12px] font-black text-white leading-none">
                                    {tooltip.medicos} médico{tooltip.medicos !== 1 ? 's' : ''}
                                </p>
                                <p className="text-[9px] text-slate-400 mt-1">
                                    {fmt(tooltip.totalTx)} transacción{tooltip.totalTx !== 1 ? 'es' : ''}
                                </p>
                            </>
                        ) : (
                            <p className="text-[11px] font-bold text-slate-400">Sin registros</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
