import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { FaArrowRight, FaRotate } from 'react-icons/fa6';
import BarraComparativa, { COLOR_COMPRADO, COLOR_FORMULADO, LeyendaCompradoFormulado } from '@/Components/BarraComparativa';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
// Valor completo en pesos, sin abreviar a K/M/B.
const fmtM = n => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n ?? 0);

const COLORS_ESTADO = {
    efectiva: '#10b981', programada: '#4184F0', reprogramada: '#f59e0b',
    cancelada: '#ef4444', 'No contactado': '#94a3b8', 'sin programar': '#cbd5e1',
};

// ── components ────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent, href }) {
    const inner = (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4
                        hover:shadow-md transition-shadow flex items-start gap-3 h-full"
             style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            {icon && (
                <div className="mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                     style={{ background: `${accent}18` }}>
                    <span style={{ color: accent }} className="text-[14px]">{icon}</span>
                </div>
            )}
            <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
                <p className="text-[20px] font-black text-slate-800 leading-none break-words">{value}</p>
                {sub && <p className="text-[9px] text-slate-400 mt-1">{sub}</p>}
            </div>
            {href && <FaArrowRight className="ml-auto mt-1 text-slate-200 text-[10px] shrink-0" />}
        </div>
    );
    return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-[10px]">
            <p className="font-black text-slate-500 mb-1 uppercase">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-bold">
                    {p.name}: {p.value >= 1000 ? fmtM(p.value) : fmt(p.value)}
                </p>
            ))}
        </div>
    );
}

function SectionHeader({ label, title }) {
    return (
        <div className="mb-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-[13px] font-black text-slate-800">{title}</p>
        </div>
    );
}

