import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { FaArrowLeft, FaUserDoctor, FaCalendarCheck, FaChartLine, FaCircleCheck, FaCircleXmark, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => {
    n = n ?? 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
    return `$${fmt(n)}`;
};

const ESTADO_COLOR = {
    efectiva:       '#10b981',
    programada:     '#4184F0',
    reprogramada:   '#f59e0b',
    cancelada:      '#ef4444',
    'No contactado':'#94a3b8',
    'sin programar':'#cbd5e1',
};
const ESTADO_LABEL = {
    efectiva: 'Efectiva', programada: 'Programada', reprogramada: 'Reprogramada',
    cancelada: 'Cancelada', 'No contactado': 'No contactado', 'sin programar': 'Sin programar',
};
const PROD_COLORS = ['#3D3FD8','#4184F0','#06b6d4','#10b981','#f59e0b'];

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4"
             style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
            <p className="text-[22px] font-black text-slate-800 leading-none">{value}</p>
            {sub && <p className="text-[9px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}


// ── barra de progreso de meta ─────────────────────────────────────────────────
function MetaBar({ label, actual, meta, color, fmt: fmtFn }) {
    const pct = meta > 0 ? Math.min(Math.round((actual / meta) * 100), 100) : 0;
    const over = meta > 0 && actual > meta;
    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-[9px] font-black uppercase text-slate-400">{label}</span>
                <span className="text-[10px] font-black text-slate-700">
                    {fmtFn ? fmtFn(actual) : fmt(actual)}
                    <span className="text-slate-400 font-bold"> / {fmtFn ? fmtFn(meta) : fmt(meta)}</span>
                </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                     style={{ width: `${pct}%`, background: over ? '#10b981' : color }} />
            </div>
            <p className="text-[9px] font-bold mt-0.5" style={{ color: over ? '#10b981' : color }}>
                {pct}% {over ? '· ¡Meta superada!' : ''}
            </p>
        </div>
    );
}

// ── tooltip ───────────────────────────────────────────────────────────────────
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

// ── badge de estado ───────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
    const color = ESTADO_COLOR[estado] ?? '#94a3b8';
    return (
        <span className="inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full border"
              style={{ color, background: `${color}18`, borderColor: `${color}40` }}>
            {ESTADO_LABEL[estado] ?? estado}
        </span>
    );
}

// ── page ──────────────────────────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function labelMes(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    return `${MESES[Number(m) - 1]} ${y}`;
}

