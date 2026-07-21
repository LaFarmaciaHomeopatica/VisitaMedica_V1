import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    FaRotate, FaFileInvoiceDollar, FaMagnifyingGlass, FaXmark, FaArrowUp, FaArrowDown,
    FaChevronLeft, FaChevronRight,
} from 'react-icons/fa6';

const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n ?? 0);

function KpiCard({ label, value, accent, sub }) {
    return (
        <div className="flex-1 min-w-0 bg-white px-4 py-4" style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
            <p className="text-[20px] font-black text-slate-800 leading-none break-words">{value}</p>
            {sub && <p className="text-[9px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

export default function Gcartera({ auth, cartera }) {
    const [actualizando, setActualizando] = useState(false);
    const [soloVencidas, setSoloVencidas] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [orden, setOrden] = useState({ campo: 'pendiente', dir: 'desc' });
    const [paginaActual, setPaginaActual] = useState(1);
    const [porPagina, setPorPagina] = useState(50);
    const [inputPorPagina, setInputPorPagina] = useState('50');

    const cargando = !cartera;

    // `cartera` llega como Inertia::lazy — no se incluye en la carga inicial,
    // hay que pedirla aparte con una recarga parcial (mismo patrón que
    // Ginicio.jsx usa para `stats`).
    useEffect(() => {
        if (cartera) return;
        router.reload({ only: ['cartera'] });
    }, [cartera]);

    const actualizar = () => {
        setActualizando(true);
        router.post(route('Gcartera.actualizar'), {}, {
            preserveScroll: true,
            onFinish: () => setActualizando(false),
        });
    };

    const filas = cartera ?? [];

    const filtradas = useMemo(() => {
        let r = filas;
        if (soloVencidas) r = r.filter(f => f.vencida > 0);
        if (busqueda.trim()) {
            const q = busqueda.toLowerCase();
            r = r.filter(f => f.nombre?.toLowerCase().includes(q) || String(f.documento).includes(q));
        }
        const dirMul = orden.dir === 'desc' ? -1 : 1;
        return [...r].sort((a, b) => {
            const va = a[orden.campo] ?? 0, vb = b[orden.campo] ?? 0;
            if (typeof va === 'string') return va.localeCompare(vb) * dirMul;
            return (va - vb) * dirMul;
        });
    }, [filas, soloVencidas, busqueda, orden]);

    // Reinicia a la página 1 cuando cambian filtros/orden (evita quedar en
    // una página que ya no existe tras filtrar).
    useEffect(() => {
        setPaginaActual(1);
    }, [soloVencidas, busqueda, orden]);

    const totalPendiente = filas.reduce((acc, f) => acc + (Number(f.pendiente) || 0), 0);
    const totalVencida   = filas.reduce((acc, f) => acc + (Number(f.vencida) || 0), 0);
    const totalFacturasVencidas = filas.reduce((acc, f) => acc + (Number(f.facturas_vencidas) || 0), 0);

    const toggleOrden = (campo) => {
        setOrden(o => o.campo === campo ? { campo, dir: o.dir === 'desc' ? 'asc' : 'desc' } : { campo, dir: 'desc' });
    };

    const totalPaginas   = Math.ceil(filtradas.length / porPagina) || 1;
    const paginaSegura   = Math.min(paginaActual, totalPaginas);
    const inicioIndex    = (paginaSegura - 1) * porPagina;
    const finIndex       = inicioIndex + porPagina;
    const paginadas      = filtradas.slice(inicioIndex, finIndex);

    const handlePorPaginaChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) {
            setInputPorPagina(val);
            const num = parseInt(val, 10);
            if (!isNaN(num) && num > 0) {
                setPorPagina(num);
                setPaginaActual(1);
            }
        }
    };

    const handlePorPaginaBlur = () => {
        const num = parseInt(inputPorPagina, 10);
        if (isNaN(num) || num <= 0) {
            setInputPorPagina('50');
            setPorPagina(50);
        }
    };

    const columnas = [
        { campo: 'nombre',            label: 'Cliente' },
        { campo: 'visitador',         label: 'Visitador' },
        { campo: 'pendiente',         label: 'Pendiente' },
        { campo: 'vencida',           label: 'Vencida' },
        { campo: 'facturas_vencidas', label: 'Facturas vencidas' },
        { campo: 'dias_max_vencido',  label: 'Días vencido' },
    ];

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Cartera" />

            <div className="w-full min-h-screen bg-white pb-12">

                {/* ── ENCABEZADO / FILTROS ───────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap items-end gap-4 sticky top-14 z-40 shadow-sm">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cuentas por cobrar</p>
                        <div className="flex items-center gap-2">
                            <h1 className="text-[18px] font-black text-slate-800 leading-none">Cartera</h1>
                            {cargando && (
                                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full animate-pulse">
                                    <FaRotate className="animate-spin text-[9px]" />
                                    Consultando datos de Odoo...
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Buscar cliente</p>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <FaMagnifyingGlass className="text-[10px]" />
                                </span>
                                <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                    placeholder="Nombre o documento..."
                                    className="text-[11px] font-bold border border-slate-200 rounded-md pl-8 pr-3 py-1 bg-white focus:outline-none focus:border-blue-400 w-48" />
                            </div>
                        </div>
                        <button type="button" onClick={() => setSoloVencidas(v => !v)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition border ${
                                soloVencidas ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}>
                            Solo vencidas
                        </button>
                        {(soloVencidas || busqueda) && (
                            <button type="button" onClick={() => { setSoloVencidas(false); setBusqueda(''); }}
                                className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 px-2 py-2">
                                <FaXmark className="text-[10px]" /> Limpiar
                            </button>
                        )}
                        <button onClick={actualizar} disabled={actualizando}
                                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition disabled:opacity-50">
                            <FaRotate className={actualizando ? 'animate-spin' : ''} />
                            {actualizando ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-7">

                    {/* ── KPIs ─────────────────────────────────────── */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                        <KpiCard label="Pendiente de cobro" value={cargando ? '…' : fmtM(totalPendiente)} accent="#4184F0" />
                        <KpiCard label="Vencida"             value={cargando ? '…' : fmtM(totalVencida)}   accent="#ef4444" />
                        <KpiCard label="Facturas vencidas"   value={cargando ? '…' : fmt(totalFacturasVencidas)} accent="#f59e0b" />
                        <KpiCard label="Clientes con cartera" value={cargando ? '…' : fmt(filas.length)}    accent="#10b981" />
                    </div>

                    {/* ── TABLA ────────────────────────────────────── */}
                    <div className="bg-white overflow-hidden">
                        {cargando ? (
                            <div className="flex items-center justify-center h-56 text-slate-300 text-[11px] animate-pulse">
                                Cargando datos de Odoo...
                            </div>
                        ) : filtradas.length === 0 ? (
                            <div className="flex items-center justify-center h-56 text-slate-300 text-[11px]">
                                {filas.length === 0 ? 'Ningún cliente tiene cartera pendiente.' : 'Sin resultados para estos filtros.'}
                            </div>
                        ) : (
                            <>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-600">
                                        {columnas.map(col => (
                                            <th key={col.campo} onClick={() => toggleOrden(col.campo)}
                                                className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 cursor-pointer select-none hover:bg-blue-700 transition-colors">
                                                <span className="flex items-center gap-1">
                                                    {col.label}
                                                    {orden.campo === col.campo && (orden.dir === 'desc' ? <FaArrowDown className="text-[8px]" /> : <FaArrowUp className="text-[8px]" />)}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginadas.map((f, idx) => (
                                        <tr key={f.documento ?? `sin-doc-${inicioIndex + idx}`}
                                            className={`transition-colors ${f.documento ? 'hover:bg-blue-50/30 cursor-pointer' : 'cursor-default opacity-70'} ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}
                                            onClick={() => f.documento && router.visit(route('Gcartera.detalle', f.documento))}>
                                            <td className="px-5 py-3 border-r border-slate-50">
                                                <p className="text-[10px] font-black text-slate-700 uppercase">{f.nombre}</p>
                                                <p className="text-[8px] text-slate-400 font-medium">
                                                    {f.documento ?? 'Sin documento en Odoo'}
                                                    {!f.registrado && f.documento && <span className="ml-1.5 text-amber-500 font-black">· no registrado</span>}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3 border-r border-slate-50 text-[10px] font-bold text-slate-500">{f.visitador ?? '—'}</td>
                                            <td className="px-5 py-3 border-r border-slate-50 text-[10px] font-black text-slate-800 font-mono">{fmtM(f.pendiente)}</td>
                                            <td className="px-5 py-3 border-r border-slate-50 text-[10px] font-black font-mono" style={{ color: f.vencida > 0 ? '#dc2626' : '#1e293b' }}>{fmtM(f.vencida)}</td>
                                            <td className="px-5 py-3 border-r border-slate-50 text-center text-[10px] font-bold text-slate-600">{f.facturas_vencidas}</td>
                                            <td className="px-5 py-3 text-center">
                                                {f.dias_max_vencido > 0 ? (
                                                    <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase text-red-600 bg-red-50 border-red-100">
                                                        {f.dias_max_vencido} días
                                                    </span>
                                                ) : <span className="text-[9px] text-slate-300">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* ── PAGINACIÓN ──────────────────────────── */}
                            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar:</span>
                                    <input type="text" value={inputPorPagina}
                                        onChange={handlePorPaginaChange}
                                        onBlur={handlePorPaginaBlur}
                                        className="w-14 bg-white border border-slate-200 rounded-md py-1 px-2 text-center text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">reg. por página</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Mostrando {filtradas.length === 0 ? 0 : inicioIndex + 1} - {Math.min(finIndex, filtradas.length)} de {filtradas.length} registros
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button type="button" disabled={paginaSegura === 1}
                                            onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <FaChevronLeft className="text-[10px]" />
                                        </button>
                                        <span className="px-3 text-[11px] font-black text-slate-700">
                                            Pág. {paginaSegura} de {totalPaginas}
                                        </span>
                                        <button type="button" disabled={paginaSegura === totalPaginas}
                                            onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <FaChevronRight className="text-[10px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </PanelAdmin>
    );
}
