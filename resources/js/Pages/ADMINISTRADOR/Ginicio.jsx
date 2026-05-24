import React, { useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    FaUsers, FaUserDoctor, FaUserClock, FaFileInvoiceDollar,
    FaArrowRight, FaChartLine, FaCalendarCheck,
    FaChevronLeft, FaChevronRight, FaCalendar,
} from 'react-icons/fa6';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const labelMes = ym => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    return `${MESES[parseInt(m, 10) - 1]} ${y}`;
};

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => {
    n = n ?? 0;
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
    return `$${fmt(n)}`;
};

const COLORS_ESTADO = {
    efectiva:       '#10b981',
    programada:     '#4184F0',
    reprogramada:   '#f59e0b',
    cancelada:      '#ef4444',
    'No contactado':'#94a3b8',
    'sin programar':'#cbd5e1',
};
const PROD_COLORS = ['#3D3FD8','#4184F0','#06b6d4','#10b981','#f59e0b'];

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent, href }) {
    const inner = (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4
                        hover:shadow-md transition-shadow flex items-start gap-4 h-full"
             style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: `${accent}18` }}>
                <span style={{ color: accent }} className="text-[15px]">{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
                <p className="text-[22px] font-black text-slate-800 leading-none">{value}</p>
                {sub && <p className="text-[9px] text-slate-400 mt-1">{sub}</p>}
            </div>
            {href && <FaArrowRight className="ml-auto mt-1 text-slate-200 text-[11px] shrink-0" />}
        </div>
    );
    return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
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

