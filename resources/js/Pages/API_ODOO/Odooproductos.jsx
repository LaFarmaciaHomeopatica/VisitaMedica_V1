import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from "@/Pages/ADMINISTRADOR/PanelAdmin";
import {
    FaMagnifyingGlass, FaGear, FaPlug, FaCircleCheck,
    FaCircleXmark, FaTriangleExclamation, FaUser,
    FaIdCard, FaArrowLeft, FaDatabase, FaSpinner,
    FaBoxesStacked, FaBarcode
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

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtN = (n) => new Intl.NumberFormat('es-CO').format(n);

// 1. Recibe 'resultadoProductos' directamente en los parámetros del componente
export default function OdooProductos({ auth, conexionEstado = 'sin_probar', flash, errors, resultadoProductos }) {

    const [documento, setDocumento]   = useState('');
    const [buscando, setBuscando]     = useState(false);
    const [filtroOrigen, setFiltroOrigen] = useState('todos');

    // 2. Extraemos directamente de la prop o valores por defecto
    const productos = resultadoProductos?.productos || [];
    const medico = resultadoProductos?.medico || null;
    const buscado = !!resultadoProductos; // Si existe la prop, es porque ya se buscó
    const errorMsg = !resultadoProductos?.encontrado ? (resultadoProductos?.mensaje || errors?.error || flash?.error || '') : '';

    const handleBuscar = (e) => {
        e.preventDefault();
        if (!documento.trim()) return;
        setBuscando(true);
        setFiltroOrigen('todos');
        
        router.post(route('odoo.productos.buscar'), { documento }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setBuscando(false),
            onError: () => setBuscando(false)
        });
    };

    // ... El resto del código (filtros, acumuladores y JSX) queda exactamente igual

    const productosFiltrados = productos.filter(p =>
        filtroOrigen === 'todos' ? true : p.origen === filtroOrigen
    );

    const totalGeneral = productosFiltrados.reduce((acc, p) => acc + (Number(p.subtotal) || 0), 0);
    const cantidadTotal = productosFiltrados.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0);

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Consulta Productos · Odoo" />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* HEADER */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <Link href={route('odoo.medicos')}
                        className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition mb-3">
                        <FaArrowLeft className="text-[8px]" /> Volver a Consulta Médicos
                    </Link>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded inline-block mb-1">
                                Integración Externa
                            </p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase flex items-center gap-2">
                                <FaBoxesStacked className="text-emerald-500 text-[18px]" />
                                Consulta de Productos · Odoo
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Productos facturados/vendidos a un médico — solo lectura
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                                <FaPlug className="text-slate-400 text-[10px]" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Estado API:</span>
                                <ConexionBadge estado={conexionEstado} />
                            </div>
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
                            Consultar productos por número de documento del médico
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
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-700"
                                />
                            </div>
                            <button type="submit" disabled={buscando || !documento.trim()}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm transition-colors">
                                {buscando
                                    ? <><FaSpinner className="animate-spin text-[10px]" /> Consultando...</>
                                    : <><FaMagnifyingGlass className="text-[10px]" /> Consultar Odoo</>
                                }
                            </button>
                        </form>
                    </div>

                    {/* Resultados */}
                    {buscado && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                            {/* Cabecera + médico + pills */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <FaBoxesStacked className="text-emerald-500 text-sm" />
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                            {medico?.name ? `Productos · ${medico.name}` : `Resultado · Doc: ${documento}`}
                                        </h3>
                                        <p className="text-[8px] font-semibold text-slate-400 uppercase mt-0.5">
                                            Mostrando {productosFiltrados.length} de {productos.length} líneas de producto
                                        </p>
                                    </div>
                                </div>

                                {productos.length > 0 && (
                                    <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[9px] font-bold uppercase shrink-0">
                                        {[
                                            { key: 'todos',   label: 'Todos',     active: 'bg-white text-slate-800 shadow-sm' },
                                            { key: 'Venta',   label: 'Ventas',    active: 'bg-indigo-600 text-white shadow-sm' },
                                            { key: 'Factura', label: 'Facturas',  active: 'bg-amber-600 text-white shadow-sm' },
                                        ].map(({ key, label, active }) => (
                                            <button key={key} type="button" onClick={() => setFiltroOrigen(key)}
                                                className={`px-3 py-1 rounded-md transition-all ${
                                                    filtroOrigen === key ? active : 'text-slate-500 hover:text-slate-800'
                                                }`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sumatoria */}
                            {productos.length > 0 && (
                                <div className="px-6 py-3 bg-slate-800 flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                                            Subtotal {filtroOrigen === 'todos' ? 'general' : filtroOrigen === 'Venta' ? 'ventas' : 'facturas'}
                                        </p>
                                        <p className="text-[20px] font-black text-white leading-none">{fmt(totalGeneral)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase text-emerald-300 tracking-widest mb-0.5">Cantidad total</p>
                                        <p className="text-[16px] font-black text-emerald-200 leading-none">{fmtN(cantidadTotal)} u.</p>
                                    </div>
                                </div>
                            )}

                            {/* Tabla */}
                            {productosFiltrados.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-emerald-600">
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-emerald-500">Código</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-emerald-500">Producto</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-emerald-500 text-center">Origen</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-emerald-500 text-center">Cantidad</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-emerald-500 text-right">Precio Unit.</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {productosFiltrados.map((p, idx) => (
                                            <tr key={`${p.producto_id}-${idx}`} className={`hover:bg-emerald-50/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                                                <td className="px-6 py-3 border-r border-slate-100">
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                                                        <FaBarcode className="text-[8px] text-slate-400" /> {p.codigo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 border-r border-slate-100">
                                                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{p.nombre}</p>
                                                    <p className="text-[8px] text-slate-400 font-medium uppercase">{p.referencia}</p>
                                                </td>
                                                <td className="px-6 py-3 border-r border-slate-100 text-center">
                                                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                                                        p.origen === 'Venta'
                                                            ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                                                            : 'text-amber-600 bg-amber-50 border-amber-100'
                                                    }`}>
                                                        {p.origen}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 border-r border-slate-100 text-center">
                                                    <span className="text-[10px] font-bold text-slate-600 font-mono">{fmtN(p.cantidad)}</span>
                                                </td>
                                                <td className="px-6 py-3 border-r border-slate-100 text-right">
                                                    <span className="text-[10px] font-semibold text-slate-500 font-mono">{fmt(p.precio)}</span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="text-[10px] font-black text-slate-800 font-mono">{fmt(p.subtotal)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-16 text-slate-400">
                                    <FaBoxesStacked className="text-4xl text-slate-200 mb-2 mx-auto block" />
                                    <p className="text-[11px] font-bold uppercase">
                                        {errorMsg || 'No se encontraron productos para este médico.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado inicial */}
                    {!buscado && !buscando && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                            <FaBoxesStacked className="text-4xl text-slate-200 mb-2 mx-auto block" />
                            <p className="text-[11px] font-bold uppercase">
                                Ingresa un número de documento para ver los productos en Odoo
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