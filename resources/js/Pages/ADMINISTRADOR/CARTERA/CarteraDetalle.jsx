import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import {
    FaArrowLeft, FaFileInvoiceDollar, FaClockRotateLeft, FaReceipt,
    FaChevronLeft, FaChevronRight,
} from 'react-icons/fa6';

const fmtM = n => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n ?? 0);

const ESTADO_PAGO_BADGE = {
    paid:             { label: 'Pagada',    className: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    in_payment:       { label: 'En pago',   className: 'text-blue-500 bg-blue-50 border-blue-100' },
    partial:          { label: 'Parcial',   className: 'text-amber-600 bg-amber-50 border-amber-100' },
    not_paid:         { label: 'Pendiente', className: 'text-slate-500 bg-slate-100 border-slate-200' },
    reversed:         { label: 'Revertida', className: 'text-slate-400 bg-slate-50 border-slate-100' },
    invoicing_legacy: { label: 'Legado',    className: 'text-slate-400 bg-slate-50 border-slate-100' },
};

function KpiCard({ label, value, accent }) {
    return (
        <div className="flex-1 min-w-0 bg-white px-4 py-4" style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
            <p className="text-[20px] font-black text-slate-800 leading-none break-words">{value}</p>
        </div>
    );
}

const FILTROS_ESTADO = [
    { key: 'todas',     label: 'Todas' },
    { key: 'vencida',   label: 'Vencidas' },
    { key: 'not_paid',  label: 'Pendientes' },
    { key: 'partial',   label: 'Parciales' },
    { key: 'paid',      label: 'Pagadas' },
];

export default function CarteraDetalle({
    auth, documento, medico, esTemporal,
    facturas = [], totalFacturas = 0, pagina = 1, porPagina = 50, filtroEstado = 'todas',
    resumen,
}) {
    const [cargando, setCargando] = useState(false);
    const [inputPorPagina, setInputPorPagina] = useState(String(porPagina));
    const hoyISO = new Date().toISOString().split('T')[0];

    useEffect(() => {
        setInputPorPagina(String(porPagina));
    }, [porPagina]);

    // Todo filtro/paginación se resuelve en el servidor (hay clientes con
    // decenas de miles de facturas — no tiene sentido traerlas todas para
    // paginar en el navegador). Cada cambio dispara una recarga parcial
    // manteniendo el resto del estado de la página.
    const irA = (params) => {
        router.get(route('Gcartera.detalle', documento), {
            estado: filtroEstado,
            pagina,
            porPagina,
            ...params,
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            onStart: () => setCargando(true),
            onFinish: () => setCargando(false),
        });
    };

    const claveEstado = (f) => {
        const vencida = (Number(f.saldo_pendiente) || 0) > 0 && f.fecha_vence && f.fecha_vence < hoyISO;
        if (vencida) return 'vencida';
        return f.estado_pago ?? 'otro';
    };

    const badgeEstadoPago = (f) => {
        const clave = claveEstado(f);
        if (clave === 'vencida') return { label: 'Vencida', className: 'text-red-600 bg-red-50 border-red-100' };
        return ESTADO_PAGO_BADGE[clave] ?? { label: f.estado_pago ?? '—', className: 'text-slate-400 bg-slate-50 border-slate-100' };
    };

    const totalPaginas = Math.ceil(totalFacturas / porPagina) || 1;
    const inicioIndex  = totalFacturas === 0 ? 0 : (pagina - 1) * porPagina + 1;
    const finIndex      = Math.min(pagina * porPagina, totalFacturas);

    const handlePorPaginaChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d+$/.test(val)) setInputPorPagina(val);
    };

    const handlePorPaginaBlur = () => {
        const num = parseInt(inputPorPagina, 10);
        const nuevo = (!isNaN(num) && num > 0) ? Math.min(num, 200) : 50;
        setInputPorPagina(String(nuevo));
        if (nuevo !== porPagina) irA({ porPagina: nuevo, pagina: 1 });
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title={`Cartera · ${medico?.nombre ?? documento}`} />

            <div className="w-full min-h-screen bg-white pb-12">

                {/* ── HEADER ───────────────────────────────────────── */}
                <div className="w-full bg-white px-6 py-3">
                    <Link href={route('Gcartera.index')}
                          className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition mb-1.5">
                        <FaArrowLeft className="text-[8px]" /> Volver a Cartera
                    </Link>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <h1 className="text-[19px] font-black text-slate-800 leading-none uppercase">
                                    {medico?.nombre}
                                </h1>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Cartera del médico</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>Doc.: {documento}</span>
                                {medico?.visitador && <span className="text-emerald-600 font-bold uppercase">{medico.visitador}</span>}
                            </p>
                        </div>

                        <Link href={route('Gmedicos.showPorDocumento', documento)}
                            className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5">
                            <FaClockRotateLeft className="text-[10px]" /> Historial
                        </Link>
                    </div>
                </div>

                <div className="px-8 pt-7 space-y-7">

                    {/* ── KPIs ─────────────────────────────────────── */}
                    <div className="flex flex-wrap gap-3">
                        <KpiCard label="Pendiente de cobro" value={fmtM(resumen.pendiente)} accent="#4184F0" />
                        <KpiCard label="Vencida"             value={fmtM(resumen.vencida)}   accent="#ef4444" />
                        <KpiCard label="Facturas vencidas"   value={resumen.facturas_vencidas} accent="#f59e0b" />
                    </div>

                    {/* ── FACTURAS ─────────────────────────────────── */}
                    <div className="bg-white overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-6 py-3 bg-slate-50/50 flex-wrap">
                            <div className="flex items-center gap-2">
                                <FaFileInvoiceDollar className="text-blue-500 text-sm" />
                                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    Facturas ({totalFacturas})
                                </h3>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-md text-[9px] font-bold uppercase">
                                {FILTROS_ESTADO.map(({ key, label }) => (
                                    <button key={key} type="button" onClick={() => irA({ estado: key, pagina: 1 })}
                                        className={`px-3 py-1 rounded transition-all ${
                                            filtroEstado === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                        }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {totalFacturas === 0 ? (
                            <div className="text-center py-16 text-slate-300">
                                <FaReceipt className="text-4xl mb-2 mx-auto block" />
                                <p className="text-[11px] font-bold uppercase">
                                    {filtroEstado !== 'todas'
                                        ? 'Sin facturas con este estado.'
                                        : esTemporal ? 'Este documento no está registrado localmente.' : 'Sin facturas para este médico.'}
                                </p>
                            </div>
                        ) : (
                            <>
                            <table className={`w-full text-left border-collapse transition-opacity ${cargando ? 'opacity-40' : ''}`}>
                                <thead>
                                    <tr className="bg-blue-600">
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Referencia</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Fecha</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Vence</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">Total</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-right">Saldo pendiente</th>
                                        <th className="px-5 py-3 text-white text-[9px] font-black uppercase text-center">Cobro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {facturas.map((f, idx) => {
                                        const badge = badgeEstadoPago(f);
                                        return (
                                            <tr key={`${f.id}-${idx}`} className="hover:bg-blue-50/20 transition-colors">
                                                <td className="px-5 py-2.5 border-r border-slate-50">
                                                    <span className="text-[10px] font-bold text-slate-700 uppercase">{f.referencia}</span>
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
                                    <input type="text" value={inputPorPagina}
                                        onChange={handlePorPaginaChange}
                                        onBlur={handlePorPaginaBlur}
                                        className="w-14 bg-white border border-slate-200 rounded-md py-1 px-2 text-center text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">reg. por página</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Mostrando {inicioIndex} - {finIndex} de {totalFacturas} registros
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button type="button" disabled={pagina === 1 || cargando}
                                            onClick={() => irA({ pagina: pagina - 1 })}
                                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                            <FaChevronLeft className="text-[10px]" />
                                        </button>
                                        <span className="px-3 text-[11px] font-black text-slate-700">
                                            Pág. {pagina} de {totalPaginas}
                                        </span>
                                        <button type="button" disabled={pagina === totalPaginas || cargando}
                                            onClick={() => irA({ pagina: pagina + 1 })}
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
