import React, { useEffect, useState } from 'react';
import { FaXmark, FaFileInvoiceDollar, FaChartLine, FaBoxesStacked } from 'react-icons/fa6';
import BarraComparativa, { COLOR_COMPRADO, COLOR_FORMULADO, LeyendaCompradoFormulado } from '@/Components/BarraComparativa';

const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => {
    n = n ?? 0;
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
    return `$${fmt(n)}`;
};

const COLORS = ['#3D3FD8','#4184F0','#06b6d4','#10b981','#f59e0b'];

export default function MedicoTempStatsPanel({ medico, onClose }) {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        if (!medico) return;
        setLoading(true);
        setError(null);
        fetch(`/GmedicosTemporales/${medico.id}/estadisticas`, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => { if (!r.ok) throw new Error('Error al cargar'); return r.json(); })
            .then(d  => { setData(d); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    }, [medico]);

    if (!medico) return null;

    const kpis = data?.kpis ?? {};
    const tendencia = data?.tendencia ?? [];
    const topProductos = data?.topProductos ?? [];

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" onClick={onClose} />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-[#F0F4FA] z-50 shadow-2xl flex flex-col overflow-hidden
                            animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="bg-indigo-600 px-6 py-5 flex items-start justify-between shrink-0">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Médico Temporal · Estadísticas</p>
                        <p className="text-[17px] font-black text-white leading-tight uppercase mt-0.5">
                            {medico.nombre_referencia}
                        </p>
                        <p className="text-[10px] text-indigo-200 mt-1">
                            Doc: <span className="font-bold text-white">{medico.documento}</span>
                            <span className="ml-3 inline-block px-2 py-0.5 rounded-md bg-indigo-500 text-indigo-100 text-[8px] font-black uppercase">
                                {medico.origen_datos}
                            </span>
                        </p>
                    </div>
                    <button onClick={onClose}
                            className="mt-1 p-2 rounded-lg hover:bg-indigo-500 transition text-white">
                        <FaXmark className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {loading && (
                        <div className="flex items-center justify-center h-48 text-slate-400 text-[12px]">
                            Cargando estadísticas…
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-48 text-rose-400 text-[12px]">
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {/* KPIs */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                                    <FaFileInvoiceDollar className="text-indigo-400" /> Resumen general
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Transacciones',     value: fmt(kpis.total_transacciones), accent: '#4184F0' },
                                        { label: 'Valor comprado',    value: fmtM(kpis.valor_comprado),   accent: '#10b981' },
                                        { label: 'Valor formulado',   value: fmtM(kpis.valor_formulado),  accent: '#8b5cf6' },
                                        { label: 'Unid. compradas',   value: fmt(kpis.unidades_compradas),  accent: '#06b6d4' },
                                        { label: 'Unid. formuladas',  value: fmt(kpis.unidades_formuladas), accent: '#f59e0b' },
                                    ].map((k, i) => (
                                        <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3"
                                             style={{ borderTopColor: k.accent, borderTopWidth: 3 }}>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{k.label}</p>
                                            <p className="text-[18px] font-black text-slate-800 leading-none">{k.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tendencia por mes */}
                            {tendencia.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                                        <FaChartLine className="text-indigo-400" /> Tendencia mensual
                                    </p>
                                    {(() => {
                                        const maxV = Math.max(...tendencia.map(t => t.valor_comprado ?? 0), 1);
                                        return (
                                            <div className="space-y-2.5">
                                                {tendencia.map((t, i) => {
                                                    const pct = Math.round(((t.valor_comprado ?? 0) / maxV) * 100);
                                                    return (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black text-slate-500 w-14 shrink-0">{t.mes}</span>
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-500 rounded-full transition-all"
                                                                     style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-indigo-600 w-16 text-right shrink-0">
                                                                {fmtM(t.valor_comprado)}
                                                            </span>
                                                            <span className="text-[8px] text-slate-400 w-12 text-right shrink-0">
                                                                {fmt(t.transacciones)} tx
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Top productos */}
                            {topProductos.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                            <FaBoxesStacked className="text-indigo-400" /> Top productos
                                        </p>
                                        <LeyendaCompradoFormulado />
                                    </div>
                                    <div className="space-y-4">
                                        {topProductos.map((p, i) => (
                                                <div key={i}>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0"
                                                              style={{ background: COLORS[i] }}>{i + 1}</span>
                                                        <span className="text-[10px] font-bold text-slate-700 flex-1">{p.nombre}</span>
                                                        <span className="text-[9px] font-black text-slate-500 shrink-0">{fmt(p.unidades)} un.</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black w-16 text-right shrink-0" style={{ color: COLOR_COMPRADO }}>{fmtM(p.valor_comprado)}</span>
                                                        <BarraComparativa comprado={p.valor_comprado ?? 0} formulado={p.valor_formulado ?? 0} />
                                                        <span className="text-[9px] font-black w-16 shrink-0" style={{ color: COLOR_FORMULADO }}>{fmtM(p.valor_formulado ?? 0)}</span>
                                                    </div>
                                                </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tendencia.length === 0 && topProductos.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2">
                                    <FaFileInvoiceDollar className="text-4xl" />
                                    <p className="text-[11px] font-bold">Sin transacciones registradas</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