// ── sección header ────────────────────────────────────────────────────────────
function SectionHeader({ label, title }) {
    return (
        <div className="mb-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-[13px] font-black text-slate-800">{title}</p>
        </div>
    );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function Ginicio({
    auth, stats, tendencia, topProductos,
    visitadoresResumen, visitasPorEstado, ultimasTransacciones,
    mesActual,
}) {
    const inputRef = useRef(null);

    const navMes = delta => {
        const [y, m] = (mesActual ?? '').split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        const nuevo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        router.get(route('Ginicio'), { mes: nuevo }, { preserveScroll: false });
    };
    // Tendencia: label corto por mes
    const tendenciaData = (tendencia ?? []).map(d => ({
        label: d.mes?.slice(0, 7),
        comprado:  Number(d.valor_comprado),
        formulado: Number(d.valor_formulado),
    }));

    // Pie de visitas
    const pieVisitas = (visitasPorEstado ?? []).map(v => ({
        name:  v.estado,
        value: Number(v.total),
        color: COLORS_ESTADO[v.estado] ?? '#94a3b8',
    }));

    // Visitadores para barras
    const visitadoresData = (visitadoresResumen ?? []).map(v => ({
        name:       `${v.nombre} ${v.apellido}`.slice(0, 18),
        efectivas:  Number(v.efectivas),
        programadas:Number(v.programadas),
        canceladas: Number(v.canceladas),
    }));

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Panel de Control" />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* ── ENCABEZADO ─────────────────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between gap-4 shadow-sm">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Visión global</p>
                        <h1 className="text-[18px] font-black text-slate-800 leading-none">Panel de Control</h1>
                    </div>

                    {/* Navegador de mes */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm">
                        <button onClick={() => navMes(-1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-500 hover:text-blue-600 shadow-sm">
                            <FaChevronLeft className="text-[10px]" />
                        </button>

                        <div className="relative cursor-pointer" onClick={() => inputRef.current?.showPicker?.()}>
                            <div className="flex items-center gap-2 px-3">
                                <FaCalendar className="text-[#4184F0] text-[12px]" />
                                <span className="text-[12px] font-black text-slate-700 capitalize whitespace-nowrap">
                                    {labelMes(mesActual)}
                                </span>
                            </div>
                            <input
                                ref={inputRef}
                                type="month"
                                value={mesActual ?? ''}
                                onChange={e => router.get(route('Ginicio'), { mes: e.target.value }, { preserveScroll: false })}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            />
                        </div>

                        <button onClick={() => navMes(1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-slate-500 hover:text-blue-600 shadow-sm">
                            <FaChevronRight className="text-[10px]" />
                        </button>
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-7">

                    {/* ── KPI CARDS ──────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                        <KpiCard icon={<FaUsers />}          label="Visitadores"       value={fmt(stats?.visitadores)}        accent="#4184F0" href="/Gvisitadores" />
                        <KpiCard icon={<FaUserDoctor />}     label="Médicos"            value={fmt(stats?.medicos)}            accent="#3D3FD8" href="/Gmedicos" />
                        <KpiCard icon={<FaUserClock />}      label="Méd. Temporales"    value={fmt(stats?.medicos_temporales)} accent="#f59e0b" href="/GmedicosTemporales" />
                        <KpiCard icon={<FaCalendarCheck />}  label="Médicos con Tx"     value={fmt(stats?.medicos_con_tx)}    accent="#06b6d4" />
                        <KpiCard icon={<FaFileInvoiceDollar />} label="Tx del mes"      value={fmt(stats?.transacciones_mes)} accent="#8b5cf6" href="/Gtransacciones" />
                        <KpiCard icon={<FaChartLine />}      label="Un. Compradas"      value={fmt(stats?.unidades_compradas)} accent="#10b981" />
                        <KpiCard label="Valor Comprado"  value={fmtM(stats?.valor_comprado_mes)}  sub={labelMes(mesActual)} accent="#10b981" />
                        <KpiCard label="Valor Formulado" value={fmtM(stats?.valor_formulado_mes)} sub={labelMes(mesActual)} accent="#8b5cf6" />
                    </div>

                    {/* ── FILA 1: Tendencia + Visitas ─────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Tendencia de valor 7 meses */}
                        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <SectionHeader label="Histórico" title="Tendencia de valor — todos los meses" />
                            {tendenciaData.length === 0 ? (
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

                        {/* Visitas por estado */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <SectionHeader label="Visitas" title="Estado de todas las visitas" />
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

                    {/* ── FILA 2: Top productos + Visitadores ─────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* Top productos del mes */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <SectionHeader label={`Productos · ${labelMes(mesActual)}`} title="Top productos por valor comprado" />
                            {topProductos?.length === 0 ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px]">Sin datos este mes</div>
                            ) : (
                                <div className="space-y-3">
                                    {(topProductos ?? []).map((p, i) => {
                                        const max = topProductos[0]?.valor_comprado ?? 1;
                                        const pct = Math.round((p.valor_comprado / max) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                                                              style={{ background: PROD_COLORS[i] }}>
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-700">{p.nombre}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-800">{fmtM(p.valor_comprado)}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all"
                                                         style={{ width: `${pct}%`, background: PROD_COLORS[i] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Visitadores: visitas por estado */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <SectionHeader label="Equipo" title="Visitas por visitador" />
                            {visitadoresData.length === 0 ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px]">Sin datos</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={visitadoresData.length * 52 + 20}>
                                    <BarChart data={visitadoresData} layout="vertical"
                                        margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" width={120}
                                            tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                        <Bar dataKey="efectivas"   name="Efectivas"   fill="#10b981" radius={[0,4,4,0]} barSize={10} />
                                        <Bar dataKey="programadas" name="Programadas" fill="#4184F0" radius={[0,4,4,0]} barSize={10} />
                                        <Bar dataKey="canceladas"  name="Canceladas"  fill="#ef4444" radius={[0,4,4,0]} barSize={10} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* ── FILA 3: Últimas transacciones + Accesos ─── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Últimas transacciones */}
                        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Actividad reciente</p>
                                    <p className="text-[13px] font-black text-slate-800">Últimas transacciones</p>
                                </div>
                                <Link href="/Gtransacciones"
                                    className="text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1">
                                    Ver todas <FaArrowRight className="text-[8px]" />
                                </Link>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-5 py-2.5 text-[9px] font-black uppercase text-slate-400">Médico</th>
                                        <th className="px-5 py-2.5 text-[9px] font-black uppercase text-slate-400">Producto</th>
                                        <th className="px-5 py-2.5 text-[9px] font-black uppercase text-slate-400 text-center">Fecha</th>
                                        <th className="px-5 py-2.5 text-[9px] font-black uppercase text-slate-400 text-right">Val. Comprado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(ultimasTransacciones ?? []).map((t, i) => (
                                        <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="px-5 py-2.5">
                                                <p className="text-[10px] font-black text-slate-700 uppercase leading-none">{t.nombre_medico}</p>
                                                <p className="text-[9px] text-slate-400">{t.medico_documento}</p>
                                            </td>
                                            <td className="px-5 py-2.5">
                                                <p className="text-[10px] font-bold text-slate-600">{t.nombre_producto}</p>
                                            </td>
                                            <td className="px-5 py-2.5 text-center">
                                                <span className="text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded">
                                                    {t.fecha}
                                                </span>
                                            </td>
                                            <td className="px-5 py-2.5 text-right text-[10px] font-black text-emerald-600">
                                                {fmtM(t.valor_comprado)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Accesos rápidos */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <SectionHeader label="Navegación" title="Accesos rápidos" />
                            <div className="space-y-3">
                                {[
                                    { label: 'Importar Transacciones', sub: 'Cargar Excel de ventas', href: '/Gtransacciones', color: '#4184F0', icon: <FaFileInvoiceDollar /> },
                                    { label: 'Validar Médicos Temp.', sub: stats?.medicos_temporales > 0 ? `${stats.medicos_temporales} pendiente(s)` : 'Sin pendientes', href: '/GmedicosTemporales', color: '#f59e0b', icon: <FaUserClock /> },
                                    { label: 'Ver Métricas Detalladas', sub: 'Análisis por período y médico', href: '/Metricas', color: '#3D3FD8', icon: <FaChartLine /> },
                                    { label: 'Gestión de Visitadores', sub: 'Equipo de ventas', href: '/Gvisitadores', color: '#10b981', icon: <FaUsers /> },
                                    { label: 'Gestión de Médicos', sub: 'Base de médicos registrados', href: '/Gmedicos', color: '#8b5cf6', icon: <FaUserDoctor /> },
                                ].map((item, i) => (
                                    <Link key={i} href={item.href}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                             style={{ background: `${item.color}18` }}>
                                            <span style={{ color: item.color }} className="text-[13px]">{item.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-slate-700 leading-none">{item.label}</p>
                                            <p className="text-[9px] text-slate-400 mt-0.5">{item.sub}</p>
                                        </div>
                                        <FaArrowRight className="text-slate-200 group-hover:text-blue-400 text-[10px] shrink-0 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PanelAdmin>
    );
}
