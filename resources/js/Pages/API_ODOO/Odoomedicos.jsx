import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from "@/Pages/ADMINISTRADOR/PanelAdmin";
import {
    FaMagnifyingGlass, FaGear, FaPlug, FaCircleCheck,
    FaCircleXmark, FaTriangleExclamation, FaUser,
    FaIdCard, FaStethoscope, FaArrowLeft, FaDatabase,
    FaCircleNotch, FaSpinner, FaFileInvoiceDollar, FaReceipt, FaBoxesStacked
} from 'react-icons/fa6';

function ConexionBadge({ estado = 'sin_probar' }) {
    const map = {
        conectado:  { color: '#10b981', Icon: FaCircleCheck,       label: 'Conectado' },
        error:      { color: '#ef4444', Icon: FaCircleXmark,        label: 'Sin conexión' },
        sin_probar: { color: '#94a3b8', Icon: FaTriangleExclamation, label: 'Sin configurar' },
    };
    const { color, Icon, label } = map[estado] ?? map.sin_probar;
    return (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border"
              style={{ color, background: `${color}12`, borderColor: `${color}30` }}>
            <Icon className="text-[8px]" />
            {label}
        </span>
    );
}

function MedicoRow({ medico, index }) {
    const nombreCompleto = medico.name ?? `${medico.nombre || ''} ${medico.apellido || ''}`.trim();
    const documento = medico.vat ?? medico.documento ?? '—';
    const email = medico.email ?? '—';
    const telefono = [medico.phone, medico.mobile].filter(Boolean).join(' / ');
    return (
        <tr className={`hover:bg-blue-50/20 transition-colors ${index % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
            <td className="px-6 py-3 border-r border-slate-100">
                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">#{medico.id}</span>
            </td>
            <td className="px-6 py-3 border-r border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <FaUser className="text-blue-500 text-[10px]" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{nombreCompleto}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{email} {telefono && ` • ${telefono}`}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-3 border-r border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-600 font-mono">{documento}</span>
            </td>
            <td className="px-6 py-3 border-r border-slate-100 text-center">
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                    {medico.especialidad ?? 'Contacto Odoo'}
                </span>
            </td>
            <td className="px-6 py-3 text-center">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    medico.activo !== false ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'
                }`}>
                    {medico.activo !== false ? 'Activo' : 'Inactivo'}
                </span>
            </td>
        </tr>
    );
}

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function OdooMedicos({ auth, conexionEstado = 'sin_probar', flash, errors }) {

    const [documento, setDocumento]       = useState('');
    const [buscando, setBuscando]         = useState(false);
    const [resultados, setResultados]     = useState([]);
    const [transacciones, setTransacciones] = useState([]);
    const [filtroTx, setFiltroTx]         = useState('todos');
    const [excluirCancelados, setExcluirCancelados] = useState(true);
    const [fechaDesde, setFechaDesde]     = useState('');
    const [fechaHasta, setFechaHasta]     = useState('');
    const [buscado, setBuscado]           = useState(false);
    const [errorMsg, setErrorMsg]         = useState('');

    useEffect(() => {
        if (flash?.resultado) {
            setBuscando(false);
            setBuscado(true);
            if (flash.resultado.encontrado && flash.resultado.registros) {
                setResultados(flash.resultado.registros);
                setTransacciones(flash.resultado.transacciones || []);
                setErrorMsg('');
            } else {
                setResultados([]);
                setTransacciones([]);
                setFechaDesde('');
                setFechaHasta('');
                setErrorMsg(flash.resultado.mensaje || 'No se encontraron registros para este documento.');
            }
        }
    }, [flash?.resultado]);

    useEffect(() => {
        if (errors?.error) {
            setBuscando(false);
            setBuscado(true);
            setResultados([]);
            setTransacciones([]);
            setFechaDesde('');
            setFechaHasta('');
            setErrorMsg(errors.error);
        } else if (flash?.error) {
            setBuscando(false);
            setBuscado(true);
            setResultados([]);
            setTransacciones([]);
            setFechaDesde('');
            setFechaHasta('');
            setErrorMsg(flash.error);
        }
    }, [errors, flash?.error]);

    const handleBuscar = (e) => {
        e.preventDefault();
        if (!documento.trim()) return;
        setBuscando(true);
        setErrorMsg('');
        setResultados([]);
        setTransacciones([]);
        setFiltroTx('todos');
        setFechaDesde('');
        setFechaHasta('');
        setBuscado(false);
        router.post(route('odoo.medicos.buscar'), { documento }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setBuscando(false),
            onError: (errs) => {
                setBuscando(false);
                setBuscado(true);
                setErrorMsg(errs.error || 'Ocurrió un error al consultar en Odoo.');
            }
        });
    };

    const transaccionesFiltradas = transacciones.filter(tx => {
        if (filtroTx === 'venta'   && !tx.origen.includes('Venta'))   return false;
        if (filtroTx === 'factura' && !tx.origen.includes('Factura')) return false;
        if (excluirCancelados && tx.estado === 'cancel') return false;
        if (tx.fecha) {
            const txDate = new Date(tx.fecha).toISOString().split('T')[0];
            if (fechaDesde && txDate < fechaDesde) return false;
            if (fechaHasta && txDate > fechaHasta) return false;
        } else {
            if (fechaDesde || fechaHasta) return false;
        }
        return true;
    });

    // ── Sumatoria dinámica ──────────────────────────────────────────
    const totalFiltrado     = transaccionesFiltradas.reduce((acc, tx) => acc + (Number(tx.total) || 0), 0);
    const baseFiltrada      = transaccionesFiltradas.reduce((acc, tx) => acc + (Number(tx.base_imponible) || 0), 0);
    const impuestosFiltrados = transaccionesFiltradas.reduce((acc, tx) => acc + (Number(tx.impuestos) || 0), 0);
    const totalVentas   = transacciones
        .filter(tx => tx.origen.includes('Venta') && !(excluirCancelados && tx.estado === 'cancel'))
        .reduce((acc, tx) => acc + (Number(tx.total) || 0), 0);
    const totalFacturas = transacciones
        .filter(tx => tx.origen.includes('Factura') && !(excluirCancelados && tx.estado === 'cancel'))
        .reduce((acc, tx) => acc + (Number(tx.total) || 0), 0);
    const labelFiltro   = filtroTx === 'todos' ? 'Total general' : filtroTx === 'venta' ? 'Total ventas' : 'Total facturas';

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Consulta Médicos · Odoo" />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* HEADER */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1">
                                Integración Externa
                            </p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase flex items-center gap-2">
                                <FaDatabase className="text-blue-500 text-[18px]" />
                                Consulta de Médicos · Odoo
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Módulo de pruebas — validación de conexión con el servidor Odoo
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                                <FaPlug className="text-slate-400 text-[10px]" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Estado API:</span>
                                <ConexionBadge estado={conexionEstado} />
                            </div>
                            <Link href={route('odoo.productos')}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-sm transition-colors">
                                <FaBoxesStacked className="text-[10px]" />
                                Productos
                            </Link>
                            <Link href={route('odoo.config')}
                                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-sm transition-colors">
                                <FaGear className="text-[10px]" />
                                Ajustes de Conexión
                            </Link>
                        </div>
                    </div>
                </div>

                {/* CONTENIDO */}
                <div className="px-8 pt-7 space-y-6">

                    {/* Buscador */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                            Consultar médico por número de documento
                        </p>
                        <form onSubmit={handleBuscar} className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <FaIdCard className="text-xs" />
                                </span>
                                <input
                                    type="text"
                                    value={documento}
                                    onChange={e => setDocumento(e.target.value)}
                                    placeholder="Ej: 1012345678"
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700"
                                />
                            </div>
                            <button type="submit" disabled={buscando || !documento.trim()}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm transition-colors">
                                {buscando
                                    ? <><FaSpinner className="animate-spin text-[10px]" /> Consultando...</>
                                    : <><FaMagnifyingGlass className="text-[10px]" /> Consultar Odoo</>
                                }
                            </button>
                        </form>
                    </div>

                    {/* Resultados */}
                    {buscado && (
                        <>
                            {/* Tabla médico */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <FaStethoscope className="text-blue-500 text-sm" />
                                        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                            Resultado de consulta · Doc: {documento}
                                        </h3>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase">
                                        {resultados.length} registro(s) encontrado(s)
                                    </span>
                                </div>
                                {resultados.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-blue-600">
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">ID Odoo</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Nombre Completo</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Documento</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Especialidad</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {resultados.map((m, i) => <MedicoRow key={m.id} medico={m} index={i} />)}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-16 text-slate-400">
                                        <FaUser className="text-4xl text-slate-200 mb-2 mx-auto block" />
                                        <p className="text-[11px] font-bold uppercase">
                                            {errorMsg || 'No se encontraron registros para este documento.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Tabla transacciones */}
                            {resultados.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                                    {/* Cabecera + pills filtro */}
                                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex-wrap gap-3">
                                        <div className="flex items-center gap-2">
                                            <FaFileInvoiceDollar className="text-blue-500 text-sm" />
                                            <div>
                                                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                    Transacciones de Odoo
                                                </h3>
                                                <p className="text-[8px] font-semibold text-slate-400 uppercase mt-0.5">
                                                    Mostrando {transaccionesFiltradas.length} de {transacciones.length} registros
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* Toggle excluir cancelados */}
                                            <button
                                                type="button"
                                                onClick={() => setExcluirCancelados(v => !v)}
                                                className={`flex items-center gap-1.5 text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition-colors ${
                                                    excluirCancelados
                                                        ? 'bg-red-50 border-red-200 text-red-600'
                                                        : 'bg-slate-100 border-slate-200 text-slate-400'
                                                }`}
                                            >
                                                <span className={`w-3 h-3 rounded-full border flex items-center justify-center transition-colors ${
                                                    excluirCancelados ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300'
                                                }`}>
                                                    {excluirCancelados && <span className="text-white text-[7px] leading-none">✓</span>}
                                                </span>
                                                Excluir cancelados
                                            </button>

                                            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[9px] font-bold uppercase">
                                                {[
                                                    { key: 'todos',   label: 'Todos',    active: 'bg-white text-slate-800 shadow-sm' },
                                                    { key: 'venta',   label: 'Ventas',   active: 'bg-indigo-600 text-white shadow-sm' },
                                                    { key: 'factura', label: 'Facturas', active: 'bg-amber-600 text-white shadow-sm' },
                                                ].map(({ key, label, active }) => (
                                                    <button key={key} type="button" onClick={() => setFiltroTx(key)}
                                                        className={`px-3 py-1 rounded-md transition-all ${
                                                            filtroTx === key ? active : 'text-slate-500 hover:text-slate-800'
                                                        }`}>
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── SUMATORIA DINÁMICA ── */}
                                    <div className="px-6 py-3 bg-slate-800 flex items-center justify-between flex-wrap gap-3">
                                        {/* Total del filtro activo — prominente, con desglose base/impuestos */}
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                                {labelFiltro}
                                                {(fechaDesde || fechaHasta) && (
                                                    <span className="ml-1 text-blue-400">
                                                        · {fechaDesde || '…'} → {fechaHasta || '…'}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[20px] font-black text-white leading-none">
                                                {fmt(totalFiltrado)}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[9px] font-bold text-slate-300">
                                                    Base: <span className="text-emerald-300 font-mono">{fmt(baseFiltrada)}</span>
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-300">
                                                    Imp: <span className="text-rose-300 font-mono">{fmt(impuestosFiltrados)}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mini resumen ventas / facturas siempre visible */}
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black uppercase text-indigo-300 tracking-widest">Ventas</p>
                                                <p className="text-[12px] font-black text-indigo-200">{fmt(totalVentas)}</p>
                                            </div>
                                            <div className="w-px h-8 bg-slate-600" />
                                            <div className="text-right">
                                                <p className="text-[8px] font-black uppercase text-amber-300 tracking-widest">Facturas</p>
                                                <p className="text-[12px] font-black text-amber-200">{fmt(totalFacturas)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filtro fechas */}
                                    <div className="flex items-center gap-4 px-6 py-2.5 bg-slate-50/50 border-b border-slate-100 flex-wrap text-[10px]">
                                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Filtrar por fecha:</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-500 font-bold uppercase text-[8px]">Desde:</span>
                                            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[9px] font-bold font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-500 font-bold uppercase text-[8px]">Hasta:</span>
                                            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-[9px] font-bold font-mono text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all" />
                                        </div>
                                        {(fechaDesde || fechaHasta) && (
                                            <button type="button" onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                                                className="text-red-500 hover:text-red-700 font-black uppercase text-[8px] tracking-widest bg-red-50 hover:bg-red-100/60 border border-red-100 rounded-md px-2.5 py-1 transition-all">
                                                Limpiar Fechas
                                            </button>
                                        )}
                                    </div>

                                    {/* Tabla */}
                                    {transaccionesFiltradas.length > 0 ? (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-700">
                                                    <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-slate-600">Tipo</th>
                                                    <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-slate-600">Referencia</th>
                                                    <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-slate-600 text-center">Fecha</th>
                                                    <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-slate-600 text-right">Base Imponible</th>
                                                    <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-slate-600 text-right">Monto Total</th>
                                                    <th className="px-6 py-3 text-white text-[9px] font-black uppercase text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {transaccionesFiltradas.map((tx, idx) => (
                                                    <tr key={`${tx.id}-${idx}`} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                                                        <td className="px-6 py-3 border-r border-slate-100">
                                                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                                                                tx.origen.includes('Venta')
                                                                    ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                                                                    : 'text-amber-600 bg-amber-50 border-amber-100'
                                                            }`}>
                                                                {tx.origen}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 border-r border-slate-100">
                                                            <span className="text-[10px] font-bold text-slate-700 uppercase">{tx.referencia}</span>
                                                        </td>
                                                        <td className="px-6 py-3 border-r border-slate-100 text-center">
                                                            <span className="text-[9px] font-bold text-slate-500 font-mono">
                                                                {tx.fecha ? new Date(tx.fecha).toLocaleDateString('es-CO') : '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 border-r border-slate-100 text-right font-mono">
                                                            <span className="text-[10px] font-semibold text-emerald-600">{fmt(tx.base_imponible)}</span>
                                                        </td>
                                                        <td className="px-6 py-3 border-r border-slate-100 text-right font-mono">
                                                            <span className="text-[10px] font-bold text-slate-700">{fmt(tx.total)}</span>
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                                                                ['sale', 'done', 'posted'].includes(tx.estado)
                                                                    ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                                    : ['draft', 'sent'].includes(tx.estado)
                                                                    ? 'text-blue-500 bg-blue-50 border-blue-100'
                                                                    : 'text-slate-400 bg-slate-50 border-slate-100'
                                                            }`}>
                                                                {tx.estado}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <FaReceipt className="text-3xl text-slate-200 mb-2 mx-auto block" />
                                            <p className="text-[10px] font-bold uppercase">
                                                No se encontraron transacciones{filtroTx !== 'todos' ? (filtroTx === 'venta' ? ' de ventas' : ' de facturas') : ''} para este médico.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Estado inicial */}
                    {!buscado && !buscando && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                            <FaDatabase className="text-4xl text-slate-200 mb-2 mx-auto block" />
                            <p className="text-[11px] font-bold uppercase">
                                Ingresa un número de documento para consultar en Odoo
                            </p>
                            <p className="text-[9px] font-medium text-slate-300 mt-1 uppercase">
                                Los resultados aparecerán aquí
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PanelAdmin>
    );
}