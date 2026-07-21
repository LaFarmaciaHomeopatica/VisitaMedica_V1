import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    FaChevronLeft, FaChevronRight, FaCheck, FaTrash,
    FaCircleCheck, FaCircleXmark, FaWandMagicSparkles, FaArrowRotateRight,
} from 'react-icons/fa6';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n ?? 0);

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function labelMes(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    return `${MESES[Number(m) - 1]} ${y}`;
}

// ── permite superar el 100% ───────────────────────────────────────────────────
function pct(actual, meta) {
    if (!meta || meta <= 0) return 0;
    return Math.round((actual / meta) * 100);
}

// ── barra de progreso ─────────────────────────────────────────────────────────
function Bar({ actual, meta, color }) {
    const p    = pct(actual, meta);
    const over = meta > 0 && actual >= meta;

    return (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
            {/* Barra principal — máximo 100% visualmente */}
            <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(p, 100)}%`, background: over ? '#10b981' : color }}
            />
            {/* Brillo animado cuando supera la meta */}
            {over && (
                <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{ background: 'linear-gradient(90deg, #10b981, #34d399)', opacity: 0.85 }}
                />
            )}
        </div>
    );
}

function FilaMeta({ visitador, progreso, mes, odooCargado }) {
    const prog = progreso[visitador.id] ?? { visitas_efectivas: 0, valor_comprado: 0, valor_formulado: 0 };

    // ── estado numérico puro ──────────────────────────────────────────────────
    const [metaV, setMetaV] = useState(visitador.meta?.meta_visitas ?? '');
    const [metaD, setMetaD] = useState(visitador.meta?.meta_dinero  ?? '');
    const [metaDFocus, setMetaDFocus] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);

    // ── sincroniza cuando cambia el mes o se refresca la meta ────────────────
    useEffect(() => {
        setMetaV(visitador.meta?.meta_visitas ?? '');
        setMetaD(visitador.meta?.meta_dinero  ?? '');
    }, [visitador.meta?.id, visitador.meta?.meta_visitas, visitador.meta?.meta_dinero, mes]);

    const tieneMeta = !!visitador.meta;

    const guardar = () => {
        setSaving(true);
        router.post(route('Gmetas.upsert'), {
            visitador_id: visitador.id,
            mes,
            meta_visitas: metaV !== '' ? Number(metaV) : 0,
            meta_dinero:  metaD !== '' ? Number(metaD) : 0,
        }, {
            preserveScroll: true,
            only: ['visitadores', 'progreso'], // Actualiza solo las props necesarias en segundo plano
            onSuccess: () => {
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            },
            onError: () => setSaving(false),
        });
    };

    const eliminar = () => {
        if (!visitador.meta?.id) return;
        router.delete(route('Gmetas.destroy', visitador.meta.id), {
            preserveScroll: true,
            only: ['visitadores', 'progreso'],
        });
    };

    // ── valor formateado para mostrar cuando no tiene foco ───────────────────
    const metaDDisplay = metaDFocus || metaD === ''
        ? metaD
        : `$${new Intl.NumberFormat('es-CO').format(Math.round(Number(metaD)))}`;

    const pctV = pct(prog.visitas_efectivas, metaV);

    return (
        <tr className="hover:bg-blue-50/20 transition-colors group">
            {/* Visitador */}
            <td className="px-5 py-3 border-r border-slate-50">
                <p className="text-[10px] font-black text-slate-700 uppercase leading-none">
                    {visitador.nombre} {visitador.apellido}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Zona {visitador.zona_id}</p>
            </td>

            {/* Estado meta */}
            <td className="px-4 py-3 border-r border-slate-50 text-center">
                {tieneMeta ? (
                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
                        <FaCircleCheck /> Con meta
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                        <FaCircleXmark /> Sin meta
                    </span>
                )}
            </td>

            {/* Meta visitas */}
            <td className="px-4 py-3 border-r border-slate-50">
                <input
                    type="number"
                    value={metaV}
                    onChange={e => setMetaV(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-center"
                />
            </td>

            {/* Meta dinero */}
            <td className="px-4 py-3 border-r border-slate-50">
                <input
                    type={metaDFocus ? 'number' : 'text'}
                    value={metaDDisplay}
                    onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setMetaD(val);
                    }}
                    onFocus={() => setMetaDFocus(true)}
                    onBlur={() => setMetaDFocus(false)}
                    placeholder="$0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-400 text-center"
                />
            </td>

            {/* Progreso visitas */}
            <td className="px-4 py-3 border-r border-slate-50">
                <div className="space-y-1">
                    <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500 font-bold">{prog.visitas_efectivas} ef.</span>
                        <span className={`font-black ${pctV >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>{pctV}%</span>
                    </div>
                    <Bar actual={prog.visitas_efectivas} meta={metaV} color="#4184F0" />
                </div>
            </td>

            {/* Progreso valor (Suma total) */}
            <td className="px-4 py-3 border-r border-slate-50 min-w-[210px]">
                {!odooCargado ? (
                    // ── Skeleton mientras se trae el dato de Odoo para ESTE visitador ──
                    <div className="flex flex-col justify-center gap-1.5 animate-pulse">
                        <div className="flex justify-end">
                            <span className="text-[8px] font-black text-blue-400 uppercase flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full border-2 border-blue-300 border-t-transparent animate-spin inline-block" />
                                Odoo...
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-slate-200 rounded-full" />
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded" />
                    </div>
                ) : (() => {
                    const totalValor = (prog.valor_comprado || 0) + (prog.valor_formulado || 0);
                    const pctTotal = pct(totalValor, metaD);

                    return (
                        <div className="flex flex-col justify-center">
                            {/* Porcentaje */}
                            <div className="flex justify-end items-center text-[10px] mb-1">
                                <span className={`font-black ${pctTotal >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {pctTotal}%
                                </span>
                            </div>

                            {/* BARRA ÚNICA SUMADA */}
                            <Bar actual={totalValor} meta={metaD} color="#24C765" />

                            {/* DESGLOSE (Comprado y Formulado) */}
                            <div className="flex items-center justify-between mt-1.5 text-[9.5px]">
                                <span className="text-slate-500 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#24C765] inline-block" />
                                    Comp: ${new Intl.NumberFormat('es-CO').format(prog.valor_comprado || 0)}
                                </span>
                                <span className="text-slate-500 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] inline-block" />
                                    Form: ${new Intl.NumberFormat('es-CO').format(prog.valor_formulado || 0)}
                                </span>
                            </div>
                        </div>
                    );
                })()}
            </td>

            {/* Acciones */}
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={guardar}
                        disabled={saving}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                            saved
                                ? 'bg-emerald-500 text-white'
                                : 'bg-[#3D3FD8] text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400'
                        }`}
                    >
                        {saving ? '...' : saved ? <FaCheck /> : 'Guardar'}
                    </button>
                    {tieneMeta && (
                        <button
                            onClick={eliminar}
                            className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"
                            title="Eliminar meta"
                        >
                            <FaTrash className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ── modal meta global ─────────────────────────────────────────────────────────
function ModalMasivo({ mes, onClose }) {
    const { data, setData, post, processing } = useForm({
        mes,
        meta_visitas: '',
        meta_dinero:  '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('Gmetas.masivo'), { onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                <h3 className="text-lg font-black text-slate-800 uppercase mb-1">Meta global</h3>
                <p className="text-[10px] text-slate-400 mb-6 uppercase">
                    Aplica la misma meta a <span className="font-black text-blue-600">todos los visitadores</span> para {labelMes(mes)}
                </p>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Meta de visitas</label>
                        <input
                            type="number"
                            value={data.meta_visitas}
                            onChange={e => setData('meta_visitas', e.target.value)}
                            placeholder="Ej: 20"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Meta de valor ($)</label>
                        <input
                            type="number"
                            value={data.meta_dinero}
                            onChange={e => setData('meta_dinero', e.target.value)}
                            placeholder="Ej: 5000000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-[2] py-3 bg-[#3D3FD8] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 disabled:bg-slate-200 transition-all">
                            {processing ? 'Aplicando...' : 'Aplicar a todos'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default function Gmetas({ auth, visitadores, progreso, mesActual, mesesConMetas }) {
    const [mes, setMes]               = useState(mesActual);
    const [showMasivo, setShowMasivo] = useState(false);

    // ── Progreso "vivo" (local + lo que va llegando de Odoo) ───────────────
    const [progresoLive, setProgresoLive] = useState(progreso);
    // ── Ids de visitadores cuyo dato de Odoo YA llegó para el mes actual ──
    const [odooCargados, setOdooCargados] = useState({});
    const [odooCargando, setOdooCargando] = useState(false);
    // ── Metadata de la última carga (para mostrar "actualizado hace X") ──
    const [odooUltimaActualizacion, setOdooUltimaActualizacion] = useState(null);
    const [odooTodoDesdeCache, setOdooTodoDesdeCache] = useState(true);

    // Referencia al "token" de la carga en curso: si cambia el mes a mitad de
    // camino, las respuestas de la carga anterior (obsoletas) se descartan.
    const cargaTokenRef = React.useRef(0);

    // Cuando cambian los props base (nuevo mes / guardar meta), reseteamos
    // el progreso "vivo" con lo que llega del servidor (datos locales, sin Odoo)
    useEffect(() => {
        setProgresoLive(progreso);
    }, [progreso]);

    // ── Trae de Odoo los datos de valor, UN visitador a la vez ─────────────
    // forzar = true → ignora la caché de 4h del backend y vuelve a consultar Odoo
    const cargarOdoo = async (forzar = false) => {
        const miToken = ++cargaTokenRef.current;

        setOdooCargados({});
        setOdooCargando(true);
        setOdooTodoDesdeCache(true);

        for (const v of visitadores) {
            if (cargaTokenRef.current !== miToken) return; // carga obsoleta, abortar
            try {
                const url = `/Gmetas/odoo-stats/${v.id}?mes=${mes}${forzar ? '&forzar=1' : ''}`;
                const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                const data = await res.json();

                if (cargaTokenRef.current !== miToken) return; // carga obsoleta, abortar

                setProgresoLive(prev => ({
                    ...prev,
                    [v.id]: {
                        ...(prev[v.id] ?? { id: v.id, visitas_efectivas: 0 }),
                        valor_comprado:  data.valor_comprado ?? 0,
                        valor_formulado: data.valor_formulado ?? 0,
                    },
                }));

                if (!data.desde_cache) setOdooTodoDesdeCache(false);
                if (data.actualizado_en) setOdooUltimaActualizacion(data.actualizado_en);
            } catch (e) {
                // Si falla un visitador puntual, seguimos con el resto
            } finally {
                if (cargaTokenRef.current === miToken) {
                    setOdooCargados(prev => ({ ...prev, [v.id]: true }));
                }
            }
        }
        if (cargaTokenRef.current === miToken) setOdooCargando(false);
    };

    // Carga automática al montar / cambiar de mes (usa la caché de 4h si existe)
    useEffect(() => {
        cargarOdoo(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mes, visitadores]);

    const totalOdooCargados = Object.keys(odooCargados).length;

    const horaActualizacion = odooUltimaActualizacion
        ? new Date(odooUltimaActualizacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        : null;

    const navMes = (delta) => {
        const [y, m] = mes.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        const nuevo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        setMes(nuevo);
        router.get(route('Gmetas.index'), { mes: nuevo }, { preserveState: true, replace: true });
    };

    const conMeta = visitadores.filter(v => v.meta).length;
    const sinMeta = visitadores.length - conMeta;

    // Metas superadas
    const metaSuperadaV = visitadores.filter(v => {
        const p = progresoLive[v.id];
        return v.meta && p && p.visitas_efectivas >= v.meta.meta_visitas;
    }).length;

    const metaSuperadaD = visitadores.filter(v => {
        const p = progresoLive[v.id];
        const totalVenta = (p?.valor_comprado || 0) + (p?.valor_formulado || 0);
        return v.meta && v.meta.meta_dinero > 0 && totalVenta >= v.meta.meta_dinero;
    }).length;

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Gestión de Metas" />
            {showMasivo && <ModalMasivo mes={mes} onClose={() => setShowMasivo(false)} />}

            <div className="w-full min-h-screen bg-white pb-12">

                {/* ── HEADER ───────────────────────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* ── KPIs ─────────────────────────────────────── */}
                        <div className="flex items-center gap-8 flex-wrap">
                            {[
                                { label: 'Total visitadores',     value: visitadores.length, accent: '#3D3FD8' },
                                { label: 'Con meta asignada',     value: conMeta,            accent: '#10b981' },
                                { label: 'Sin meta',              value: sinMeta,            accent: '#f43f5e' },
                                { label: 'Meta visitas superada', value: metaSuperadaV,      accent: '#f59e0b' },
                                { label: 'Meta valor superada',   value: metaSuperadaD,      accent: '#24C765' },
                            ].map((k, i) => (
                                <div key={i} className="flex flex-col justify-between min-w-[120px]">
                                    <div 
                                        className="w-full h-1 rounded-full mb-3" 
                                        style={{ backgroundColor: k.accent }} 
                                    />
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 leading-tight">
                                        {k.label}
                                    </p>
                                    <p className="text-[24px] font-bold text-slate-900 leading-none tracking-tight">
                                        {k.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Navegador de mes */}
                        <div className="flex items-center gap-3">
                            {/* ── Indicador de carga de Odoo ──────────────────── */}
                            {odooCargando ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
                                    <span className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin inline-block" />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[9px] font-black text-blue-600 uppercase">
                                            Trayendo metas de Odoo
                                        </span>
                                        <span className="text-[8px] font-bold text-blue-400">
                                            {totalOdooCargados} / {visitadores.length} visitadores
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                horaActualizacion && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className={`h-2 w-2 rounded-full inline-block ${odooTodoDesdeCache ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">
                                                {odooTodoDesdeCache ? 'Datos en caché' : 'Datos actualizados'}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-400">
                                                Odoo · {horaActualizacion}
                                            </span>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* ── Botón Actualizar: fuerza saltarse la caché de 4h ── */}
                            <button
                                onClick={() => cargarOdoo(true)}
                                disabled={odooCargando}
                                title="Volver a consultar Odoo, ignorando la caché de 4 horas"
                                className="flex items-center gap-2 px-3 py-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaArrowRotateRight className={`h-3 w-3 ${odooCargando ? 'animate-spin' : ''}`} />
                            </button>

                            <div className="flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <button
                                    onClick={() => navMes(-1)}
                                    className="px-3 py-3 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all border-r border-slate-100"
                                >
                                    <FaChevronLeft className="h-3 w-3" />
                                </button>

                                <div className="relative px-6 py-2.5 text-center min-w-[170px]">
                                    <p className="text-[13px] font-black text-slate-800 uppercase tracking-wide leading-none">
                                        {labelMes(mes)}
                                    </p>
                                    <p className="text-[9px] font-bold text-blue-400 mt-0.5">Click para cambiar mes</p>
                                    <input
                                        type="month"
                                        value={mes}
                                        onChange={e => {
                                            setMes(e.target.value);
                                            router.get(route('Gmetas.index'), { mes: e.target.value }, { preserveState: true, replace: true });
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>

                                <button
                                    onClick={() => navMes(1)}
                                    className="px-3 py-3 text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all border-l border-slate-100"
                                >
                                    <FaChevronRight className="h-3 w-3" />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowMasivo(true)}
                                className="flex items-center gap-2 px-4 py-3 bg-[#3D3FD8] text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-sm"
                            >
                                <FaWandMagicSparkles className="h-3 w-3" /> Meta global
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-6">

                    {/* ── TABLA ────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-600">
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Visitador</th>
                                        <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Estado</th>
                                        <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Meta visitas</th>
                                        <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Meta valor ($)</th>
                                        <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Progreso visitas</th>
                                        <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Progreso valor</th>
                                        <th className="px-4 py-3 text-white text-[9px] font-black uppercase text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {visitadores.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                No hay visitadores registrados
                                            </td>
                                        </tr>
                                    ) : visitadores.map(v => (
                                        <FilaMeta
                                            key={`${v.id}-${mes}`}
                                            visitador={v}
                                            progreso={progresoLive}
                                            odooCargado={!!odooCargados[v.id]}
                                            mes={mes}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Meses con metas ───────────────────────────── */}
                    {mesesConMetas.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Meses con metas registradas</p>
                            <div className="flex flex-wrap gap-2">
                                {mesesConMetas.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => { setMes(m); router.get(route('Gmetas.index'), { mes: m }, { preserveState: true, replace: true }); }}
                                        className={`text-[9px] font-black px-3 py-1.5 rounded-full border uppercase transition-all ${
                                            m === mes
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                                        }`}
                                    >
                                        {labelMes(m)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </PanelAdmin>
    );
}