function MedicoSearch({ medicos, value, onChange }) {
    const [query, setQuery] = useState('');
    const [open, setOpen]   = useState(false);
    const ref = useRef();

    const selected = medicos.find(m => String(m.documento) === String(value));
    const filtered = useMemo(() => {
        const term = query.toLowerCase();
        return medicos.filter(m =>
            (m.nombre    ?? '').toLowerCase().includes(term) ||
            String(m.documento ?? '').toLowerCase().includes(term)
        );
    }, [medicos, query]);

    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = doc => { onChange(String(doc)); setOpen(false); setQuery(''); };
    const clear  = ()   => { onChange('');  setOpen(false); setQuery(''); };

    return (
        <div ref={ref} className="relative">
            <div onClick={() => setOpen(o => !o)}
                 className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer hover:border-blue-400 transition min-w-[220px]">
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className={`text-[11px] font-bold flex-1 truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
                    {selected ? selected.nombre : 'Todos los médicos'}
                </span>
                {selected && (
                    <button onClick={e => { e.stopPropagation(); clear(); }} className="text-slate-300 hover:text-rose-400 transition">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-50">
                        <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
                               placeholder="Nombre o documento..."
                               className="w-full text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400" />
                    </div>
                    <ul className="max-h-52 overflow-y-auto">
                        <li onClick={clear} className="px-4 py-2 text-[11px] font-bold text-slate-400 hover:bg-slate-50 cursor-pointer">
                            Todos los médicos
                        </li>
                        {filtered.length === 0 && (
                            <li className="px-4 py-3 text-[11px] text-slate-400 text-center">Sin resultados</li>
                        )}
                        {filtered.map(m => (
                            <li key={m.documento} onClick={() => select(m.documento)}
                                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 transition ${String(value) === String(m.documento) ? 'bg-blue-50' : ''}`}>
                                <p className="text-[11px] font-black text-slate-700 uppercase">{m.nombre}</p>
                                <p className="text-[9px] text-slate-400">{m.documento}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function Ginicio({
    auth, statsLocales, stats, tendencia, topProductos, topMedicos = [],
    visitadoresResumen, visitadoresAnalisis, visitasPorEstado,
    filtros, medicos = [],
}) {
    const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio);
    const [fechaFin,    setFechaFin]    = useState(filtros.fecha_fin);
    const [medicoDoc,   setMedicoDoc]   = useState(filtros.medico_seleccionado || '');
    const [actualizando, setActualizando] = useState(false);
    const [limProductos, setLimProductos] = useState(10);
    const [limMedicos,   setLimMedicos]   = useState(10);

    const isFirstRender = useRef(true);
    const timerRef      = useRef(null);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            router.get(route('Ginicio'), {
                fecha_inicio:     fechaInicio,
                fecha_fin:        fechaFin,
                medico_documento: medicoDoc || undefined,
            }, { preserveState: true });
        }, 500);
    }, [fechaInicio, fechaFin, medicoDoc]);

    // ── Datos que vienen de Odoo (lentos): llegan por Inertia::lazy, se
    // piden aparte para no bloquear el render inicial (conteos locales y
    // filtros ya llegaron con la carga normal). Si el controller ya los
    // mandó (stats truthy), no se vuelven a pedir.
    const odooLoading = !stats;

    useEffect(() => {
        if (stats) return; // ya llegaron
        router.reload({ only: ['stats', 'tendencia', 'topProductos', 'topMedicos', 'visitadoresAnalisis'] });
    }, [stats, fechaInicio, fechaFin, medicoDoc]);

    const limpiar = () => {
        clearTimeout(timerRef.current);
        router.get(route('Ginicio'));
    };

    const actualizar = () => {
        setActualizando(true);
        router.post(route('Ginicio.actualizar'), { medico_documento: medicoDoc || undefined }, {
            preserveScroll: true,
            onFinish: () => setActualizando(false),
        });
    };

    const statsCombinado = { ...statsLocales, ...(stats ?? {}) };

    const ticketPromedio = (statsCombinado.total_transacciones ?? 0) > 0
        ? (statsCombinado.valor_comprado / statsCombinado.total_transacciones) : 0;
    const tendenciaData = (tendencia ?? []).map(d => ({
        label:    d.mes?.slice(0, 7),
        comprado: Number(d.valor_comprado),
        formulado:Number(d.valor_formulado),
    }));

    const pieVisitas = (visitasPorEstado ?? []).map(v => ({
        name:  v.estado,
        value: Number(v.total),
        color: COLORS_ESTADO[v.estado] ?? '#94a3b8',
    }));

    const productosData = (topProductos ?? []).slice(0, limProductos === Infinity ? undefined : limProductos);
    const medicosData = (topMedicos ?? []).slice(0, limMedicos === Infinity ? undefined : limMedicos);
    const visitadoresAnalisisData = visitadoresAnalisis ?? [];


    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Panel de Control" />

            <div className="w-full min-h-screen bg-white pb-12">

                {/* ── ENCABEZADO / FILTROS ───────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap items-end gap-4 sticky top-14 z-40 shadow-sm">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visión global</p>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[18px] font-black text-slate-800 leading-none">Panel de Control</h1>
                            {(odooLoading || actualizando) && (
                                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full animate-pulse">
                                    <FaRotate className="animate-spin text-[9px]" />
                                    Consultando datos de Odoo...
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Desde</p>
                            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                                   className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Hasta</p>
                            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                                   className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Médico</p>
                            <MedicoSearch medicos={medicos} value={medicoDoc} onChange={setMedicoDoc} />
                        </div>
                        <button onClick={limpiar}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition">
                            Limpiar
                        </button>
                        <button onClick={actualizar} disabled={actualizando}
                                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition disabled:opacity-50">
                            <FaRotate className={actualizando ? 'animate-spin' : ''} />
                            {actualizando ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-7">

                    {/* ── KPI CARDS ────────────────────────────────── */}
                    <div className="grid grid-cols-2 xl:grid-cols-8 gap-3">
                        <KpiCard label="Visitadores"     value={fmt(statsCombinado.visitadores)}         accent="#4184F0" href="/Gvisitadores" />
                        <KpiCard label="Médicos"         value={fmt(statsCombinado.medicos)}             accent="#3D3FD8" href="/Gmedicos" />
                        <KpiCard label="Méd. Temporales" value={fmt(statsCombinado.medicos_temporales)}  accent="#f59e0b" href="/GmedicosTemporales" />
                        <KpiCard label="unidades compradas" value={odooLoading ? '…' : fmt(statsCombinado.unidades_compradas)} accent="#ef4444" />
                        <KpiCard label="unidades formuladas" value={odooLoading ? '…' : fmt(statsCombinado.unidades_formuladas)} accent="#ec4899" />
                        <KpiCard label="Ticket Promedio" value={odooLoading ? '…' : fmtM(ticketPromedio)} sub="por transacción" accent="#06b6d4" />
                        <KpiCard label="Valor Comprado"  value={odooLoading ? '…' : fmtM(statsCombinado.valor_comprado)}  sub={odooLoading ? '' : `${fmt(statsCombinado.unidades_compradas)} un.`} accent="#10b981" />
                        <KpiCard label="Valor Formulado" value={odooLoading ? '…' : fmtM(statsCombinado.valor_formulado)} sub={odooLoading ? '' : `${fmt(statsCombinado.unidades_formuladas)} un.`} accent="#8b5cf6" />
                    </div>

                    {/* ── FILA 1: Tendencia + Visitas ──────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <SectionHeader label="Histórico" title="Tendencia de valor en el período" />
                            {odooLoading ? (
                                <div className="flex items-center justify-center h-56 text-slate-300 text-[11px] animate-pulse">Cargando datos de Odoo...</div>
                            ) : tendenciaData.length === 0 ? (
                                <div className="flex items-center justify-center h-56 text-slate-300 text-[11px]">Sin datos</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={tendenciaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#4184F0" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4184F0" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                                        <YAxis tickFormatter={v => fmtM(v)} tick={{ fontSize: 8, fill: '#94a3b8' }} width={55} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                        <Area type="monotone" dataKey="comprado"  name="Comprado"  stroke="#4184F0" fill="url(#gc)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="formulado" name="Formulado" stroke="#8b5cf6" fill="url(#gf)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <SectionHeader label="Visitas" title="Estado de visitas en el período" />
                            {pieVisitas.length === 0 ? (
                                <div className="flex items-center justify-center h-40 text-slate-300 text-[11px]">Sin datos</div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie data={pieVisitas} cx="50%" cy="50%" innerRadius={44} outerRadius={68}
                                                 dataKey="value" paddingAngle={3}>
                                                {pieVisitas.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <Tooltip formatter={v => fmt(v)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <ul className="mt-3 space-y-2">
                                        {pieVisitas.map((e, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[10px]">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                                                <span className="font-bold text-slate-600 capitalize flex-1">{e.name}</span>
                                                <span className="font-black text-slate-800">{fmt(e.value)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── FILA 2: Top productos + Top médicos ──────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* Top productos */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <SectionHeader label="Productos · período" title="Top productos por valor" />
                                <div className="flex items-center gap-3">
                                    <LeyendaCompradoFormulado />
                                    <span className="text-[9px] text-slate-400">Mostrar</span>
                                    <select
                                        value={limProductos}
                                        onChange={e => setLimProductos(e.target.value === 'all' ? Infinity : Number(e.target.value))}
                                        className="text-[9px] font-black border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    >
                                        {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                        <option value="all">Todos</option>
                                    </select>
                                </div>
                            </div>
                            {odooLoading ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px] animate-pulse">Cargando datos de Odoo...</div>
                            ) : (topProductos?.length === 0) ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px]">Sin datos</div>
                            ) : (
                                    <div className="space-y-4">
                                        {productosData.map((p, i) => (
                                                <div key={i}>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 bg-slate-400">{i + 1}</span>
                                                        <span className="text-[10px] font-bold text-slate-700 flex-1 truncate">
                                                            {p.nombre}
                                                            {p.codigo && (
                                                                <span className="text-slate-400 font-medium"> ({p.codigo})</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black w-16 text-right shrink-0" style={{ color: COLOR_COMPRADO }}>{fmtM(p.valor_comprado)}</span>
                                                        <BarraComparativa comprado={p.valor_comprado} formulado={p.valor_formulado ?? 0} />
                                                        <span className="text-[9px] font-black w-16 shrink-0" style={{ color: COLOR_FORMULADO }}>{fmtM(p.valor_formulado ?? 0)}</span>
                                                    </div>
                                                </div>
                                        ))}
                                    </div>
                                )}
                        </div>

                        {/* Top médicos */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <SectionHeader label="Ranking" title="Top médicos por unidades" />
                                <div className="flex items-center gap-3">
                                    <LeyendaCompradoFormulado />
                                    <span className="text-[9px] text-slate-400">Mostrar</span>
                                    <select
                                        value={limMedicos}
                                        onChange={e => setLimMedicos(e.target.value === 'all' ? Infinity : Number(e.target.value))}
                                        className="text-[9px] font-black border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    >
                                        {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                        <option value="all">Todos</option>
                                    </select>
                                </div>
                            </div>
                            {odooLoading ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px] animate-pulse">Cargando datos de Odoo...</div>
                            ) : medicosData.length === 0 ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px]">Sin datos</div>
                            ) : (
                                    <div className="space-y-4">
                                        {medicosData.map((m, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <span className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 bg-slate-400">
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-slate-700 uppercase leading-tight mb-1.5">{m.nombre}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black w-10 text-right shrink-0" style={{ color: COLOR_COMPRADO }}>{fmt(m.compradas)}</span>
                                                        <BarraComparativa comprado={m.compradas} formulado={m.formuladas} />
                                                        <span className="text-[9px] font-black w-10 shrink-0" style={{ color: COLOR_FORMULADO }}>{fmt(m.formuladas)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* ── ANÁLISIS VISITADORES ──────────────────────── */}
                    {odooLoading ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <SectionHeader label="Equipo" title="Ranking de visitadores por valor generado" />
                            <div className="flex items-center justify-center h-32 text-slate-300 text-[11px] animate-pulse">Cargando datos de Odoo...</div>
                        </div>
                    ) : visitadoresAnalisisData.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <SectionHeader label="Equipo" title="Ranking de visitadores por valor generado" />
                                    <LeyendaCompradoFormulado />
                                </div>
                                <div className="space-y-5">
                                    {visitadoresAnalisisData.map((v, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <span className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 bg-slate-400">
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <p className="text-[11px] font-black text-slate-700 uppercase leading-none">{v.nombre}</p>
                                                        <span className="text-[9px] text-slate-400 font-bold">{v.medicos_activos} méd. · {v.total_visitas} visitas</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black w-16 text-right shrink-0" style={{ color: COLOR_COMPRADO }}>{fmtM(v.valor_comprado)}</span>
                                                        <BarraComparativa comprado={v.valor_comprado} formulado={v.valor_formulado} />
                                                        <span className="text-[9px] font-black w-16 shrink-0" style={{ color: COLOR_FORMULADO }}>{fmtM(v.valor_formulado)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                    ))}
                                </div>
                            </div>
                    )}

                </div>
            </div>
        </PanelAdmin>
    );
}
