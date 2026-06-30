import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    FaArrowLeft, FaUserDoctor, FaCalendarCheck,
    FaBoxOpen, FaFileInvoiceDollar, FaPhone, FaClock, FaLocationDot, FaFlask,
} from 'react-icons/fa6';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => {
    n = n ?? 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
    return `$${fmt(n)}`;
};

const ESTADO_COLOR = {
    efectiva:        '#10b981',
    programada:      '#4184F0',
    reprogramada:    '#f59e0b',
    cancelada:       '#ef4444',
    'No contactado': '#94a3b8',
};
const ESTADO_LABEL = {
    efectiva: 'Efectiva', programada: 'Programada', reprogramada: 'Reprogramada',
    cancelada: 'Cancelada', 'No contactado': 'No contactado',
};
const PROD_COLORS = ['#3D3FD8', '#4184F0', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

// ── subcomponents ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }) {
    return (
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4"
             style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
            <p className="text-[22px] font-black text-slate-800 leading-none">{value}</p>
            {sub && <p className="text-[9px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

function EstadoBadge({ estado }) {
    const color = ESTADO_COLOR[estado] ?? '#94a3b8';
    return (
        <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full border"
              style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
            {ESTADO_LABEL[estado] ?? estado}
        </span>
    );
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

// ── page ──────────────────────────────────────────────────────────────────────
const PERIODOS = [
    { key: 'all', label: 'Todo' },
    { key: '2y',  label: '2 años' },
    { key: '1y',  label: '1 año' },
    { key: '6m',  label: '6 meses' },
    { key: '3m',  label: '3 meses' },
    { key: 'mes', label: 'Mes Actual' },

];

export default function MedicoDetalle({
    auth, medico, periodoActivo = 'all',
    txStats, tendencia, topProductos,
    porLaboratorio, todosProductos,
    visitasStats, visitas, visitadoresAsignados,
}) {
    const [tabActiva, setTabActiva] = useState('visitadores');
    const [limLab, setLimLab]       = useState(50);
    const [limProd, setLimProd]     = useState(50);
    const [busquedaProd, setBusquedaProd] = useState('');
    const [ordenProd, setOrdenProd]       = useState('valor_desc'); // 'valor_desc' | 'valor_asc' | 'alfa'

    const pieEstados = [
        { name: 'Efectivas',      value: Number(visitasStats?.efectivas      ?? 0), color: ESTADO_COLOR.efectiva },
        { name: 'Programadas',    value: Number(visitasStats?.programadas     ?? 0), color: ESTADO_COLOR.programada },
        { name: 'Reprogramadas',  value: Number(visitasStats?.reprogramadas   ?? 0), color: ESTADO_COLOR.reprogramada },
        { name: 'Canceladas',     value: Number(visitasStats?.canceladas      ?? 0), color: ESTADO_COLOR.cancelada },
        { name: 'No contactados', value: Number(visitasStats?.no_contactados  ?? 0), color: ESTADO_COLOR['No contactado'] },
    ].filter(e => e.value > 0);

    const tendenciaData = (tendencia ?? []).map(d => ({
        label:     d.mes,
        comprado:  Number(d.valor_comprado),
        formulado: Number(d.valor_formulado),
    })).slice(-12);

    const prodData = (topProductos ?? []).map(p => ({
        name:      p.nombre,
        valor:     Number(p.valor_comprado),
        formulado: Number(p.valor_formulado),
        unidades:  Number(p.unidades),
    }));

    const geoCoords = (() => {
        if (!medico.geolocalizacion) return null;
        const [lat, lng] = medico.geolocalizacion.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    })();

    return (
        <PanelAdmin user={auth?.user}>
            <Head title={`${medico.nombre} ${medico.apellido} · Detalle`} />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* ── HEADER ───────────────────────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <Link href={route('Gmedicos.index')}
                          className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition mb-3">
                        <FaArrowLeft className="text-[8px]" /> Volver a Médicos
                    </Link>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Perfil del médico</p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase">
                                {medico.nombre} {medico.apellido}
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {medico.tipo_documento?.nombre ?? 'Doc.'}: {medico.documento}
                                {medico.especialidad && (
                                    <span className="ml-2 text-blue-500 font-bold uppercase">· {medico.especialidad}</span>
                                )}
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {medico.categoria && (
                                <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 uppercase">
                                    {medico.categoria.nombre}
                                </span>
                            )}
                            <Link
    href={route('Gmedicos.alertas', medico.id)}
    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 inline-flex items-center gap-2"
>
    <FaFlask className="text-xs" /> Analizar Alertas
</Link>
                            {medico.visitador && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 uppercase">
                                    Visitador: {medico.visitador.nombre} {medico.visitador.apellido}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Info de contacto */}
                    {(medico.telefono_contacto || medico.horario_atencion || medico.direccion_detalles || geoCoords) && (
                        <div className="flex flex-wrap gap-5 mt-3 pt-3 border-t border-slate-50">
                            {medico.telefono_contacto && (
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                    <FaPhone className="text-blue-400" /> {medico.telefono_contacto}
                                </div>
                            )}
                            {medico.horario_atencion && (
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                    <FaClock className="text-amber-400" /> {medico.horario_atencion}
                                </div>
                            )}
                            {medico.direccion_detalles && (
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                    <FaLocationDot className="text-rose-400" /> {medico.direccion_detalles}
                                </div>
                            )}
                            {geoCoords && (
                                <a href={`https://www.google.com/maps?q=${geoCoords.lat},${geoCoords.lng}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-1.5 text-[9px] text-blue-500 hover:text-blue-700 font-bold transition">
                                    <FaLocationDot className="text-blue-400" />
                                    {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
                                    <span className="text-[8px] text-slate-400">(ver mapa)</span>
                                </a>
                            )}
                        </div>
                    )}

                    {/* ── SELECTOR DE PERÍODO ─────────────────────────── */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-1">Período:</p>
                        {PERIODOS.map(p => (
                            <button
                                key={p.key}
                                onClick={() => router.get(
                                    route('Gmedicos.show', medico.id),
                                    p.key !== 'all' ? { periodo: p.key } : {},
                                    { preserveScroll: true }
                                )}
                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all ${
                                    periodoActivo === p.key
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-7">

                    {/* ── KPIs ─────────────────────────────────────────── */}
                    <div className="flex gap-3">
                        <KpiCard label="Val. comprado"   value={fmtM(txStats?.total_valor_comprado)}  accent="#4184F0" />
                        <KpiCard label="Val. formulado"  value={fmtM(txStats?.total_valor_formulado)} accent="#8b5cf6" />
                        <KpiCard label="Unidades Generales"        value={fmt(txStats?.total_unidades)}          accent="#f59e0b" />
                        {/* CORREGIDO: Se cambia total_unidades_compradas por unidades_compradas (o el mapeo real del backend) */}
                        <KpiCard label="Unidades compradas" value={fmt(txStats?.unidades_compradas ?? txStats?.total_unidades_compradas)} accent="#ef4444" />
                        <KpiCard label="Unidades formuladas" value={fmt(txStats?.unidades_formuladas ?? txStats?.total_unidades_formuladas)} accent="#ec4899" />
                        <KpiCard label="Productos"       value={fmt(txStats?.total_productos)}         accent="#10b981" sub={`${txStats?.meses_activo ?? 0} meses activo`} />
                        <KpiCard label="Total visitas"   value={fmt(visitasStats?.total)}              accent="#ef4444" sub={`${visitasStats?.efectivas ?? 0} efectivas`} />
                    </div>

                    {/* ── CHARTS ───────────────────────────────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Tendencia valor */}
                        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Histórico</p>
                            <p className="text-[13px] font-black text-slate-800 mb-4">Valor comprado </p>
                            {tendenciaData.length === 0 ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px]">Sin transacciones</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <AreaChart data={tendenciaData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gcM" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#4184F0" stopOpacity={0.28} />
                                                <stop offset="95%" stopColor="#4184F0" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                                        <YAxis tickFormatter={v => fmtM(v)} tick={{ fontSize: 8, fill: '#94a3b8' }} width={52} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                        <Area type="monotone" dataKey="comprado" name="Comprado" stroke="#4184F0" fill="url(#gcM)" strokeWidth={2.5} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Pie visitas + top productos */}
                        <div className="flex flex-col gap-5">

                            {/* Pie estado visitas */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Visitas</p>
                                <p className="text-[12px] font-black text-slate-800 mb-3">Estado general</p>
                                {pieEstados.length === 0 ? (
                                    <div className="flex items-center justify-center h-24 text-slate-300 text-[11px]">Sin visitas</div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <ResponsiveContainer width={90} height={90}>
                                            <PieChart>
                                                <Pie data={pieEstados} cx="50%" cy="50%" innerRadius={28} outerRadius={42}
                                                     dataKey="value" paddingAngle={3}>
                                                    {pieEstados.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <ul className="space-y-1.5 flex-1">
                                            {pieEstados.map((e, i) => (
                                                <li key={i} className="flex items-center gap-1.5 text-[9px]">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                                                    <span className="font-bold text-slate-600 flex-1">{e.name}</span>
                                                    <span className="font-black text-slate-800">{e.value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Top productos */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Productos</p>
                                <p className="text-[12px] font-black text-slate-800 mb-1">Top por valor comprado y formulado</p>
                                <div className="flex gap-3 mb-3">
                                    <span className="flex items-center gap-1 text-[8px] font-black text-indigo-600"><span className="w-2 h-1.5 rounded-full bg-indigo-500 inline-block" /> Comprado</span>
                                    <span className="flex items-center gap-1 text-[8px] font-black text-purple-500"><span className="w-2 h-1.5 rounded-full bg-purple-500 inline-block" /> Formulado</span>
                                </div>
                                <div className="space-y-3">
                                    {prodData.map((p, i) => {
                                        const maxC = prodData[0]?.valor ?? 1;
                                        const maxF = Math.max(...prodData.map(x => x.formulado), 1);
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-[9px] font-bold text-slate-600 truncate flex-1 pr-2">{p.name}</span>
                                                    <div className="flex gap-2 shrink-0">
                                                        <span className="text-[9px] font-black text-indigo-600">{fmtM(p.valor)}</span>
                                                        <span className="text-[9px] font-black text-purple-500">{fmtM(p.formulado)}</span>
                                                    </div>
                                                </div>
                                                {/* Barra comprado */}
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-0.5">
                                                    <div className="h-full rounded-full"
                                                         style={{ width: `${(p.valor / maxC) * 100}%`, background: PROD_COLORS[i] }} />
                                                </div>
                                                {/* Barra formulado */}
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full"
                                                         style={{ width: `${(p.formulado / maxF) * 100}%`, background: '#8b5cf6' }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── TABS: Visitadores / Visitas ───────────────────── */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                        <div className="flex border-b border-slate-100">
                            {[
                                { id: 'visitadores',  label: 'Visitadores asignados',   icon: <FaUserDoctor />,    count: visitadoresAsignados?.length },
                                { id: 'laboratorios', label: 'Laboratorios y productos', icon: <FaFlask />,         count: todosProductos?.length },
                                { id: 'visitas',      label: 'Historial de visitas',     icon: <FaCalendarCheck />, count: visitas?.length },
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setTabActiva(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${
                                        tabActiva === tab.id
                                            ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}>
                                    {tab.icon} {tab.label}
                                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-black">{tab.count}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab: Visitadores */}
                        {tabActiva === 'visitadores' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-600">
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Visitador</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Total visitas</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Efectivas</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase text-center">Última visita</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(visitadoresAsignados ?? []).length === 0 ? (
                                        <tr><td colSpan={4} className="px-5 py-10 text-center text-[11px] text-slate-300 font-bold">Sin visitadores registrados</td></tr>
                                    ) : (visitadoresAsignados ?? []).map((v, i) => (
                                        <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="px-5 py-2.5 border-r border-slate-50">
                                                <p className="text-[10px] font-black text-slate-700 uppercase">{v.nombre}</p>
                                            </td>
                                            <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[10px] font-black text-slate-700">{v.total_visitas}</td>
                                            <td className="px-5 py-2.5 border-r border-slate-50 text-center">
                                                <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                    {v.efectivas}
                                                </span>
                                            </td>
                                            <td className="px-5 py-2.5 text-center text-[9px] text-slate-500">
                                                {v.ultima_visita ? new Date(v.ultima_visita).toLocaleDateString('es-CO') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Tab: Laboratorios y productos */}
                        {tabActiva === 'laboratorios' && (() => {
                            const maxLabC = Math.max(...(porLaboratorio ?? []).map(l => Number(l.valor_comprado)), 1);
                            const maxLabF = Math.max(...(porLaboratorio ?? []).map(l => Number(l.valor_formulado)), 1);
                            return (
                                <div className="p-6 space-y-6">

                                    {/* Laboratorios */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Por laboratorio</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-slate-400">Mostrar</span>
                                                <select
                                                    value={limLab}
                                                    onChange={e => setLimLab(e.target.value === 'all' ? Infinity : Number(e.target.value))}
                                                    className="text-[9px] font-black border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                >
                                                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                                    <option value="all">Todos</option>
                                                </select>
                                            </div>
                                        </div>
                                        {(porLaboratorio ?? []).length === 0 ? (
                                            <p className="text-[10px] text-slate-300 text-center py-6">Sin datos</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {(porLaboratorio ?? []).slice(0, limLab).map((lab, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <span className="text-[10px] font-black text-slate-700 uppercase">{lab.laboratorio}</span>
                                                            <div className="flex gap-4 text-right">
                                                                <span className="text-[9px] font-black text-indigo-600">{fmtM(lab.valor_comprado)}</span>
                                                                <span className="text-[9px] font-black text-purple-500">{fmtM(lab.valor_formulado)}</span>
                                                                <span className="text-[9px] text-slate-400">{fmtM(lab.unidades)} u.</span>
                                                                <span className="text-[9px] text-slate-400">{lab.total_productos} prod.</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-0.5">
                                                            <div className="h-full rounded-full bg-indigo-500"
                                                                 style={{ width: `${(Number(lab.valor_comprado) / maxLabC) * 100}%` }} />
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full bg-purple-500"
                                                                 style={{ width: `${(Number(lab.valor_formulado) / maxLabF) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex gap-4 pt-1">
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-indigo-600"><span className="w-2 h-1.5 rounded-full bg-indigo-500 inline-block" /> Comprado</span>
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-purple-500"><span className="w-2 h-1.5 rounded-full bg-purple-500 inline-block" /> Formulado</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tabla completa de productos */}
                                    <div>
                                        {/* ── Barra de herramientas ── */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Detalle por producto</p>

                                            <div className="flex flex-wrap items-center gap-2 ml-auto">
                                                {/* Buscador */}
                                                <div className="relative">
                                                    <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                                    </svg>
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar producto..."
                                                        value={busquedaProd}
                                                        onChange={e => { setBusquedaProd(e.target.value); setLimProd(50); }}
                                                        className="pl-6 pr-3 py-1 text-[9px] font-semibold border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-44 placeholder:text-slate-300"
                                                    />
                                                    {busquedaProd && (
                                                        <button
                                                            onClick={() => setBusquedaProd('')}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
                                                        >
                                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Botones de orden */}
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setOrdenProd('valor_desc')}
                                                        title="Mayor a menor valor comprado"
                                                        className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wide rounded-lg border transition-colors ${
                                                            ordenProd === 'valor_desc'
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        $ ↓ Mayor
                                                    </button>
                                                    <button
                                                        onClick={() => setOrdenProd('valor_asc')}
                                                        title="Menor a mayor valor comprado"
                                                        className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wide rounded-lg border transition-colors ${
                                                            ordenProd === 'valor_asc'
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        $ ↑ Menor
                                                    </button>
                                                    <button
                                                        onClick={() => setOrdenProd('alfa')}
                                                        title="Orden alfabético"
                                                        className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wide rounded-lg border transition-colors ${
                                                            ordenProd === 'alfa'
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        A → Z
                                                    </button>
                                                </div>

                                                {/* Mostrar N */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-slate-400">Mostrar</span>
                                                    <select
                                                        value={limProd}
                                                        onChange={e => setLimProd(e.target.value === 'all' ? Infinity : Number(e.target.value))}
                                                        className="text-[9px] font-black border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                    >
                                                        {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                                        <option value="all">Todos</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Tabla ── */}
                                        {(() => {
                                            const termino = busquedaProd.trim().toLowerCase();
                                            const filtrados = (todosProductos ?? [])
                                                .filter(p =>
                                                    !termino ||
                                                    (p.nombre ?? '').toLowerCase().includes(termino) ||
                                                    (p.codigo ?? '').toLowerCase().includes(termino) ||
                                                    (p.laboratorio ?? '').toLowerCase().includes(termino)
                                                )
                                                .slice()
                                                .sort((a, b) =>
                                                    ordenProd === 'alfa'
                                                        ? (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es', { sensitivity: 'base' })
                                                        : ordenProd === 'valor_asc'
                                                            ? Number(a.valor_comprado) - Number(b.valor_comprado)
                                                            : Number(b.valor_comprado) - Number(a.valor_comprado)
                                                );

                                            const visibles = filtrados.slice(0, limProd === Infinity ? filtrados.length : limProd);

                                            return (
                                                <>
                                                    {termino && (
                                                        <p className="text-[9px] text-slate-400 mb-2">
                                                            {filtrados.length === 0
                                                                ? 'Sin resultados para "' + busquedaProd + '"'
                                                                : `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''} para "${busquedaProd}"`
                                                            }
                                                        </p>
                                                    )}
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-blue-600">
                                                                    <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">
                                                                        Producto
                                                                        {ordenProd === 'alfa' && <span className="ml-1 opacity-60">↑A-Z</span>}
                                                                    </th>
                                                                    <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Laboratorio</th>
                                                                    <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">
                                                                        Val. comprado
                                                                        {ordenProd === 'valor' && <span className="ml-1 opacity-60">↓</span>}
                                                                    </th>
                                                                    <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">Val. formulado</th>
                                                                    <th className="px-5 py-3 text-white text-[9px] font-black uppercase text-right">Unidades Compradas</th>
                                                                    <th className="px-5 py-3 text-white text-[9px] font-black uppercase text-right">Unidades Formuladas</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {visibles.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={4} className="px-5 py-10 text-center text-[11px] text-slate-300 font-bold">
                                                                            Sin productos{termino ? ` que coincidan con "${busquedaProd}"` : ''}
                                                                        </td>
                                                                    </tr>
                                                                ) : visibles.map((p, i) => (
                                                                    <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                                                        <td className="px-5 py-2.5 border-r border-slate-50">
                                                                            <p className="text-[10px] font-black text-slate-700 uppercase">{p.nombre}</p>
                                                                            <p className="text-[9px] text-slate-400">{p.codigo}</p>
                                                                        </td>
                                                                        <td className="px-5 py-2.5 border-r border-slate-50">
                                                                            <span className="text-[9px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                                                                                {p.laboratorio ?? '—'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-2.5 border-r border-slate-50 text-right">
                                                                            <span className="text-[10px] font-black text-indigo-600">{fmtM(p.valor_comprado)}</span>
                                                                        </td>
                                                                        <td className="px-5 py-2.5 border-r border-slate-50 text-right">
                                                                            <span className="text-[10px] font-black text-purple-500">{fmtM(p.valor_formulado)}</span>
                                                                        </td>
                                                                        <td className="px-5 py-2.5 text-right text-[10px] text-slate-500 font-bold">{fmt(p.unidades)}</td>
                                                                        <td className="px-5 py-2.5 text-right text-[10px] text-slate-500 font-bold">{fmt(p.unidades_formuladas)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    {filtrados.length > visibles.length && (
                                                        <p className="text-center text-[9px] text-slate-300 mt-3 font-bold">
                                                            Mostrando {visibles.length} de {filtrados.length} productos
                                                        </p>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                </div>
                            );
                        })()}

                        {/* Tab: Visitas */}
                        {tabActiva === 'visitas' && (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-600">
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Visitador</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Estado</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Programada</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Realizada</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase">Comentarios</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(visitas ?? []).length === 0 ? (
                                        <tr><td colSpan={5} className="px-5 py-10 text-center text-[11px] text-slate-300 font-bold">Sin visitas registradas</td></tr>
                                    ) : (visitas ?? []).map((v, i) => (
                                        <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="px-5 py-2.5 border-r border-slate-50">
                                                <p className="text-[10px] font-black text-slate-700 uppercase">{v.nombre_visitador ?? '—'}</p>
                                            </td>
                                            <td className="px-5 py-2.5 border-r border-slate-50 text-center">
                                                <EstadoBadge estado={v.estado} />
                                            </td>
                                            <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[9px] text-slate-500">
                                                {v.fecha_programada ? new Date(v.fecha_programada).toLocaleDateString('es-CO') : '—'}
                                            </td>
                                            <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[9px] text-slate-500">
                                                {v.fecha_realizada ? new Date(v.fecha_realizada).toLocaleDateString('es-CO') : '—'}
                                            </td>
                                            <td className="px-5 py-2.5 text-[9px] text-slate-500 max-w-xs truncate">{v.comentarios ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                </div>
            </div>
        </PanelAdmin>
    );
}
