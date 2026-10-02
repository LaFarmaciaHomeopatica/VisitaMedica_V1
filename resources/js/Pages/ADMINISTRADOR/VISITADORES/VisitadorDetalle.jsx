import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { FaArrowLeft, FaUserDoctor, FaCalendarCheck, FaChartLine, FaCircleCheck, FaCircleXmark, FaChevronLeft, FaChevronRight, FaArrowRotateRight } from 'react-icons/fa6';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
// Valor completo en pesos, sin abreviar a K/M/B.
const fmtM = n => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n ?? 0);

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
function KpiCard({ label, value, accent, href }) {
    const inner = (
        <div className="pt-2 pb-4 flex flex-col justify-between h-full relative group">
            {/* Línea/Borde superior colorido */}
            <div 
                className="w-full h-1 rounded-full mb-4" 
                style={{ backgroundColor: accent }} 
            />

            {/* Etiqueta / Título en mayúsculas */}
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 leading-tight">
                {label}
            </p>

            {/* Valor principal */}
            <p className="text-[20px] font-bold text-slate-900 leading-none tracking-tight">
                {value}
            </p>
        </div>
    );

    return href ? (
        <Link href={href} className="block h-full transition-opacity hover:opacity-85">
            {inner}
        </Link>
    ) : inner;
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

// ── skeleton simple para valores que aún no llegan de Odoo ────────────────────
function ValorSkeleton({ w = 'w-20' }) {
    return <span className={`inline-block h-4 ${w} bg-slate-100 rounded animate-pulse align-middle`} />;
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

    // ── Tab "Valores por Médico" (Odoo desglosado) ───────────────────────────
    const [medicosValores, setMedicosValores]         = useState([]);
    const [medicosValoresCargando, setMVCargando]     = useState(false);
    const [medicosValoresCargados, setMVCargados]     = useState(false);
    const [busquedaMedico, setBusquedaMedico]         = useState('');

    const cargarMedicosValores = async (forzar = false) => {
        setMVCargando(true);
        try {
            const url = `/Gvisitadores/${visitador.id}/odoo-medicos-valores?mes=${mesActual}${forzar ? '&forzar=1' : ''}`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();
            setMedicosValores(Array.isArray(data.medicos) ? data.medicos : []);
            setMVCargados(true);
        } catch (e) {
            // silencioso — el usuario puede reintentar
        } finally {
            setMVCargando(false);
        }
    };

    // ── Datos de Odoo (se cargan aparte, no bloquean el render inicial) ────────
    const [txStatsLive, setTxStatsLive]             = useState(txStats);
    const [topProductosLive, setTopProductosLive]   = useState(Array.isArray(topProductos) ? topProductos : []);
    const [tendenciaLive, setTendenciaLive]         = useState(Array.isArray(tendencia) ? tendencia : []);
    const [progresoMetaLive, setProgresoMetaLive]   = useState(progresoMeta);
    const [odooCargando, setOdooCargando]           = useState(true);
    const [odooListo, setOdooListo]                 = useState(false);
    const [odooDesdeCache, setOdooDesdeCache]       = useState(true);
    const [odooActualizadoEn, setOdooActualizadoEn] = useState(null);

    const cargarOdoo = async (forzar = false) => {
        setOdooCargando(true);
        try {
            const url = `/Gvisitadores/${visitador.id}/odoo-stats?mes=${mesActual}${forzar ? '&forzar=1' : ''}`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();

            setTxStatsLive(data.txStats ?? { total_valor_comprado: 0, total_valor_formulado: 0, total_unidades: 0, total_transacciones: 0 });
            setTopProductosLive(Array.isArray(data.topProductos) ? data.topProductos : []);
            setTendenciaLive(Array.isArray(data.tendencia) ? data.tendencia : []);
            setProgresoMetaLive(prev => ({
                ...prev,
                valor_comprado:  data.valor_comprado ?? 0,
                valor_formulado: data.valor_formulado ?? 0,
                valor_total:     data.valor_total ?? 0,
            }));
            setOdooDesdeCache(!!data.desde_cache);
            setOdooActualizadoEn(data.actualizado_en ?? null);
            setOdooListo(true);
        } catch (e) {
            // si falla, dejamos lo que ya había (ceros) y el usuario puede reintentar con "Actualizar"
        } finally {
            setOdooCargando(false);
        }
    };

    // Carga automática al entrar / cambiar de mes (usa caché de 4h del backend)
    useEffect(() => {
        cargarOdoo(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mesActual, visitador.id]);

    const horaOdoo = odooActualizadoEn
        ? new Date(odooActualizadoEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        : null;

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

    const tendenciaData = (tendenciaLive ?? []).map(d => ({
        label:    d.mes,
        comprado: Number(d.valor_comprado),
        formulado:Number(d.valor_formulado),
    })).slice(-12);

    const prodData = (topProductosLive ?? []).map(p => ({
        name:  p.nombre,
        valor: Number(p.valor_comprado),
    }));

    return (
        <PanelAdmin user={auth?.user}>
            <Head title={`${visitador.nombre} ${visitador.apellido} · Detalle`} />

            <div className="w-full min-h-screen bg-white pb-12">

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
                            {/* ── Indicador de carga / caché de Odoo ──────────── */}
                            {odooCargando ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
                                    <span className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin inline-block" />
                                    <span className="text-[9px] font-black text-blue-600 uppercase">Trayendo datos de Odoo</span>
                                </div>
                            ) : (
                                odooListo && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className={`h-2 w-2 rounded-full inline-block ${odooDesdeCache ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">
                                                {odooDesdeCache ? 'Datos en caché' : 'Datos actualizados'}
                                            </span>
                                            {horaOdoo && (
                                                <span className="text-[8px] font-bold text-slate-400">Odoo · {horaOdoo}</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}

                            <button
                                onClick={() => cargarOdoo(true)}
                                disabled={odooCargando}
                                title="Volver a consultar Odoo, ignorando la caché de 4 horas"
                                className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaArrowRotateRight className={`h-3 w-3 ${odooCargando ? 'animate-spin' : ''}`} />
                            </button>

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
                        {/* ── CONTENEDOR AGRUPADO DE COMPRADO + FORMULADO CON BARRITA SUPERIOR ── */}
{(() => {
    const vComprado = Number(txStatsLive?.total_valor_comprado ?? 0);
    const vFormulado = Number(txStatsLive?.total_valor_formulado ?? 0);
    const vTotal = vComprado + vFormulado;

    return (
        <div className="col-span-2 flex flex-col bg-slate-50/70 border border-slate-200/80 rounded-2xl p-2.5 relative shadow-sm">
            
            {/* Barrita superior con la suma de ambos valores */}
           {/* Barrita superior en Amarillo Sólido */}
<div className="w-full bg-amber-400 rounded-xl px-3 py-1 flex items-center justify-between mb-1 shadow-xs">
    <span className="text-[9px] font-black uppercase text-slate-900 tracking-wider flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse inline-block" />
        Total Generado (Comprado + Formulado)
    </span>
    <span className="text-[11px] font-black text-slate-900">
        {odooListo ? fmtM(vTotal) : <ValorSkeleton w="w-16" />}
    </span>
</div>

            {/* Dos tarjetas individuales */}
            <div className="grid grid-cols-2 gap-2 flex-1">
                <KpiCard 
                    label="Valor comprado" 
                    value={odooListo ? fmtM(vComprado) : <ValorSkeleton />} 
                    accent="#10b981" 
                    sub="de sus médicos" 
                />
                <KpiCard 
                    label="Valor formulado" 
                    value={odooListo ? fmtM(vFormulado) : <ValorSkeleton />} 
                    accent="#8b5cf6" 
                    sub="de sus médicos" 
                />
            </div>
        </div>
    );
})()}</div>
{/* ── META ACTIVA ─────────────────────────────────── */}
{metaActiva ? (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between mb-5">
            <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Meta del mes</p>
                <p className="text-[13px] font-black text-slate-800 capitalize">{labelMes(mesActual)}</p>
            </div>
            {(progresoMetaLive?.valor_total ?? (progresoMetaLive?.valor_comprado + (progresoMetaLive?.valor_formulado ?? 0))) >= Number(metaActiva.meta_dinero) ? (
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
            {/* BARRA SEGMENTADA: VALOR TOTAL (COMPRADO + FORMULADO) */}
            {!odooListo ? (
                <div className="animate-pulse">
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full border-2 border-blue-300 border-t-transparent animate-spin inline-block" />
                            Trayendo valor de Odoo...
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden" />
                    <div className="h-3 w-2/3 bg-slate-100 rounded mt-2" />
                </div>
            ) : (() => {
                const metaMonto = Number(metaActiva.meta_dinero) || 1;
                const comprado = Number(progresoMetaLive?.valor_comprado ?? 0);
                const formulado = Number(progresoMetaLive?.valor_formulado ?? 0);
                const totalAlcanzado = progresoMetaLive?.valor_total ?? (comprado + formulado);

                // Cálculo de cuánto falta o cuánto sobrepasó
                const falta = metaMonto - totalAlcanzado;

                // Cálculo de porcentajes proporcionales
                const pctComprado = Math.min((comprado / metaMonto) * 100, 100);
                const pctFormulado = Math.min((formulado / metaMonto) * 100, Math.max(0, 100 - pctComprado));
                const pctTotal = metaMonto > 0 ? Math.round((totalAlcanzado / metaMonto) * 100) : 0;
                const over = totalAlcanzado >= metaMonto;

                return (
                    <div>
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[9px] font-black uppercase text-slate-400">
                                Valor total (Comprado + Formulado)
                            </span>
                            <span className="text-[10px] font-black text-slate-700">
                                {fmtM(totalAlcanzado)}
                                <span className="text-slate-400 font-bold"> / {fmtM(metaMonto)}</span>
                            </span>
                        </div>

                        {/* Barra de 2 colores */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            {/* Tramo Comprado (Verde) */}
                            <div 
                                className="h-full transition-all duration-500 bg-emerald-500" 
                                style={{ width: `${pctComprado}%` }}
                                title={`Comprado: ${fmtM(comprado)}`}
                            />
                            {/* Tramo Formulado (Morado) */}
                            <div 
                                className="h-full transition-all duration-500 bg-purple-600" 
                                style={{ width: `${pctFormulado}%` }}
                                title={`Formulado: ${fmtM(formulado)}`}
                            />
                        </div>

                        {/* Detalle, faltante y porcentaje final */}
                        <div className="flex justify-between items-center text-[9px] font-bold mt-1">
                            <div className="flex gap-3 text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    Comp: <strong className="text-slate-700">{fmtM(comprado)}</strong>
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" />
                                    Form: <strong className="text-slate-700">{fmtM(formulado)}</strong>
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {over ? (
                                    <span className="text-emerald-600 font-black">
                                        +{fmtM(Math.abs(falta))} superado
                                    </span>
                                ) : (
                                    <span className="text-slate-500 font-medium">
                                        Falta: <strong className="text-amber-600 font-bold">{fmtM(falta)}</strong>
                                    </span>
                                )}

                                <span className="text-slate-300">·</span>

                                <span style={{ color: over ? '#10b981' : '#4184F0' }}>
                                    {pctTotal}%
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* BARRA MANTENIDA: VISITAS EFECTIVAS */}
            <MetaBar
                label="Visitas efectivas en el mes"
                actual={progresoMetaLive.visitas_efectivas}
                meta={Number(metaActiva.meta_visitas)}
                color="#8b5cf6"
            />
        </div>
    </div>
) :  (
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

                        {/* ── HISTÓRICO: VALOR COMPRADO VS FORMULADO ───────────────── */}
<div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <div className="flex justify-between items-center mb-4">
        <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Histórico de Odoo</p>
            <p className="text-[13px] font-black text-slate-800">Valor comprado vs formulado de sus médicos</p>
        </div>
        {/* Indicadores de color */}
        <div className="flex items-center gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4184F0] inline-block" />
                Comprado
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] inline-block" />
                Formulado
            </span>
        </div>
    </div>

    {!odooListo ? (
        <div className="flex flex-col items-center justify-center h-56 gap-2 text-slate-300">
            <span className="h-5 w-5 rounded-full border-2 border-blue-300 border-t-transparent animate-spin inline-block" />
            <span className="text-[11px] font-bold text-slate-400">Trayendo histórico de Odoo...</span>
        </div>
    ) : tendenciaData.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-slate-300 text-[11px] font-bold">
            Sin transacciones registradas en Odoo para este periodo
        </div>
    ) : (
        <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={tendenciaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    {/* Gradiente para Valor Comprado (Azul) */}
                    <linearGradient id="gc2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4184F0" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4184F0" stopOpacity={0.0} />
                    </linearGradient>

                    {/* Gradiente para Valor Formulado (Morado) */}
                    <linearGradient id="gf2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                
                <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                />
                
                <YAxis 
                    tickFormatter={v => fmtM(v)} 
                    tick={{ fontSize: 8, fill: '#94a3b8' }} 
                    width={75} 
                />
                
                <Tooltip content={<ChartTooltip />} />
                
                <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />

                {/* Área Comprado (Azul) */}
                <Area 
                    type="monotone" 
                    dataKey="comprado"  
                    name="Valor Comprado"  
                    stroke="#4184F0" 
                    fill="url(#gc2)" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#4184F0' }} 
                />

                {/* Área Formulado (Morado) */}
                <Area 
                    type="monotone" 
                    dataKey="formulado" 
                    name="Valor Formulado" 
                    stroke="#8b5cf6" 
                    fill="url(#gf2)" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#8b5cf6' }} 
                />
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
                {(() => {
                    const sinMov = medicosValoresCargados
                        ? medicosValores.filter(m => m.valor_total === 0)
                        : [];
                    return [
                        { id: 'medicos',         label: 'Médicos asignados',   icon: <FaUserDoctor />,    count: medicos?.length,  countColor: null },
                        { id: 'visitas',         label: 'Historial de visitas',icon: <FaCalendarCheck />, count: visitas?.length,   countColor: null },
                        { id: 'valores',         label: 'Valores por médico',  icon: <FaChartLine />,     count: null,             countColor: null },
                        ...(medicosValoresCargados && sinMov.length > 0 ? [{
                            id: 'sin_movimientos', label: 'Sin movimientos', icon: (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            ), count: sinMov.length, countColor: 'amber',
                        }] : []),
                    ].map(tab => (
                        <button key={tab.id} onClick={() => {
                            setTabActiva(tab.id);
                            setPaginaActual(1);
                            if ((tab.id === 'valores' || tab.id === 'sin_movimientos') && !medicosValoresCargados) {
                                cargarMedicosValores(false);
                            }
                        }}
                            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${
                                tabActiva === tab.id
                                    ? tab.countColor === 'amber'
                                        ? 'border-amber-500 text-amber-600 bg-amber-50/30'
                                        : 'border-blue-600 text-blue-600 bg-blue-50/30'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}>
                            {tab.icon} {tab.label}
                            {tab.count !== null && (
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                    tab.countColor === 'amber'
                                        ? 'bg-amber-100 text-amber-600'
                                        : 'bg-slate-100 text-slate-500'
                                }`}>{tab.count}</span>
                            )}
                        </button>
                    ));
                })()}
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

        {/* ── Tab: Valores por Médico (Odoo desglosado) ── */}
        {tabActiva === 'valores' && (
            <div className="p-0">
                {/* Sub-header con botón actualizar y buscador */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/40 gap-3 flex-wrap">
                    <div className="flex flex-col">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            Odoo · {labelMes(mesActual)}
                        </p>
                        <p className="text-[11px] font-black text-slate-700">
                            Aporte individual de cada médico al total generado
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Buscador de médico */}
                        <input
                            type="text"
                            placeholder="Buscar médico..."
                            value={busquedaMedico}
                            onChange={e => setBusquedaMedico(e.target.value)}
                            className="text-[9px] font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-400 w-44 transition-all placeholder:text-slate-300"
                        />
                        {/* Botón actualizar */}
                        <button
                            onClick={() => cargarMedicosValores(true)}
                            disabled={medicosValoresCargando}
                            title="Volver a consultar Odoo, ignorando la caché"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                            <FaArrowRotateRight className={`h-3 w-3 ${medicosValoresCargando ? 'animate-spin' : ''}`} />
                            {medicosValoresCargando ? 'Cargando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                {/* Estado de carga */}
                {medicosValoresCargando && !medicosValoresCargados ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-300">
                        <span className="h-6 w-6 rounded-full border-2 border-blue-300 border-t-transparent animate-spin inline-block" />
                        <span className="text-[11px] font-bold text-slate-400">Consultando Odoo por cada médico...</span>
                        <span className="text-[9px] text-slate-300">Esto puede tomar unos segundos</span>
                    </div>
                ) : !medicosValoresCargados ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <FaChartLine className="text-slate-200 text-4xl" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Datos no cargados</p>
                        <button
                            onClick={() => cargarMedicosValores(false)}
                            className="mt-1 px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black rounded-xl hover:bg-blue-700 transition-all uppercase"
                        >
                            Cargar valores de Odoo
                        </button>
                    </div>
                ) : (() => {
                    const totalGeneral = Number(txStatsLive?.total_valor_comprado ?? 0) + Number(txStatsLive?.total_valor_formulado ?? 0);
                    const filtrados = medicosValores.filter(m =>
                        !busquedaMedico || m.nombre?.toLowerCase().includes(busquedaMedico.toLowerCase()) || m.documento?.includes(busquedaMedico)
                    );
                    const conValor = filtrados.filter(m => m.valor_total > 0);
                    const sinValor = filtrados.filter(m => m.valor_total === 0);

                    return (
                        <div>
                            {/* Tabla */}
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-600">
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">#</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Médico</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Especialidad</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">Valor Comprado</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">Valor Formulado</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">Total</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase text-center">Aporte al total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtrados.length === 0 ? (
                                        <tr><td colSpan={7} className="px-5 py-10 text-center text-[11px] text-slate-300 font-bold">Sin resultados</td></tr>
                                    ) : [
                                        ...conValor.map((m, i) => {
                                            const pctTotal   = totalGeneral > 0 ? Math.min((m.valor_total   / totalGeneral) * 100, 100) : 0;
                                            const pctComp    = m.valor_total > 0 ? (m.valor_comprado  / m.valor_total) * 100 : 0;
                                            const pctForm    = m.valor_total > 0 ? (m.valor_formulado / m.valor_total) * 100 : 0;
                                            return (
                                                <tr key={m.documento} className="hover:bg-blue-50/20 transition-colors">
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-[9px] font-black text-slate-400 text-center w-8">{i + 1}</td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50">
                                                        <p className="text-[10px] font-black text-slate-700 uppercase">{m.nombre}</p>
                                                        <p className="text-[9px] text-slate-400">{m.documento}</p>
                                                    </td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-[10px] text-slate-500">{m.especialidad ?? '—'}</td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-right">
                                                        <span className="text-[10px] font-black text-emerald-600">{fmtM(m.valor_comprado)}</span>
                                                    </td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-right">
                                                        <span className="text-[10px] font-black text-purple-600">{fmtM(m.valor_formulado)}</span>
                                                    </td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-right">
                                                        <span className="text-[10px] font-black text-slate-800">{fmtM(m.valor_total)}</span>
                                                    </td>
                                                    <td className="px-5 py-2.5">
                                                        {/* Mini barra bicolor + % */}
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pctComp}%` }} title={`Comprado: ${fmtM(m.valor_comprado)}`} />
                                                                <div className="h-full bg-purple-600 transition-all" style={{ width: `${pctForm}%` }} title={`Formulado: ${fmtM(m.valor_formulado)}`} />
                                                            </div>
                                                            <span className="text-[9px] font-black text-slate-500 w-9 text-right shrink-0">
                                                                {pctTotal.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }),
                                        // Médicos sin aporte — fila que lleva al tab sin_movimientos
                                        sinValor.length > 0 && (
                                            <tr key="__sin_valor__" className="bg-amber-50/40 cursor-pointer hover:bg-amber-100/60 transition-colors group"
                                                onClick={() => setTabActiva('sin_movimientos')}
                                            >
                                                <td colSpan={7} className="px-5 py-2.5 text-center">
                                                    <span className="inline-flex items-center gap-2 text-[9px] font-black text-amber-600 group-hover:text-amber-700">
                                                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                        + {sinValor.length} médico{sinValor.length !== 1 ? 's' : ''} sin movimientos en Odoo para {labelMes(mesActual)}
                                                        <span className="underline underline-offset-2 decoration-dashed">Ver en pestaña →</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        ),
                                    ]}
                                </tbody>
                            </table>

                            {/* Pie de resumen */}
                            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-4 text-[9px] font-bold">
                                    <span className="flex items-center gap-1 text-slate-500">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                        Verde = Comprado
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-500">
                                        <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                                        Morado = Formulado
                                    </span>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase">
                                    Total general: <span className="text-amber-600">{fmtM(totalGeneral)}</span>
                                    {' · '}
                                    {conValor.length} médico{conValor.length !== 1 ? 's' : ''} con aporte
                                </span>
                            </div>
                        </div>
                    );
                })()}
            </div>
        )}

        {/* ── Tab: Sin movimientos en Odoo ── */}
        {tabActiva === 'sin_movimientos' && (() => {
            const sinMov = medicosValores.filter(m => m.valor_total === 0);
            const [busqSinMov, setBusqSinMov] = [busquedaMedico, setBusquedaMedico];
            const filtradosSin = sinMov.filter(m =>
                !busqSinMov || m.nombre?.toLowerCase().includes(busqSinMov.toLowerCase()) || m.documento?.includes(busqSinMov)
            );
            return (
                <div className="p-0">
                    {/* Sub-header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-amber-50/50 gap-3 flex-wrap">
                        <div className="flex flex-col">
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                                Odoo · {labelMes(mesActual)}
                            </p>
                            <p className="text-[11px] font-black text-slate-700">
                                Médicos sin compras ni fórmulas registradas en Odoo
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Buscador */}
                            <input
                                type="text"
                                placeholder="Buscar médico..."
                                value={busqSinMov}
                                onChange={e => setBusqSinMov(e.target.value)}
                                className="text-[9px] font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 w-44 transition-all placeholder:text-slate-300"
                            />
                            {/* Botón volver a valores */}
                            <button
                                onClick={() => setTabActiva('valores')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm uppercase"
                            >
                                ← Volver a valores
                            </button>
                        </div>
                    </div>

                    {/* Tabla */}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-amber-500">
                                <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-amber-400">#</th>
                                <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-amber-400">Médico</th>
                                <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-amber-400">Documento</th>
                                <th className="px-5 py-3 text-white text-[9px] font-black uppercase">Especialidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtradosSin.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-10 text-center text-[11px] text-slate-300 font-bold">Sin resultados</td></tr>
                            ) : filtradosSin.map((m, i) => (
                                <tr key={m.documento ?? i} className="hover:bg-amber-50/30 transition-colors">
                                    <td className="px-5 py-2.5 border-r border-slate-50 text-[9px] font-black text-slate-400 text-center w-10">
                                        {i + 1}
                                    </td>
                                    <td className="px-5 py-2.5 border-r border-slate-50">
                                        <p className="text-[10px] font-black text-slate-700 uppercase">{m.nombre}</p>
                                    </td>
                                    <td className="px-5 py-2.5 border-r border-slate-50 text-[9px] text-slate-400">
                                        {m.documento ?? '—'}
                                    </td>
                                    <td className="px-5 py-2.5 text-[9px] text-slate-500">
                                        {m.especialidad ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pie */}
                    <div className="px-5 py-3 bg-amber-50/40 border-t border-amber-100 flex items-center justify-between gap-4 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400">
                            Ninguno de estos médicos generó movimientos en Odoo durante {labelMes(mesActual)}
                        </span>
                        <span className="text-[9px] font-black text-amber-600 uppercase">
                            {filtradosSin.length} médico{filtradosSin.length !== 1 ? 's' : ''} sin movimientos
                        </span>
                    </div>
                </div>
            );
        })()}
    </div>

    </div>
            </div>
        </PanelAdmin>
    );
}