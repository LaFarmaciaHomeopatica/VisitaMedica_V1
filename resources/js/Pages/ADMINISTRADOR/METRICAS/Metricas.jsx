import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n));
const fmtM = n => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
    return `$${fmt(n)}`;
};

const COLORS = ['#3D3FD8', '#4184F0', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }) {
    return (
        <div className={`bg-white rounded-2xl border-t-4 border-x border-b border-slate-100 px-5 py-4 shadow-sm`}
             style={{ borderTopColor: accent }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-[22px] font-black text-slate-800 mt-1 leading-none">{value}</p>
            {sub && <p className="text-[9px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

// ── custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-[10px]">
            <p className="font-black text-slate-600 mb-1 uppercase">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-bold">
                    {p.name}: {fmt(p.value)}
                </p>
            ))}
        </div>
    );
}

// ── doctor searchbox ──────────────────────────────────────────────────────────
function MedicoSearch({ medicos, value, onChange }) {
    const [query, setQuery]   = useState('');
    const [open, setOpen]     = useState(false);
    const ref                 = useRef();

    const selected = medicos.find(m => m.documento === value);

    const filtered = useMemo(() =>
        medicos.filter(m => m.nombre.toLowerCase().includes(query.toLowerCase()) ||
                            m.documento.includes(query)),
    [medicos, query]);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const select = (doc) => { onChange(doc); setOpen(false); setQuery(''); };
    const clear  = ()    => { onChange('');  setOpen(false); setQuery(''); };

    return (
        <div ref={ref} className="relative">
            <div
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer hover:border-blue-400 transition min-w-[220px]"
            >
                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className={`text-[11px] font-bold flex-1 truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
                    {selected ? selected.nombre : 'Todos los médicos'}
                </span>
                {selected && (
                    <button onClick={(e) => { e.stopPropagation(); clear(); }}
                            className="text-slate-300 hover:text-rose-400 transition">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-50">
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar por nombre o documento..."
                            className="w-full text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400"
                        />
                    </div>
                    <ul className="max-h-52 overflow-y-auto">
                        <li onClick={clear}
                            className="px-4 py-2 text-[11px] font-bold text-slate-400 hover:bg-slate-50 cursor-pointer">
                            Todos los médicos
                        </li>
                        {filtered.length === 0 && (
                            <li className="px-4 py-3 text-[11px] text-slate-400 text-center">Sin resultados</li>
                        )}
                        {filtered.map(m => (
                            <li key={m.documento}
                                onClick={() => select(m.documento)}
                                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 transition ${value === m.documento ? 'bg-blue-50' : ''}`}>
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

// ── main page ─────────────────────────────────────────────────────────────────
const Metricas = ({ auth, filtros, stats, tendencia, topProductos, topMedicos, tabla, medicos }) => {
    const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio);
    const [fechaFin,    setFechaFin]    = useState(filtros.fecha_fin);
    const [medicoDoc,   setMedicoDoc]   = useState(filtros.medico_seleccionado || '');
    const [busquedaTabla, setBusquedaTabla] = useState('');

    const aplicar = () => {
        router.get(route('Metricas.index'), {
            fecha_inicio:     fechaInicio,
            fecha_fin:        fechaFin,
            medico_documento: medicoDoc || undefined,
        }, { preserveState: true });
    };

    // Tendencia: formato label corto
    const tendenciaData = tendencia.map(d => ({
        ...d,
        label: d.mes?.slice(0, 7),
        compradas:  Number(d.compradas),
        formuladas: Number(d.formuladas),
    }));

    // Pie: top productos por valor comprado y formulado
    const pieData = topProductos.map((p, i) => ({
        name:  p.nombre ?? p.producto_codigo,
        value: Number(p.valor_comprado),
        color: COLORS[i % COLORS.length],
    }));
    const pieDataForm = topProductos.map((p, i) => ({
        name:  p.nombre ?? p.producto_codigo,
        value: Number(p.valor_formulado),
        color: COLORS[i % COLORS.length],
    }));

    // Top médicos
    const medicosData = topMedicos.slice(0, 8).map(m => ({
        name:      m.nombre.length > 20 ? m.nombre.slice(0, 18) + '…' : m.nombre,
        compradas: m.compradas,
        formuladas:m.formuladas,
    }));


    // Tabla filtrada
    const tablaFiltrada = useMemo(() => {
        const t = busquedaTabla.toLowerCase();
        if (!t) return tabla;
        return tabla.filter(r =>
            r.nombre_medico?.toLowerCase().includes(t) ||
            r.nombre_producto?.toLowerCase().includes(t) ||
            r.medico_documento?.includes(t) ||
            r.producto_codigo?.toLowerCase().includes(t)
        );
    }, [tabla, busquedaTabla]);

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Métricas" />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* ── HEADER ─────────────────────────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap items-end gap-4 sticky top-[80px] z-40 shadow-sm">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Panel analítico</p>
                        <h1 className="text-[18px] font-black text-slate-800 leading-none">Métricas de Desempeño</h1>
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Desde</p>
                            <input type="date" value={fechaInicio}
                                onChange={e => setFechaInicio(e.target.value)}
                                className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Hasta</p>
                            <input type="date" value={fechaFin}
                                onChange={e => setFechaFin(e.target.value)}
                                className="text-[11px] font-bold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-400" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Médico</p>
                            <MedicoSearch medicos={medicos} value={medicoDoc} onChange={setMedicoDoc} />
                        </div>
                        <button onClick={aplicar}
                            className="bg-[#3D3FD8] hover:bg-[#2d2fb8] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-sm">
                            Aplicar
                        </button>
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-7">

                    {/* ── KPI CARDS ──────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
                        <KpiCard label="Transacciones"    value={fmt(stats.total_transacciones)} accent="#4184F0" />
                        <KpiCard label="Médicos activos"  value={fmt(stats.medicos_activos)}     accent="#3D3FD8" />
                        <KpiCard label="Un. Compradas"    value={fmt(stats.compradas)}           accent="#06b6d4" />
                        <KpiCard label="Un. Formuladas"   value={fmt(stats.formuladas)}          accent="#8b5cf6" />
                        <KpiCard label="Valor comprado"   value={fmtM(stats.valor_comprado)}     accent="#10b981" />
                        <KpiCard label="Valor formulado"  value={fmtM(stats.valor_formulado)}    accent="#f59e0b" />
                    </div>

                    {/* ── FILA 1: Tendencia + Pie ─────────────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Tendencia mensual */}
                        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Tendencia mensual</p>
                            <p className="text-[13px] font-black text-slate-800 mb-4">Unidades compradas vs formuladas</p>
                            {tendenciaData.length === 0 ? (
                                <div className="flex items-center justify-center h-56 text-slate-300 text-[11px]">Sin datos en el período seleccionado</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={tendenciaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#4184F0" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#4184F0" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gForm" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                        <Area type="monotone" dataKey="compradas"  name="Compradas"
                                            stroke="#4184F0" fill="url(#gComp)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="formuladas" name="Formuladas"
                                            stroke="#8b5cf6" fill="url(#gForm)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Distribución valor por producto */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Distribución</p>
                            <p className="text-[13px] font-black text-slate-800 mb-4">Valor por producto</p>
                            {pieData.length === 0 ? (
                                <div className="flex items-center justify-center h-56 text-slate-300 text-[11px]">Sin datos</div>
                            ) : (
                                <>
                                    {/* Dos donuts lado a lado */}
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-center text-emerald-600 uppercase tracking-wider mb-1">Comprado</p>
                                            <ResponsiveContainer width="100%" height={140}>
                                                <PieChart>
                                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={58}
                                                        dataKey="value" paddingAngle={2}>
                                                        {pieData.map((_, i) => (
                                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(v) => fmtM(v)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-center text-purple-600 uppercase tracking-wider mb-1">Formulado</p>
                                            <ResponsiveContainer width="100%" height={140}>
                                                <PieChart>
                                                    <Pie data={pieDataForm} cx="50%" cy="50%" innerRadius={36} outerRadius={58}
                                                        dataKey="value" paddingAngle={2}>
                                                        {pieDataForm.map((_, i) => (
                                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(v) => fmtM(v)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    {/* Leyenda compartida */}
                                    <ul className="mt-3 space-y-1.5">
                                        {pieData.map((p, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[10px]">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                                                <span className="font-bold text-slate-600 truncate flex-1">{p.name}</span>
                                                <span className="font-black text-emerald-600">{fmtM(p.value)}</span>
                                                <span className="text-slate-300 text-[8px]">|</span>
                                                <span className="font-black text-purple-600">{fmtM(pieDataForm[i]?.value ?? 0)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── FILA 2: Top médicos (ancho completo) ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Ranking</p>
                        <p className="text-[13px] font-black text-slate-800 mb-4">Top médicos por unidades</p>
                        {medicosData.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-slate-300 text-[11px]">Sin datos</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={medicosData.length * 38 + 20}>
                                <BarChart data={medicosData} layout="vertical"
                                    margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                    <YAxis type="category" dataKey="name" width={160}
                                        tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                    <Bar dataKey="compradas"  name="Compradas"  fill="#4184F0" radius={[0, 4, 4, 0]} barSize={10} />
                                    <Bar dataKey="formuladas" name="Formuladas" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={10} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* ── TABLA DESGLOSE ──────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Detalle</p>
                                <p className="text-[13px] font-black text-slate-800">Desglose por médico y producto</p>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Buscar médico o producto..."
                                    value={busquedaTabla}
                                    onChange={e => setBusquedaTabla(e.target.value)}
                                    className="bg-transparent text-[11px] font-bold text-slate-700 placeholder-slate-300 focus:outline-none w-52"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-600">
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase tracking-wider border-r border-blue-500">Médico</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase tracking-wider border-r border-blue-500">Producto</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase tracking-wider border-r border-blue-500 text-center">Últ. fecha</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase tracking-wider border-r border-blue-500 text-center">U. Compradas</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase tracking-wider border-r border-blue-500 text-center">U. Formuladas</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase tracking-wider border-r border-blue-500 text-center">Valor Comprado</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase tracking-wider text-center">Valor Formulado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tablaFiltrada.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-10 text-center text-[11px] text-slate-300 font-bold">
                                                {busquedaTabla ? 'Sin resultados para la búsqueda' : 'Sin datos en el período seleccionado'}
                                            </td>
                                        </tr>
                                    ) : tablaFiltrada.map((row, i) => {
                                        return (
                                            <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-5 py-2.5 border-r border-slate-50">
                                                    <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{row.nombre_medico}</p>
                                                    <p className="text-[9px] text-slate-400">{row.medico_documento}</p>
                                                </td>
                                                <td className="px-5 py-2.5 border-r border-slate-50">
                                                    <p className="text-[10px] font-bold text-slate-600">{row.nombre_producto}</p>
                                                    <p className="text-[9px] text-slate-400">{row.producto_codigo}</p>
                                                </td>
                                                <td className="px-5 py-2.5 border-r border-slate-50 text-center">
                                                    <span className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded">
                                                        {row.ultima_fecha}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[10px] font-black text-slate-700">
                                                    {fmt(row.compradas)}
                                                </td>
                                                <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[10px] font-black text-slate-700">
                                                    {fmt(row.formuladas)}
                                                </td>
                                                <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[10px] font-black text-emerald-600">
                                                    {fmtM(row.valor_comprado)}
                                                </td>
                                                <td className="px-5 py-2.5 text-center text-[10px] font-black text-purple-600">
                                                    {fmtM(row.valor_formulado)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50">
                            <p className="text-[9px] font-bold text-slate-400">
                                {tablaFiltrada.length} de {tabla.length} registros
                                {busquedaTabla && ' · filtrados'}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </PanelAdmin>
    );
};

export default Metricas;
