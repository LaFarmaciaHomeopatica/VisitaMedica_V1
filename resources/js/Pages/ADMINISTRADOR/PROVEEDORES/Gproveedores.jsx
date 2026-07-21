import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    FaRotate, FaTruck, FaMagnifyingGlass, FaXmark, FaArrowUp, FaArrowDown,
    FaChevronLeft, FaChevronRight, FaCalendarDays,
} from 'react-icons/fa6';

const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n ?? 0);

const hoyISO = new Date().toISOString().split('T')[0];
const en30DiasISO = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
})();

const ESTADO_PAGO_BADGE = {
    paid:             { label: 'Pagada',    className: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    in_payment:       { label: 'En pago',   className: 'text-blue-500 bg-blue-50 border-blue-100' },
    partial:          { label: 'Parcial',   className: 'text-amber-600 bg-amber-50 border-amber-100' },
    not_paid:         { label: 'Pendiente', className: 'text-slate-500 bg-slate-100 border-slate-200' },
    reversed:         { label: 'Revertida', className: 'text-slate-400 bg-slate-50 border-slate-100' },
    invoicing_legacy: { label: 'Legado',    className: 'text-slate-400 bg-slate-50 border-slate-100' },
};

function claveEstado(f) {
    const vencida = (Number(f.saldo_pendiente) || 0) > 0 && f.fecha_vence && f.fecha_vence < hoyISO;
    if (vencida) return 'vencida';
    return f.estado_pago ?? 'otro';
}

function badgeEstadoPago(f) {
    const clave = claveEstado(f);
    if (clave === 'vencida') return { label: 'Vencida', className: 'text-red-600 bg-red-50 border-red-100' };
    return ESTADO_PAGO_BADGE[clave] ?? { label: f.estado_pago ?? '—', className: 'text-slate-400 bg-slate-50 border-slate-100' };
}

function KpiCard({ label, value, accent, sub }) {
    return (
        <div className="flex-1 min-w-0 bg-white px-4 py-4" style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
            <p className="text-[20px] font-black text-slate-800 leading-none break-words">{value}</p>
            {sub && <p className="text-[9px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

export default function Gproveedores({ auth, proveedores, vencimientos }) {
    const [tab, setTab] = useState('proveedor'); // 'proveedor' | 'vencimiento'
    const [actualizando, setActualizando] = useState(false);

    // ── Pestaña "Por proveedor" ─────────────────────────────────────────
    const [soloVencidas, setSoloVencidas] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [orden, setOrden] = useState({ campo: 'pendiente', dir: 'desc' });
    const [paginaActual, setPaginaActual] = useState(1);
    const [porPagina, setPorPagina] = useState(50);
    const [inputPorPagina, setInputPorPagina] = useState('50');

    const cargando = !proveedores;

    // `proveedores` llega como Inertia::lazy — no se incluye en la carga
    // inicial, hay que pedirla aparte con una recarga parcial (mismo patrón
    // que Ginicio.jsx usa para `stats`).
    useEffect(() => {
        if (proveedores) return;
        router.reload({ only: ['proveedores'] });
    }, [proveedores]);

    const actualizar = () => {
        setActualizando(true);
        router.post(route('Gproveedores.actualizar'), {}, {
            preserveScroll: true,
            onFinish: () => setActualizando(false),
        });
    };

    const filas = proveedores ?? [];

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
        { campo: 'nombre',            label: 'Proveedor' },
        { campo: 'pendiente',         label: 'Pendiente' },
        { campo: 'vencida',           label: 'Vencida' },
        { campo: 'facturas_vencidas', label: 'Facturas vencidas' },
        { campo: 'dias_max_vencido',  label: 'Días vencido' },
    ];

    // ── Pestaña "Por vencimiento" (presupuesto por rango de fechas) ────
    const [desde, setDesde] = useState(hoyISO);
    const [hasta, setHasta] = useState(en30DiasISO);
    const [paginaVenc, setPaginaVenc] = useState(1);
    const [porPaginaVenc, setPorPaginaVenc] = useState(50);
    const [inputPorPaginaVenc, setInputPorPaginaVenc] = useState('50');
    const [cargandoVenc, setCargandoVenc] = useState(false);

    const cargarVencimientos = (params = {}) => {
        setCargandoVenc(true);
        router.get(route('Gproveedores.index'), {
            desde, hasta, pagina: paginaVenc, porPagina: porPaginaVenc, ...params,
        }, {
            only: ['vencimientos'],
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setCargandoVenc(false),
        });
    };

    // Solo se pide la primera vez que se abre la pestaña — no en cada carga
    // de /Gproveedores, para no recorrer account.move de más si nadie la mira.
    useEffect(() => {
        if (tab === 'vencimiento' && !vencimientos) {
            cargarVencimientos();
        }
    }, [tab]);

    const handleDesdeChange = (e) => {
        const val = e.target.value;
        setDesde(val);
        setPaginaVenc(1);
        cargarVencimientos({ desde: val, pagina: 1 });
    };

    const handleHastaChange = (e) => {
        const val = e.target.value;
        setHasta(val);
        setPaginaVenc(1);
        cargarVencimientos({ hasta: val, pagina: 1 });
    };

    const irPaginaVenc = (nuevaPagina) => {
        setPaginaVenc(nuevaPagina);
        cargarVencimientos({ pagina: nuevaPagina });
    };

    const handlePorPaginaVencChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) setInputPorPaginaVenc(val);
    };

    const handlePorPaginaVencBlur = () => {
        const num = parseInt(inputPorPaginaVenc, 10);
        const nuevo = (!isNaN(num) && num > 0) ? Math.min(num, 200) : 50;
        setInputPorPaginaVenc(String(nuevo));
        if (nuevo !== porPaginaVenc) {
            setPorPaginaVenc(nuevo);
            setPaginaVenc(1);
            cargarVencimientos({ porPagina: nuevo, pagina: 1 });
        }
    };

    const cargandoVencInicial = tab === 'vencimiento' && !vencimientos;
    const facturasVenc  = vencimientos?.facturas ?? [];
    const totalVenc      = vencimientos?.total ?? 0;
    const resumenVenc     = vencimientos?.resumen ?? { pendiente: 0, vencida: 0, facturas_vencidas: 0, total_facturas: 0 };
    const totalPaginasVenc = Math.ceil(totalVenc / porPaginaVenc) || 1;
    const inicioVenc = totalVenc === 0 ? 0 : (paginaVenc - 1) * porPaginaVenc + 1;
    const finVenc = Math.min(paginaVenc * porPaginaVenc, totalVenc);

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Proveedores" />

            <div className="w-full min-h-screen bg-white pb-12">

                {/* ── ENCABEZADO / FILTROS ───────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap items-end gap-4 sticky top-14 z-40 shadow-sm">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cuentas por pagar</p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-[18px] font-black text-slate-800 leading-none">Proveedores</h1>
                            {(cargando || (tab === 'vencimiento' && cargandoVencInicial)) && (
                                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full animate-pulse">
                                    <FaRotate className="animate-spin text-[9px]" />
                                    Consultando datos de Odoo...
                                </span>
                            )}
                            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-md text-[9px] font-bold uppercase">
                                <button type="button" onClick={() => setTab('proveedor')}
                                    className={`px-3 py-1.5 rounded transition-all ${tab === 'proveedor' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                                    Por proveedor
                                </button>
                                <button type="button" onClick={() => setTab('vencimiento')}
                                    className={`px-3 py-1.5 rounded transition-all ${tab === 'vencimiento' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                                    Por vencimiento
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        {tab === 'proveedor' ? (
                            <>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Buscar proveedor</p>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <FaMagnifyingGlass className="text-[10px]" />
                                        </span>
                                        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                            placeholder="Nombre o documento..."
                                            className="text-[11px] font-bold border border-slate-200 rounded-md pl-8 pr-3 py-2 bg-white focus:outline-none focus:border-blue-400 w-48" />
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
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Vence desde</p>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <FaCalendarDays className="text-[10px]" />
                                        </span>
                                        <input type="date" value={desde} onChange={handleDesdeChange} max={hasta}
                                            className="text-[11px] font-bold border border-slate-200 rounded-md pl-8 pr-3 py-2 bg-white focus:outline-none focus:border-blue-400" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Vence hasta</p>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                            <FaCalendarDays className="text-[10px]" />
                                        </span>
                                        <input type="date" value={hasta} onChange={handleHastaChange} min={desde}
                                            className="text-[11px] font-bold border border-slate-200 rounded-md pl-8 pr-3 py-2 bg-white focus:outline-none focus:border-blue-400" />
                                    </div>
                                </div>
                            </>
                        )}
                        <button onClick={actualizar} disabled={actualizando}
                                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 px-5 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition disabled:opacity-50">
                            <FaRotate className={actualizando ? 'animate-spin' : ''} />
                            {actualizando ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-7">
                    {tab === 'proveedor' ? (
                        <>
                        {/* ── KPIs ─────────────────────────────────────── */}
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                            <KpiCard label="Pendiente de pago"     value={cargando ? '…' : fmtM(totalPendiente)} accent="#4184F0" />
                            <KpiCard label="Vencida"                value={cargando ? '…' : fmtM(totalVencida)}   accent="#ef4444" />
                            <KpiCard label="Facturas vencidas"      value={cargando ? '…' : fmt(totalFacturasVencidas)} accent="#f59e0b" />
                            <KpiCard label="Proveedores con cuenta" value={cargando ? '…' : fmt(filas.length)}    accent="#10b981" />
                        </div>

                        {/* ── TABLA ────────────────────────────────────── */}
                        <div className="bg-white overflow-hidden">
                            {cargando ? (
                                <div className="flex items-center justify-center h-56 text-slate-300 text-[11px] animate-pulse">
                                    Cargando datos de Odoo...
                                </div>
                            ) : filtradas.length === 0 ? (
                                <div className="flex items-center justify-center h-56 text-slate-300 text-[11px]">
                                    {filas.length === 0 ? 'Ningún proveedor tiene cuenta pendiente.' : 'Sin resultados para estos filtros.'}
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
                                                onClick={() => f.documento && router.visit(route('Gproveedores.detalle', f.documento))}>
                                                <td className="px-5 py-3 border-r border-slate-50">
                                                    <p className="text-[10px] font-black text-slate-700 uppercase">{f.nombre}</p>
                                                    <p className="text-[8px] text-slate-400 font-medium">
                                                        {f.documento ?? 'Sin documento en Odoo'}
                                                    </p>
                                                </td>
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
                        </>
                    ) : (
                        <>
                        {/* ── KPIs (rango de fechas) ─────────────────────── */}
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                            <KpiCard label="Pendiente en el rango" value={cargandoVencInicial ? '…' : fmtM(resumenVenc.pendiente)} accent="#4184F0" />
                            <KpiCard label="Vencida"                value={cargandoVencInicial ? '…' : fmtM(resumenVenc.vencida)}   accent="#ef4444" />
                            <KpiCard label="Facturas vencidas"      value={cargandoVencInicial ? '…' : fmt(resumenVenc.facturas_vencidas)} accent="#f59e0b" />
                            <KpiCard label="Facturas en el rango"   value={cargandoVencInicial ? '…' : fmt(resumenVenc.total_facturas)} accent="#10b981" />
                        </div>

                        {/* ── TABLA ────────────────────────────────────── */}
                        <div className="bg-white overflow-hidden">
                            {cargandoVencInicial ? (
                                <div className="flex items-center justify-center h-56 text-slate-300 text-[11px] animate-pulse">
                                    Cargando datos de Odoo...
                                </div>
                            ) : totalVenc === 0 ? (
                                <div className="flex items-center justify-center h-56 text-slate-300 text-[11px]">
                                    Ninguna factura de proveedor vence entre estas fechas.
                                </div>
                            ) : (
                                <>
                                <table className={`w-full text-left border-collapse transition-opacity ${cargandoVenc ? 'opacity-40' : ''}`}>
                                    <thead>
                                        <tr className="bg-blue-600">
                                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Proveedor</th>
                                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Referencia</th>
                                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Fecha</th>
                                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Vence</th>
                                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">Total</th>
                                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">Saldo pendiente</th>
                                            <th className="px-5 py-3 text-white text-[9px] font-black uppercase text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {facturasVenc.map((f, idx) => {
                                            const badge = badgeEstadoPago(f);
                                            return (
                                                <tr key={`${f.id}-${idx}`}
                                                    className={`transition-colors ${f.documento ? 'hover:bg-blue-50/30 cursor-pointer' : 'cursor-default'} ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}
                                                    onClick={() => f.documento && router.visit(route('Gproveedores.detalle', f.documento))}>
                                                    <td className="px-5 py-2.5 border-r border-slate-50">
                                                        <span className="text-[10px] font-black text-slate-700 uppercase">{f.proveedor}</span>
                                                    </td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50">
                                                        <span className="text-[10px] font-bold text-slate-600 uppercase">{f.referencia}</span>
                                                    </td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[9px] text-slate-500 font-mono">
                                                        {f.fecha ? new Date(f.fecha).toLocaleDateString('es-CO') : '—'}
                                                    </td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-center text-[9px] text-slate-500 font-mono">
                                                        {f.fecha_vence ? new Date(f.fecha_vence).toLocaleDateString('es-CO') : '—'}
                                                    </td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-right font-mono">
                                                        <span className="text-[10px] font-bold text-slate-700">{fmtM(f.total)}</span>
                                                    </td>
                                                    <td className="px-5 py-2.5 border-r border-slate-50 text-right font-mono">
                                                        <span className={`text-[10px] font-black ${f.saldo_pendiente > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                            {fmtM(f.saldo_pendiente)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-2.5 text-center">
                                                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${badge.className}`}>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* ── PAGINACIÓN ──────────────────────────── */}
                                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar:</span>
                                        <input type="text" value={inputPorPaginaVenc}
                                            onChange={handlePorPaginaVencChange}
                                            onBlur={handlePorPaginaVencBlur}
                                            className="w-14 bg-white border border-slate-200 rounded-md py-1 px-2 text-center text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">reg. por página</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            Mostrando {inicioVenc} - {finVenc} de {totalVenc} registros
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button type="button" disabled={paginaVenc === 1 || cargandoVenc}
                                                onClick={() => irPaginaVenc(paginaVenc - 1)}
                                                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                <FaChevronLeft className="text-[10px]" />
                                            </button>
                                            <span className="px-3 text-[11px] font-black text-slate-700">
                                                Pág. {paginaVenc} de {totalPaginasVenc}
                                            </span>
                                            <button type="button" disabled={paginaVenc === totalPaginasVenc || cargandoVenc}
                                                onClick={() => irPaginaVenc(paginaVenc + 1)}
                                                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                                <FaChevronRight className="text-[10px]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                </>
                            )}
                        </div>
                        </>
                    )}
                </div>
            </div>
        </PanelAdmin>
    );
}
