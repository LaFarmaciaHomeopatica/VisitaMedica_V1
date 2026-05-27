import React, { useState, useEffect  } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    FaChevronLeft, FaChevronRight, FaCheck, FaTrash,
    FaBullseye, FaUsers, FaCircleCheck, FaCircleXmark, FaWandMagicSparkles,
} from 'react-icons/fa6';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => {
    n = n ?? 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
    return `$${fmt(n)}`;
};

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
    return Math.round((actual / meta) * 100); // ✅ sin Math.min
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

function FilaMeta({ visitador, progreso, mes, onSaved }) {
    const prog = progreso[visitador.id] ?? { visitas_efectivas: 0, valor_comprado: 0 };

    // ── estado numérico puro (nunca strings con $ ni comas) ──────────────
    const [metaV, setMetaV] = useState(visitador.meta?.meta_visitas ?? '');
    const [metaD, setMetaD] = useState(visitador.meta?.meta_dinero  ?? '');
    const [metaDFocus, setMetaDFocus] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved,  setSaved]  = useState(false);

    // ── sincroniza cuando cambia el mes o se refresca la meta ────────────
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
            onSuccess: () => {
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                onSaved();
            },
            onError: () => setSaving(false),
        });
    };

    const eliminar = () => {
        if (!visitador.meta?.id) return;
        router.delete(route('Gmetas.destroy', visitador.meta.id), {
            preserveScroll: true,
            onSuccess: onSaved,
        });
    };

    // ── valor formateado para mostrar cuando no tiene foco ───────────────
    const metaDDisplay = metaDFocus || metaD === ''
        ? metaD
        : `$${new Intl.NumberFormat('es-CO').format(Math.round(Number(metaD)))}`;

    const pctV = pct(prog.visitas_efectivas, metaV);
    const pctD = pct(prog.valor_comprado,    metaD);

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
                    onChange={e => setMetaD(e.target.value)}
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

            {/* Progreso valor */}
            <td className="px-4 py-3 border-r border-slate-50">
                <div className="space-y-1">
                    <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500 font-bold">{fmtM(prog.valor_comprado)}</span>
                        <span className={`font-black ${pctD >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>{pctD}%</span>
                    </div>
                    <Bar actual={prog.valor_comprado} meta={metaD} color="#8b5cf6" />
                </div>
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
    const [mes, setMes]           = useState(mesActual);
    const [showMasivo, setShowMasivo] = useState(false);
    const [key, setKey]           = useState(0);

    const navMes = (delta) => {
        const [y, m] = mes.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        const nuevo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        setMes(nuevo);
        router.get(route('Gmetas.index'), { mes: nuevo }, { preserveState: true, replace: true });
    };

    const conMeta    = visitadores.filter(v => v.meta).length;
    const sinMeta    = visitadores.length - conMeta;
    const metaSuperadaV = visitadores.filter(v => {
        const p = progreso[v.id];
        return v.meta && p && p.visitas_efectivas >= v.meta.meta_visitas;
    }).length;

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Gestión de Metas" />
            {showMasivo && <ModalMasivo mes={mes} onClose={() => { setShowMasivo(false); setKey(k => k + 1); }} />}

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* ── HEADER ───────────────────────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Panel de metas</p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase">Gestión de Metas</h1>
                        </div>

                        {/* Navegador de mes */}
                        <div className="flex items-center gap-3">
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

                    {/* ── KPIs ─────────────────────────────────────── */}
                    <div className="flex gap-4">
                        {[
                            { label: 'Total visitadores', value: visitadores.length, accent: '#3D3FD8', icon: <FaUsers /> },
                            { label: 'Con meta asignada', value: conMeta,            accent: '#10b981', icon: <FaCircleCheck /> },
                            { label: 'Sin meta',          value: sinMeta,            accent: '#f43f5e', icon: <FaCircleXmark /> },
                            { label: 'Meta visitas superada', value: metaSuperadaV,  accent: '#f59e0b', icon: <FaBullseye /> },
                        ].map((k, i) => (
                            <div key={i} className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4"
                                 style={{ borderTopColor: k.accent, borderTopWidth: 4 }}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
                                <p className="text-[26px] font-black text-slate-800 leading-none">{k.value}</p>
                            </div>
                        ))}
                    </div>

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
                                <tbody className="divide-y divide-slate-50" key={key}>
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
                                            progreso={progreso}
                                            mes={mes}
                                            onSaved={() => setKey(k => k + 1)}
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