export default function VisitadorDetalle({
    auth, visitador, visitasStats, medicos, txStats,
    topProductos, tendencia, visitas, metaActiva, progresoMeta, mesActual, totalMedicosAsignados,
}) {
    // 1. PRIMERO TODOS LOS ESTADOS DE REACT (useState)
    const [tabActiva, setTabActiva] = useState('medicos');
    const [paginaActual, setPaginaActual] = useState(1); // <-- ¡FALTABA ESTA LÍNEA!
    const [registrosPorPagina, setRegistrosPorPagina] = useState(5);

    // 2. LUEGO LAS FUNCIONES DEL COMPONENTE
    const navMes = (delta) => {
        const [y, m] = mesActual.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        const nuevo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        router.get(route('Gvisitadores.show', visitador.id), { mes: nuevo }, { preserveScroll: false });
    };
    
    // 3. POR ÚLTIMO LA LÓGICA DE CÁLCULO DE LA PAGINACIÓN
    const filasSeguras = registrosPorPagina && Number(registrosPorPagina) > 0 ? Number(registrosPorPagina) : 5; 
    const indiceUltimoRegistro = paginaActual * filasSeguras;
    const indicePrimerRegistro = indiceUltimoRegistro - filasSeguras;
    const medicosPaginados = (medicos ?? []).slice(indicePrimerRegistro, indiceUltimoRegistro);
    const totalPaginas = Math.ceil((medicos ?? []).length / filasSeguras);

    // ... aquí continúa el resto de tu código original y luego el return (...)
    // Pie de visitas por estado
    const pieEstados = [
        { name: 'Efectivas',      value: Number(visitasStats?.efectivas     ?? 0), color: ESTADO_COLOR.efectiva },
        { name: 'Programadas',    value: Number(visitasStats?.programadas    ?? 0), color: ESTADO_COLOR.programada },
        { name: 'Reprogramadas',  value: Number(visitasStats?.reprogramadas  ?? 0), color: ESTADO_COLOR.reprogramada },
        { name: 'Canceladas',     value: Number(visitasStats?.canceladas     ?? 0), color: ESTADO_COLOR.cancelada },
        { name: 'No contactados', value: Number(visitasStats?.no_contactados ?? 0), color: ESTADO_COLOR['No contactado'] },
    ].filter(e => e.value > 0);

    const tendenciaData = (tendencia ?? []).map(d => ({
        label:    d.mes,
        comprado: Number(d.valor_comprado),
        formulado:Number(d.valor_formulado),
    })).slice(-12);

    const prodData = (topProductos ?? []).map(p => ({
        name:  p.nombre,
        valor: Number(p.valor_comprado),
    }));

    return (
        <PanelAdmin user={auth?.user}>
            <Head title={`${visitador.nombre} ${visitador.apellido} · Detalle`} />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* ── HEADER ─────────────────────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <Link href={route('Gvisitadores.index')}
                          className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition mb-3">
                        <FaArrowLeft className="text-[8px]" /> Volver a Visitadores
                    </Link>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Perfil del visitador</p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase">
                                {visitador.nombre} {visitador.apellido}
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {visitador.tipo_documento?.nombre ?? 'Doc.'}: {visitador.documento}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            {/* Navegador de mes */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <button onClick={() => navMes(-1)}
                                    className="px-3 py-2.5 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all border-r border-slate-100">
                                    <FaChevronLeft className="h-3 w-3" />
                                </button>
                                <div className="relative px-5 py-2 text-center min-w-[150px]">
                                    <p className="text-[12px] font-black text-slate-800 uppercase tracking-wide leading-none">{labelMes(mesActual)}</p>
                                    <p className="text-[8px] font-bold text-blue-400 mt-0.5">Click para cambiar</p>
                                    <input type="month" value={mesActual}
                                        onChange={e => router.get(route('Gvisitadores.show', visitador.id), { mes: e.target.value })}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                                <button onClick={() => navMes(1)}
                                    className="px-3 py-2.5 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all border-l border-slate-100">
                                    <FaChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full border ${
                                visitador.estado === 'Habilitado'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-600 border-rose-200'
                            }`}>
                                {visitador.estado}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-7">

                    {/* ── KPIs ───────────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
{/* ANTES: label="Médicos visitados" value={fmt(medicos?.length ?? 0)} sub={labelMes(mesActual)} */}
    <KpiCard 
        label="Médicos asignados"  
        value={fmt(totalMedicosAsignados ?? 0)}                
        accent="#4184F0" 
        sub="Total histórico" 
    />
                     <KpiCard label="Visitas asignadas"      value={fmt(visitasStats?.total ?? 0)}            accent="#3D3FD8" sub={labelMes(mesActual)} />
                        <KpiCard label="Visitas efectivas"  value={fmt(visitasStats?.efectivas ?? 0)}        accent="#10b981" sub={labelMes(mesActual)} />
                        <KpiCard label="Programadas"        value={fmt(visitasStats?.programadas ?? 0)}      accent="#4184F0" sub={labelMes(mesActual)} />
                        <KpiCard label="Canceladas"         value={fmt(visitasStats?.canceladas ?? 0)}       accent="#ef4444" sub={labelMes(mesActual)} />
                        <KpiCard label="Valor comprado"     value={fmtM(txStats?.total_valor_comprado ?? 0)} accent="#10b981" sub="de sus médicos" />
                        <KpiCard label="Valor formulado"    value={fmtM(txStats?.total_valor_formulado ?? 0)} accent="#8b5cf6" sub="de sus médicos" />
                    </div>

                    {/* ── META ACTIVA ─────────────────────────────────── */}
                    {metaActiva ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Meta del mes</p>
                                    <p className="text-[13px] font-black text-slate-800 capitalize">{labelMes(mesActual)}</p>
                                </div>
                                {progresoMeta.valor_comprado >= metaActiva.meta_dinero ? (
                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                                        <FaCircleCheck /> Meta superada
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                                        <FaCircleXmark /> En progreso
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <MetaBar
                                    label="Valor comprado en el mes"
                                    actual={progresoMeta.valor_comprado}
                                    meta={Number(metaActiva.meta_dinero)}
                                    color="#4184F0"
                                    fmt={fmtM}
                                />
                                <MetaBar
                                    label="Visitas efectivas en el mes"
                                    actual={progresoMeta.visitas_efectivas}
                                    meta={Number(metaActiva.meta_visitas)}
                                    color="#8b5cf6"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Sin meta asignada para {labelMes(mesActual)}
                            </p>
                            <Link href={route('Gmetas.index', { mes: mesActual })}
                                className="inline-block mt-2 text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase">
                                Asignar desde /Gmetas →
                            </Link>
                        </div>
                    )}

                    {/* ── CHARTS ─────────────────────────────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Tendencia valor */}
                        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Histórico</p>
                            <p className="text-[13px] font-black text-slate-800 mb-4">Valor comprado vs formulado de sus médicos</p>
                            {tendenciaData.length === 0 ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px]">Sin transacciones</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <AreaChart data={tendenciaData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gc2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#4184F0" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#4184F0" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gf2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                                        <YAxis tickFormatter={v => fmtM(v)} tick={{ fontSize: 8, fill: '#94a3b8' }} width={52} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                        <Area type="monotone" dataKey="comprado"  name="Comprado"  stroke="#4184F0" fill="url(#gc2)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="formulado" name="Formulado" stroke="#8b5cf6" fill="url(#gf2)" strokeWidth={2} dot={false} />
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

                            {/* Top médicos */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Médicos</p>
                                <p className="text-[12px] font-black text-slate-800 mb-3">Top por visitas</p>
                                <div className="space-y-2">
                                    {(medicos ?? []).slice(0, 5).map((m, i) => {
                                        const max = medicos[0]?.total_visitas ?? 1;
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between mb-0.5">
                                                    <span className="text-[9px] font-bold text-slate-600 truncate flex-1 pr-2">{m.nombre}</span>
                                                    <div className="flex gap-2 shrink-0">
                                                        <span className="text-[9px] font-black text-slate-800">{m.total_visitas} vis.</span>
                                                        <span className="text-[9px] font-black text-emerald-600">{m.efectivas} ef.</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full"
                                                         style={{ width: `${(m.total_visitas / max) * 100}%`, background: PROD_COLORS[i] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── TABS: Médicos / Visitas ──────────────────────── */}

    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Tab header */}
        <div className="flex border-b border-slate-100 items-center justify-between pr-4 flex-wrap gap-2">
            <div className="flex">
                {[
                    { id: 'medicos', label: 'Médicos asignados', icon: <FaUserDoctor />, count: medicos?.length },
                    { id: 'visitas', label: 'Historial de visitas', icon: <FaCalendarCheck />, count: visitas?.length },
                ].map(tab => (
                    <button key={tab.id} onClick={() => { setTabActiva(tab.id); setPaginaActual(1); }}
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

            {/* Selector de registros por página (Solo visible en la pestaña de médicos) */}
          {tabActiva === 'medicos' && (
    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mr-4">
        <span>Mostrar:</span>
        <input 
            type="number"
            min="1"
            value={registrosPorPagina} 
            onChange={(e) => { 
                const valorRaw = e.target.value;
                
                // Si la caja se borra por completo, dejamos el estado vacío para que puedan escribir libremente
                if (valorRaw === '') {
                    setRegistrosPorPagina('');
                } else {
                    // Si escriben un número, lo convertimos y evitamos negativos o ceros reales
                    const valorNumerico = Math.max(1, Number(valorRaw));
                    setRegistrosPorPagina(valorNumerico);
                }
                setPaginaActual(1); // Reinicia a la página 1
            }}
            className="w-16 bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1 rounded-xl text-[10px] font-black focus:outline-none focus:border-blue-500 text-center transition-all"
            placeholder="Filas"
        />
        <span>filas</span>
    </div>
)}
        </div>

        {/* Tab: Médicos */}
        {tabActiva === 'medicos' && (
            <>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-blue-600">
                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Médico</th>
                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Especialidad</th>
                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Total visitas</th>
                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Efectivas</th>
                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase text-center">Última visita</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {medicosPaginados.length === 0 ? (
                            <tr><td colSpan={5} className="px-5 py-10 text-center text-[11px] text-slate-300 font-bold">Sin médicos asignados</td></tr>
                        ) : medicosPaginados.map((m, i) => (
                            <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-5 py-2.5 border-r border-slate-50">
                                    <p className="text-[10px] font-black text-slate-700 uppercase">{m.nombre}</p>
                                    <p className="text-[9px] text-slate-400">{m.documento}</p>
                                </td>
                                <td className="px-5 py-2.5 border-r border-slate-50 text-[10px] text-slate-500">{m.especialidad ?? '—'}</td>
                                <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[10px] font-black text-slate-700">{m.total_visitas}</td>
                                <td className="px-5 py-2.5 border-r border-slate-50 text-center">
                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">{m.efectivas}</span>
                                </td>
                                <td className="px-5 py-2.5 text-center text-[9px] text-slate-500">
                                    {m.ultima_visita ? new Date(m.ultima_visita).toLocaleDateString('es-CO') : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer de Paginación */}
                {totalPaginas > 1 && (
    <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 border-t border-slate-100">
        {/* Lado izquierdo: Información de filas */}
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Página {paginaActual} de {totalPaginas}
        </span>

        {/* Lado derecho: Control de salto manual compacto */}
        <div className="flex items-center gap-2">
            {/* Botón página anterior */}
            <button
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-all shadow-sm"
            >
                <FaChevronLeft className="w-2.5 h-2.5" />
            </button>
            
            {/* Input Manual Compacto */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Ir a:</span>
                <input
                    type="number"
                    min="1"
                    max={totalPaginas}
                    value={paginaActual === '' ? '' : paginaActual}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                            setPaginaActual(''); // Permite borrar el campo completo
                        } else {
                            // Limita el número ingresado entre 1 y el total máximo de páginas
                            const num = Math.min(totalPaginas, Math.max(1, Number(val)));
                            setPaginaActual(num);
                        }
                    }}
                    onBlur={() => {
                        // Si el usuario deja vacío y da clic afuera, regresa a la página 1 por seguridad
                        if (paginaActual === '') setPaginaActual(1);
                    }}
                    className="w-12 text-center text-[10px] font-black text-slate-700 bg-transparent focus:outline-none border-b border-transparent focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="N°"
                />
            </div>

            {/* Botón página siguiente */}
            <button
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-all shadow-sm"
            >
                <FaChevronRight className="w-2.5 h-2.5" />
            </button>
        </div>
    </div>
)}
            </>
        )}

        {/* Tab: Visitas */}
        {tabActiva === 'visitas' && (
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-blue-600">
                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Médico</th>
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
                                <p className="text-[10px] font-black text-slate-700 uppercase">{v.nombre_medico ?? '—'}</p>
                                <p className="text-[9px] text-slate-400">{v.especialidad ?? ''}</p>
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
