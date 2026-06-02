import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import BarraNave from '../barranave';
import {
    FaArrowLeft,
    FaUserDoctor,
    FaAddressCard,
    FaCrown,
    FaBoxOpen,
    FaClipboardList,
    FaBagShopping,
    FaStethoscope,
    FaChevronLeft,
    FaChevronRight,
    FaCartShopping,
    FaFlask,
    FaScaleBalanced,
    FaMagnifyingGlass,
    FaXmark,
    FaBuilding,
    FaChevronDown,
    FaHashtag,
} from 'react-icons/fa6';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(n || 0);

const formatNum = (n) => new Intl.NumberFormat('es-CO').format(n || 0);

// ─── Configuración visual por modo ───────────────────────────────────────────
const MODOS = {
    general: {
        label: 'General',
        icon: <FaScaleBalanced size={10} />,
        gradiente: 'from-[#1C85E8] via-[#02CFE3] to-[#24C765]',
        badge: 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white',
        acento: 'w-1.5 bg-gradient-to-b from-[#1C85E8] via-[#02CFE3] to-[#24C765]',
        activeBtn: 'bg-white text-gray-800 shadow-sm',
    },
    compradores: {
        label: 'Compradores',
        icon: <FaCartShopping size={10} />,
        gradiente: 'from-[#24C765] to-[#15B04F]',
        badge: 'bg-emerald-500 text-white',
        acento: 'w-1.5 bg-[#24C765]',
        activeBtn: 'bg-white text-gray-800 shadow-sm',
    },
    formuladores: {
        label: 'Formuladores',
        icon: <FaFlask size={10} />,
        gradiente: 'from-[#1C85E8] to-[#0A69C2]',
        badge: 'bg-blue-600 text-white',
        acento: 'w-1.5 bg-[#1C85E8]',
        activeBtn: 'bg-white text-gray-800 shadow-sm',
    },
};

// ─── Paginador ────────────────────────────────────────────────────────────────
const Paginador = ({ total, porPagina, pagina, onPagina, onPorPagina }) => {
    const totalPaginas = Math.max(1, Math.ceil(total / (porPagina || 1)));
    return (
        <div className="flex items-center justify-between gap-2">
            {/* Total + input */}
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-[#1C85E8] via-[#02CFE3] to-[#24C765] text-white text-xs font-black px-3 py-1.5 rounded-2xl shadow-sm">
                    {total}
                </div>
                <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                        Mostrar
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={total}
                        value={porPagina}
                        onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v >= 1) onPorPagina(v);
                        }}
                        className="w-14 text-center text-xs font-black text-white bg-white/20 border border-white/30 rounded-xl py-1.5 px-2 outline-none focus:ring-2 focus:ring-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </div>

            {/* Navegación */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onPagina(pagina - 1)}
                    disabled={pagina <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/20 border border-white/30 text-white disabled:opacity-30 hover:bg-white/30 transition-colors"
                >
                    <FaChevronLeft size={9} />
                </button>

                <div className="bg-white/20 border border-white/30 text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1">
                    PÁG. <span>{pagina}</span>
                    <span className="opacity-60">/ {totalPaginas}</span>
                </div>

                <button
                    type="button"
                    onClick={() => onPagina(pagina + 1)}
                    disabled={pagina >= totalPaginas}
                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/20 border border-white/30 text-white disabled:opacity-30 hover:bg-white/30 transition-colors"
                >
                    <FaChevronRight size={9} />
                </button>
            </div>
        </div>
    );
};

// ─── Tarjeta de producto ──────────────────────────────────────────────────────
const ProductCard = ({ item, index, modo }) => {
    const isCompra = modo === 'compradores';
    const isFormula = modo === 'formuladores';
    const isGeneral = modo === 'general';

    const accentLeft = isCompra
        ? 'bg-[#24C765]'
        : isFormula
        ? 'bg-[#1C85E8]'
        : 'bg-gradient-to-b from-[#1C85E8] via-[#02CFE3] to-[#24C765]';

    const rankColor =
        index === 0
            ? 'text-[#24C765]'
            : index === 1
            ? 'text-[#02CFE3]'
            : index === 2
            ? 'text-[#1C85E8]'
            : 'text-slate-400';

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-[22px] flex items-stretch shadow-sm border border-white/40 hover:shadow-md hover:scale-[1.005] transition-all duration-200 overflow-hidden">
            {/* Acento lateral */}
            <div className={`w-1.5 shrink-0 rounded-l-[22px] ${accentLeft}`} />

            {/* Puesto */}
            <div className="flex flex-col items-center justify-center px-3 shrink-0 bg-blue-50/40 border-r border-gray-100/50 min-w-[48px]">
                <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">TOP</span>
                <span className={`text-sm font-black leading-none ${rankColor}`}>
                    #{index + 1}
                </span>
            </div>

            {/* Info del producto */}
            <div className="flex-1 min-w-0 py-2.5 px-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <h4 className="font-black text-gray-800 text-xs leading-tight truncate">
                        {item.nombre || item.producto || 'Sin nombre'}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate">
                        {item.codigo && <span className="mr-1">{item.codigo} ·</span>}
                        {item.laboratorio && (
                            <span className="inline-flex items-center gap-0.5">
                                <FaBuilding size={8} /> {item.laboratorio}
                            </span>
                        )}
                    </p>
                </div>

                {/* Valores según modo */}
                <div className="flex items-center gap-2 shrink-0 bg-blue-50/30 p-2 rounded-xl border border-blue-100/30">
                    {(isCompra || isGeneral) && (
                        <div className="text-right">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                                Comprado
                            </p>
                            <p className="text-xs font-black text-[#24C765] leading-none">
                                {formatNum(item.cantidad_comprada ?? item.cantidad ?? 0)} und.
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 leading-none mt-0.5">
                                {formatCOP(item.valor_comprado ?? item.valor ?? 0)}
                            </p>
                        </div>
                    )}

                    {isGeneral && <div className="w-px h-6 bg-gray-200" />}

                    {(isFormula || isGeneral) && (
                        <div className="text-right">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                                Formulado
                            </p>
                            <p className="text-xs font-black text-[#1C85E8] leading-none">
                                {formatNum(item.cantidad_formulada ?? item.cantidad ?? 0)} und.
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 leading-none mt-0.5">
                                {formatCOP(item.valor_formulado ?? item.valor ?? 0)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Acordeón Laboratorios ────────────────────────────────────────────────────
const LaboratoriosAcordeon = ({ laboratoriosComprados = [], laboratoriosFormulados = [], modo }) => {
    const [abierto, setAbierto] = useState(false);
    const [limite, setLimite] = useState(5);

    // Lista según modo, igual que productos
    const lista = useMemo(() => {
        if (modo === 'compradores') return laboratoriosComprados;
        if (modo === 'formuladores') return laboratoriosFormulados;
        // General: fusionar por nombre de laboratorio
        const mapa = new Map();
        laboratoriosComprados.forEach((l) => {
            mapa.set(l.laboratorio, { ...l, cantidad_comprada: l.cantidad ?? l.cantidad_comprada ?? 0, valor_comprado: l.valor ?? l.valor_comprado ?? 0, cantidad_formulada: 0, valor_formulado: 0 });
        });
        laboratoriosFormulados.forEach((l) => {
            if (mapa.has(l.laboratorio)) {
                const ex = mapa.get(l.laboratorio);
                mapa.set(l.laboratorio, {
                    ...ex,
                    cantidad_formulada: l.cantidad ?? l.cantidad_formulada ?? 0,
                    valor_formulado: l.valor ?? l.valor_formulado ?? 0,
                });
            } else {
                mapa.set(l.laboratorio, {
                    ...l,
                    cantidad_comprada: 0,
                    valor_comprado: 0,
                    cantidad_formulada: l.cantidad ?? l.cantidad_formulada ?? 0,
                    valor_formulado: l.valor ?? l.valor_formulado ?? 0,
                });
            }
        });
        return [...mapa.values()].sort(
            (a, b) =>
                ((b.cantidad_comprada ?? 0) + (b.cantidad_formulada ?? 0)) -
                ((a.cantidad_comprada ?? 0) + (a.cantidad_formulada ?? 0))
        );
    }, [modo, laboratoriosComprados, laboratoriosFormulados]);

    const listaVisible = lista.slice(0, limite);

    const isCompra   = modo === 'compradores';
    const isFormula  = modo === 'formuladores';
    const isGeneral  = modo === 'general';

    const accentBar  = isCompra ? 'bg-[#24C765]' : isFormula ? 'bg-[#1C85E8]' : 'bg-gradient-to-r from-[#1C85E8] via-[#02CFE3] to-[#24C765]';
    const headerBg   = isCompra ? 'bg-emerald-50 border-emerald-100' : isFormula ? 'bg-blue-50 border-blue-100' : 'bg-sky-50 border-sky-100';
    const headerText = isCompra ? 'text-[#24C765]' : isFormula ? 'text-[#1C85E8]' : 'text-sky-600';
    const rankColor  = (i) => i === 0 ? 'text-[#24C765]' : i === 1 ? 'text-[#02CFE3]' : i === 2 ? 'text-[#1C85E8]' : 'text-slate-400';

    return (
        <div className="bg-white/90 rounded-[22px] border border-white/50 shadow-sm overflow-hidden">

            {/* ── Cabecera del acordeón ── */}
            <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 border ${headerBg} transition-colors`}
            >
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${headerText} bg-white border border-current/20`}>
                        <FaBuilding size={14} />
                    </div>
                    <div className="text-left">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${headerText}`}>
                            Top laboratorios
                        </p>
                        <p className="text-xs font-black text-gray-700">
                            {lista.length} laboratorio{lista.length !== 1 ? 's' : ''} registrados
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Selector 5 / 10 */}
                    <div
                        className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden text-[10px] font-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {[5, 10].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLimite(n); }}
                                className={`px-2.5 py-1.5 transition-colors ${
                                    limite === n
                                        ? isCompra
                                            ? 'bg-[#24C765] text-white'
                                            : isFormula
                                            ? 'bg-[#1C85E8] text-white'
                                            : 'bg-sky-500 text-white'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>

                    <FaChevronDown
                        size={12}
                        className={`text-gray-400 transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* ── Lista desplegable ── */}
            <div
                className={`transition-all duration-300 overflow-hidden ${abierto ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                {listaVisible.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-gray-400 italic">
                        Sin laboratorios registrados en este modo.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100/80">
                        {listaVisible.map((lab, i) => {
                            const cantTotal = (lab.cantidad_comprada ?? 0) + (lab.cantidad_formulada ?? 0);
                            const maxCant = listaVisible.reduce(
                                (acc, l) => Math.max(acc, (l.cantidad_comprada ?? 0) + (l.cantidad_formulada ?? 0)),
                                1
                            );
                            const pct = (cantTotal / maxCant) * 100;

                            return (
                                <div key={lab.laboratorio || i} className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {/* Rank */}
                                        <div className="flex flex-col items-center shrink-0 min-w-[32px]">
                                            <span className="text-[8px] font-black text-gray-300 uppercase leading-none">TOP</span>
                                            <span className={`text-sm font-black leading-none ${rankColor(i)}`}>#{i + 1}</span>
                                        </div>

                                        {/* Nombre */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-800 truncate">
                                                {lab.laboratorio || 'Sin dato'}
                                            </p>
                                            {lab.productos !== undefined && (
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                                                    <FaHashtag size={8} /> {lab.productos} producto{lab.productos !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>

                                        {/* Valores según modo */}
                                        <div className="text-right shrink-0 space-y-0.5">
                                            {(isCompra || isGeneral) && (
                                                <p className="text-[10px] font-black text-[#24C765]">
                                                    {formatNum(lab.cantidad_comprada ?? lab.cantidad ?? 0)}
                                                    <span className="text-[9px] font-bold text-gray-300 ml-0.5">compra</span>
                                                </p>
                                            )}
                                            {(isFormula || isGeneral) && (
                                                <p className="text-[10px] font-black text-[#1C85E8]">
                                                    {formatNum(lab.cantidad_formulada ?? lab.cantidad ?? 0)}
                                                    <span className="text-[9px] font-bold text-gray-300 ml-0.5">fórmula</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Barra de progreso */}
                                    <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${accentBar}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Page Principal ───────────────────────────────────────────────────────────
const DetallesTop = ({
    medico,
    mesActual,
    totales = {},
    vistaAnterior = 'general',
    limitAnterior = 10,
    searchAnterior = '',
    // Productos comprados por este médico (array de objetos)
    productosComprados = [],
    // Productos formulados por este médico (array de objetos)
    productosFormulados = [],
    // Laboratorios comprados por este médico
    laboratoriosComprados = [],
    // Laboratorios formulados por este médico
    laboratoriosFormulados = [],
}) => {
    const [modo, setModo] = useState(vistaAnterior || 'general');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);

    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(220);

    useEffect(() => {
        if (!headerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (let e of entries) {
                setHeaderHeight(e.contentBoxSize[0].blockSize + 16);
            }
        });
        ro.observe(headerRef.current);
        return () => ro.disconnect();
    }, []);

    const cfg = MODOS[modo] || MODOS.general;

    // Lista de productos según modo
    const listaBase = useMemo(() => {
        if (modo === 'compradores') return productosComprados;
        if (modo === 'formuladores') return productosFormulados;
        // General: fusionar por código/nombre, manteniendo ambas cantidades
        const mapa = new Map();
        productosComprados.forEach((p) => {
            const key = p.codigo || p.nombre || p.producto;
            mapa.set(key, { ...p });
        });
        productosFormulados.forEach((p) => {
            const key = p.codigo || p.nombre || p.producto;
            if (mapa.has(key)) {
                const existing = mapa.get(key);
                mapa.set(key, {
                    ...existing,
                    cantidad_formulada: p.cantidad_formulada ?? p.cantidad ?? 0,
                    valor_formulado: p.valor_formulado ?? p.valor ?? 0,
                });
            } else {
                mapa.set(key, {
                    ...p,
                    cantidad_comprada: 0,
                    valor_comprado: 0,
                    cantidad_formulada: p.cantidad_formulada ?? p.cantidad ?? 0,
                    valor_formulado: p.valor_formulado ?? p.valor ?? 0,
                });
            }
        });
        // Ordenar por suma total de cantidades
        return [...mapa.values()].sort(
            (a, b) =>
                ((b.cantidad_comprada ?? b.cantidad ?? 0) + (b.cantidad_formulada ?? 0)) -
                ((a.cantidad_comprada ?? a.cantidad ?? 0) + (a.cantidad_formulada ?? 0))
        );
    }, [modo, productosComprados, productosFormulados]);

    // Filtrar por búsqueda
    const listaFiltrada = useMemo(() => {
        if (!busqueda.trim()) return listaBase;
        const q = busqueda.toLowerCase();
        return listaBase.filter(
            (p) =>
                (p.nombre || p.producto || '').toLowerCase().includes(q) ||
                (p.codigo || '').toLowerCase().includes(q) ||
                (p.laboratorio || '').toLowerCase().includes(q)
        );
    }, [listaBase, busqueda]);

    const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / (porPagina || 1)));

    const handleModo = (m) => { setModo(m); setPagina(1); };
    const handlePorPagina = (v) => { setPorPagina(v); setPagina(1); };
    const handlePagina = (p) => setPagina(Math.max(1, Math.min(p, totalPaginas)));

    const listaVisible = useMemo(() => {
        const start = (pagina - 1) * (porPagina || listaFiltrada.length);
        return listaFiltrada.slice(start, start + (porPagina || listaFiltrada.length));
    }, [listaFiltrada, pagina, porPagina]);

    return (
        <>
            <Head title={`Detalle - ${medico?.nombre} - LFH`} />

            {/* ── Header Flotante ── */}
            <header
                ref={headerRef}
                className="fixed top-0 left-0 right-0 z-30 bg-white/85 backdrop-blur-md shadow-sm rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20"
            >
                {/* Fila 1: atrás + info médico */}
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 pt-4 pb-3 flex items-center gap-3">
                    <Link
                        href={`/visitador/top-medicos?mes=${mesActual}&search=${searchAnterior}&vista=${vistaAnterior}&limit=${limitAnterior}`}
                        className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                    >
                        <FaArrowLeft size={13} />
                    </Link>

                    <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1C85E8] shrink-0">
                            <FaUserDoctor size={16} />
                        </div>
                        <div className="min-w-0">
                            <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-0.5 ${cfg.badge}`}>
                                Modo {cfg.label} · Top {limitAnterior}
                            </span>
                            <h1 className="text-xs font-black text-gray-800 uppercase tracking-tight leading-tight truncate">
                                {medico?.nombre}
                            </h1>
                            <p className="text-[10px] text-[#1C85E8] font-bold leading-none mt-0.5">
                                {medico?.especialidad} · Doc: {medico?.documento}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fila 2: gradiente con buscador + modos + paginador */}
                <div className={`bg-gradient-to-r ${cfg.gradiente} rounded-b-[30px] md:rounded-b-[40px] px-4 md:px-6 py-3 space-y-3`}>
                    <div className="max-w-[1440px] mx-auto space-y-2.5">

                        {/* Buscador */}
                        <div className="relative">
                            <FaMagnifyingGlass
                                size={11}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60"
                            />
                            <input
                                type="text"
                                placeholder="Buscar producto, código, laboratorio..."
                                value={busqueda}
                                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                                className="w-full pl-9 pr-9 py-2 rounded-2xl bg-white/15 border border-white/25 text-xs text-white placeholder-white/50 font-medium outline-none focus:ring-2 focus:ring-white/40 transition-all"
                            />
                            {busqueda && (
                                <button
                                    type="button"
                                    onClick={() => { setBusqueda(''); setPagina(1); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                                >
                                    <FaXmark size={10} />
                                </button>
                            )}
                        </div>

                        {/* Botones de modo */}
                        <div className="bg-white/10 p-1 rounded-2xl flex gap-1 border border-white/10">
                            {Object.entries(MODOS).map(([key, m]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleModo(key)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200
                                        ${modo === key ? m.activeBtn : 'text-white hover:bg-white/10'}`}
                                >
                                    {m.icon} {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Paginador */}
                        <Paginador
                            total={listaFiltrada.length}
                            porPagina={porPagina}
                            pagina={pagina}
                            onPagina={handlePagina}
                            onPorPagina={handlePorPagina}
                        />
                    </div>
                </div>
            </header>

            {/* ── Contenido ── */}
            <div
                className="bg-[#E5F4FF] min-h-screen pb-28 font-sans text-gray-800 transition-[padding-top] duration-200"
                style={{ paddingTop: `${headerHeight}px` }}
            >
                <main className="max-w-[1440px] mx-auto px-4 md:px-6 space-y-4 mt-4">

                    {/* Resumen financiero del médico */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(modo === 'general' || modo === 'compradores') && (
                            <div className="bg-white rounded-[22px] p-4 shadow-sm border border-white/40 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                        Total Comprado
                                    </p>
                                    <p className="text-base font-black text-[#24C765] mt-0.5">
                                        {formatCOP(totales.total_comprado)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#24C765] flex items-center justify-center shadow-inner">
                                    <FaBagShopping size={18} />
                                </div>
                            </div>
                        )}
                        {(modo === 'general' || modo === 'formuladores') && (
                            <div className="bg-white rounded-[22px] p-4 shadow-sm border border-white/40 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                        Total Formulado
                                    </p>
                                    <p className="text-base font-black text-[#1C85E8] mt-0.5">
                                        {formatCOP(totales.total_formulado)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1C85E8] flex items-center justify-center shadow-inner">
                                    <FaStethoscope size={18} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Acordeón Laboratorios */}
                    <LaboratoriosAcordeon
                        laboratoriosComprados={laboratoriosComprados}
                        laboratoriosFormulados={laboratoriosFormulados}
                        modo={modo}
                    />

                    {/* Label de sección */}
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                        {cfg.icon}
                        {cfg.label} — {listaFiltrada.length} producto{listaFiltrada.length !== 1 ? 's' : ''}
                        {busqueda && <span className="normal-case font-bold text-gray-300">· "{busqueda}"</span>}
                    </p>

                    {/* Lista de productos */}
                    {listaVisible.length === 0 ? (
                        <div className="text-center py-16 bg-white/50 rounded-[28px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                            {busqueda
                                ? 'Sin resultados para esa búsqueda.'
                                : 'Sin productos registrados en este modo.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {listaVisible.map((item, idx) => {
                                const rankGlobal = (pagina - 1) * porPagina + idx;
                                return (
                                    <ProductCard
                                        key={item.codigo || item.nombre || idx}
                                        item={item}
                                        index={rankGlobal}
                                        modo={modo}
                                    />
                                );
                            })}
                        </div>
                    )}

                   
                </main>

                <BarraNave />
            </div>
        </>
    );
};

export default DetallesTop;