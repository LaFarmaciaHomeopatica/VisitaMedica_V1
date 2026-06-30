import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
    FaPhoneFlip,
    FaLocationDot,
    FaBell,
    FaSpinner, // ✅ Añadido para el indicador de carga
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
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] text-white text-xs font-black px-3 py-1.5 rounded-2xl shadow-sm">
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
        <div className="bg-white/80 backdrop-blur-md rounded-xl flex items-stretch shadow-sm border border-white/40 hover:shadow-md hover:scale-[1.002] transition-all duration-200 overflow-hidden w-full">
            <div className={`w-1 shrink-0 rounded-l-xl ${accentLeft}`} />

            <div className="flex flex-col items-center justify-center px-2.5 shrink-0 bg-blue-50/25 border-r border-gray-100/40 min-w-[44px]">
                <span className="text-[8px] font-black text-gray-400/80 uppercase tracking-wider leading-none mb-0.5">TOP</span>
                <span className={`text-xs font-black leading-none ${rankColor}`}>
                    #{index + 1}
                </span>
            </div>

            <div className="flex-1 min-w-0 py-2 px-3.5 flex flex-col justify-between gap-1.5">
                <div className="w-full min-w-0">
                    <h4 className="font-bold text-gray-800 text-xs leading-tight truncate">
                        {item.nombre || item.producto || 'Sin nombre'}
                    </h4>
                </div>

                <div className="flex items-center justify-between gap-3 w-full py-0.5 min-w-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {(isCompra || isGeneral) && (
                            <div className="text-left flex-1 min-w-[75px] max-w-[110px]">
                                <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                                    Comprado
                                </p>
                                <p className="text-[11px] font-black text-[#24C765] leading-none">
                                    {formatNum(item.cantidad_comprada ?? item.cantidad ?? 0)} <span className="text-[9px] font-bold text-gray-400/80">und.</span>
                                </p>
                                <p className="text-[9px] font-black text-gray-700 leading-none mt-0.5 truncate">
                                    {formatCOP(item.valor_comprado ?? item.valor ?? 0)}
                                </p>
                            </div>
                        )}

                        {isGeneral && <div className="w-px h-5 bg-gray-200/80 shrink-0 mx-0.5" />}

                        {(isFormula || isGeneral) && (
                            <div className="text-left flex-1 min-w-[75px] max-w-[110px]">
                                <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                                    Formulado
                                </p>
                                <p className="text-[11px] font-black text-[#1C85E8] leading-none">
                                    {formatNum(item.cantidad_formulada ?? item.cantidad ?? 0)} <span className="text-[9px] font-bold text-gray-400/80">und.</span>
                                </p>
                                <p className="text-[9px] font-black text-gray-700 leading-none mt-0.5 truncate">
                                    {formatCOP(item.valor_formulado ?? item.valor ?? 0)}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 shrink-0 flex justify-end">
                        {item.laboratorio && (
                            <p className="text-[9px] text-gray-400 font-bold truncate uppercase tracking-tight flex items-center gap-0.5 bg-gray-50/60 border border-gray-100/50 px-1.5 py-0.5 rounded-md max-w-[90px]">
                                <FaBuilding size={7.5} className="text-gray-400/70 shrink-0" />
                                <span className="truncate">{item.laboratorio}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Acordeón Laboratorios ────────────────────────────────────────────────────
const LaboratoriosAcordeon = ({ laboratoriosComprados = [], laboratoriosFormulados = [], modo }) => {
    const [abierto, setAbierto] = useState(false);
    const [limite, setLimite] = useState(5);

    const lista = useMemo(() => {
        if (modo === 'compradores') return laboratoriosComprados;
        if (modo === 'formuladores') return laboratoriosFormulados;
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

    const isCompra  = modo === 'compradores';
    const isFormula = modo === 'formuladores';
    const isGeneral = modo === 'general';

    const accentBar  = isCompra ? 'bg-[#24C765]' : isFormula ? 'bg-[#1C85E8]' : 'bg-gradient-to-r from-[#1C85E8] via-[#02CFE3] to-[#24C765]';
    const headerBg   = isCompra ? 'bg-emerald-50 border-emerald-100' : isFormula ? 'bg-blue-50 border-blue-100' : 'bg-sky-50 border-sky-100';
    const headerText = isCompra ? 'text-[#24C765]' : isFormula ? 'text-[#1C85E8]' : 'text-sky-600';
    const rankColor  = (i) => i === 0 ? 'text-[#24C765]' : i === 1 ? 'text-[#02CFE3]' : i === 2 ? 'text-[#1C85E8]' : 'text-slate-400';

    return (
        <div className="bg-white/90 rounded-[22px] border border-white/50 shadow-sm overflow-hidden">
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

            <div className={`transition-all duration-300 overflow-hidden ${abierto ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
                                        <div className="flex flex-col items-center shrink-0 min-w-[32px]">
                                            <span className="text-[8px] font-black text-gray-300 uppercase leading-none">TOP</span>
                                            <span className={`text-sm font-black leading-none ${rankColor(i)}`}>#{i + 1}</span>
                                        </div>

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
    periodoActivo = 'mes_actual',
    vistaAnterior = 'general',
    limitAnterior = 10,
    searchAnterior = '',
    odooDatosPesados = null, // 💡 Recibimos el objeto perezoso (Inertia::lazy)
}) => {
    const [modo, setModo] = useState(vistaAnterior || 'general');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);
    const [mostrarDetalles, setMostrarDetalles] = useState(false);

    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(160);

    // ── Disparador en segundo plano para Odoo ──
    useEffect(() => {
        if (!odooDatosPesados) {
            router.reload({ only: ['odooDatosPesados'] });
        }
    }, [periodoActivo]); // Si cambia el periodo, también se refresca automáticamente

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

    // Mapeamos los datos desempaquetados del objeto perezoso
    const totales = odooDatosPesados?.totales || {};
    const productosComprados = odooDatosPesados?.productosComprados || [];
    const productosFormulados = odooDatosPesados?.productosFormulados || [];
    const laboratoriosComprados = odooDatosPesados?.laboratoriosComprados || [];
    const laboratoriosFormulados = odooDatosPesados?.laboratoriosFormulados || [];
    const puestoReal = odooDatosPesados?.puestoReal ?? null;

    const cfg = MODOS[modo] || MODOS.general;

    const queryParams = new URLSearchParams(window.location.search);
    const origen = queryParams.get('origen') || '';

    let backUrl = `/visitador/top-medicos?mes=${mesActual}&search=${searchAnterior}&vista=${vistaAnterior}&limit=${limitAnterior}`;
    if (origen === 'listado') backUrl = '/ListadoMedicos';
    else if (origen === 'panel') backUrl = '/panel';

    const googleMapsUrl = medico.geolocalizacion
        ? `https://www.google.com/maps/search/?api=1&query=${medico.geolocalizacion}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(medico.direccion_detalles || '')}`;

    const handlePeriodoChange = (key) => {
        router.get(
            `/visitador/top-medicos/${medico.documento}`,
            { mes: mesActual, periodo: key, vista: modo, limit: limitAnterior, search: searchAnterior, origen },
            { preserveScroll: true, preserveState: true }
        );
    };

    const listaBase = useMemo(() => {
        if (modo === 'compradores') return productosComprados;
        if (modo === 'formuladores') return productosFormulados;
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
        return [...mapa.values()].sort(
            (a, b) =>
                ((b.cantidad_comprada ?? b.cantidad ?? 0) + (b.cantidad_formulada ?? 0)) -
                ((a.cantidad_comprada ?? a.cantidad ?? 0) + (a.cantidad_formulada ?? 0))
        );
    }, [modo, productosComprados, productosFormulados]);

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

    const handleModo      = (m) => { setModo(m); setPagina(1); };
    const handlePorPagina = (v) => { setPorPagina(v); setPagina(1); };
    const handlePagina    = (p) => setPagina(Math.max(1, Math.min(p, totalPaginas)));

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
                <div className="max-w-[1440px] mx-auto px-4 md:px-6 pt-4 pb-3 flex items-center gap-3">
                    <Link
                        href={backUrl}
                        className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                    >
                        <FaArrowLeft size={13} />
                    </Link>

                    <div className="relative flex-grow max-w-4xl">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                            <FaMagnifyingGlass className="text-xs md:text-sm" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar producto, código, laboratorio..."
                            value={busqueda}
                            disabled={!odooDatosPesados}
                            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                            className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700 disabled:opacity-50"
                        />
                        {busqueda && (
                            <button
                                type="button"
                                onClick={() => { setBusqueda(''); setPagina(1); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <FaXmark size={12} />
                            </button>
                        )}
                    </div>
                </div>

                <div className={`bg-gradient-to-r ${cfg.gradiente} rounded-b-[30px] md:rounded-b-[40px] px-4 md:px-6 py-3 space-y-3`}>
                    <div className="max-w-[1440px] mx-auto space-y-2.5">
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

                    {/* ── Hero del médico (Carga siempre al instante) ── */}
                    <section className="bg-gradient-to-br from-[#1C85E8] via-[#02CFE3] to-[#24C765] p-6 rounded-[30px] shadow-lg text-white relative">
                        <div className="flex items-start gap-4">

                            {/* Avatar puesto ranking */}
                            {(() => {
                                let colorFondo = "bg-white/20";
                                if (puestoReal === 1) colorFondo = "bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-200 border-2";
                                if (puestoReal === 2) colorFondo = "bg-gradient-to-br from-slate-300 to-slate-500 border-slate-200 border-2";
                                if (puestoReal === 3) colorFondo = "bg-gradient-to-br from-orange-400 to-amber-700 border-orange-300 border-2";
                                return (
                                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-white/30 backdrop-blur-md transition-all duration-300 ${colorFondo}`}>
                                        {puestoReal === 1 && <FaCrown size={12} className="text-white mb-0.5 animate-bounce" />}
                                        <span className="text-base font-black text-white leading-none">
                                            {!odooDatosPesados ? <FaSpinner className="animate-spin text-sm text-white/70" /> : puestoReal ? `#${puestoReal}` : '—'}
                                        </span>
                                    </div>
                                );
                            })()}

                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-extrabold text-white leading-tight">
                                    {medico?.nombre}
                                </h2>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="text-[9px] font-black uppercase bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
                                        {medico?.especialidad || 'General'}
                                    </span>
                                    <Link
                                        href={`/visitador/alertas/${medico.documento}?mes=${mesActual}`}
                                        className="bg-amber-400/90 hover:bg-amber-400 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-300/40 transition-all active:scale-95 flex items-center gap-1"
                                    >
                                        <FaBell size={9} /> Alerta
                                    </Link>
                                    <button
                                        onClick={() => setMostrarDetalles(!mostrarDetalles)}
                                        className="bg-white/20 hover:bg-white/35 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/20 transition-all active:scale-95"
                                    >
                                        {mostrarDetalles ? 'Cerrar' : 'Info'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Datos detallados — desplegable */}
                        {mostrarDetalles && (
                            <div className="bg-white/90 backdrop-blur-md rounded-[20px] border border-white/50 mt-5 p-5 text-slate-800 animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Documento</p>
                                            <p className="text-xs font-bold text-gray-700 mt-0.5">
                                                {(medico?.tipo_documento?.nombre || '') + ' ' + (medico?.documento || 'N/A')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">ID Registro</p>
                                            <p className="text-xs font-bold text-gray-700 mt-0.5">#{medico?.id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 sm:border-l sm:pl-5 border-gray-100">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Contacto Directo</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs font-bold text-gray-700">{medico?.telefono_contacto || '---'}</p>
                                                {medico?.telefono_contacto && (
                                                    <a href={`tel:${medico.telefono_contacto}`} className="text-[#24C765] hover:scale-110 transition-transform">
                                                        <FaPhoneFlip className="text-[11px]" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Horario de Atención</p>
                                            <p className="text-xs font-bold text-gray-700 mt-0.5">{medico?.horario_atencion || 'No definido'}</p>
                                        </div>
                                    </div>

                                    <div className="sm:border-l sm:pl-5 border-gray-100 flex flex-col justify-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Dirección de Consultorio</p>
                                        <div className="flex items-start gap-2 mt-0.5">
                                            <p className="text-xs font-bold text-gray-700 leading-tight flex-1">
                                                {medico?.direccion_detalles || 'Sin dirección registrada'}
                                            </p>
                                            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-[#1C85E8] shrink-0 hover:scale-110 transition-transform mt-0.5">
                                                <FaLocationDot className="text-sm" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ── Selector de período ── */}
                    <div className="flex flex-wrap items-center gap-2 px-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-1">Período:</p>
                        {[
                            { key: 'mes_actual', label: 'Mes Actual' },
                            { key: '3m',         label: '3 meses' },
                            { key: '6m',         label: '6 meses' },
                            { key: '1y',         label: '1 año' },
                            { key: '2y',         label: '2 años' },
                            { key: 'all',        label: 'Todo' },
                        ].map(p => (
                            <button
                                key={p.key}
                                onClick={() => handlePeriodoChange(p.key)}
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border active:scale-95 ${
                                    periodoActivo === p.key
                                        ? 'bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] text-white border-transparent shadow-sm shadow-blue-100'
                                        : 'bg-white/80 backdrop-blur-md text-gray-400 border-white/40 hover:text-[#1C85E8] hover:border-[#1C85E8]/30'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* ── VALIDACIÓN DE CARGA DIFERIDA DE ODOO ── */}
                    {!odooDatosPesados ? (
                        /* INDICADOR DE CARGA SUTIL Y CORPORATIVO */
                        <div className="bg-white/80 backdrop-blur-md border border-blue-100 rounded-[28px] py-16 text-center shadow-sm flex flex-col items-center justify-center gap-3">
                            <FaSpinner className="text-2xl text-[#1C85E8] animate-spin" />
                            <div className="text-center">
                                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                    Sincronizando Odoo...
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    Trayendo montos financieros, laboratorios y listado de productos.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* VISTA COMPLETA CUANDO LLEGAN LOS DATOS */
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {modo === 'formuladores' && (
                                <div className="bg-blue-50/80 border border-blue-200 text-blue-700 text-[10px] font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider text-center max-w-md mx-auto">
                                    💡 La formulación no está registrada en Odoo (valores en $0)
                                </div>
                            )}

                            {/* Resumen financiero */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(modo === 'general' || modo === 'compradores') && (
                                    <div className="bg-white/80 backdrop-blur-md rounded-xl py-2.5 px-3.5 shadow-sm border border-white/40 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2 w-full">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider leading-none">Total Comprado</p>
                                                <p className="text-[10.5px] font-black text-[#24C765] leading-none shrink-0">
                                                    {formatNum(totales.unidades_compradas ?? 0)} <span className="text-[8.5px] font-bold text-gray-400/70">ud</span>
                                                </p>
                                            </div>
                                            <p className="text-base font-black text-gray-800 mt-1.5 leading-none">
                                                {formatCOP(totales.total_comprado)}
                                            </p>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#24C765] flex items-center justify-center shadow-inner shrink-0">
                                            <FaBagShopping size={15} />
                                        </div>
                                    </div>
                                )}

                                {(modo === 'general' || modo === 'formuladores') && (
                                    <div className="bg-white/80 backdrop-blur-md rounded-xl py-2.5 px-3.5 shadow-sm border border-white/40 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between gap-2 w-full">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider leading-none">Total Formulado</p>
                                                <p className="text-[10.5px] font-black text-[#1C85E8] leading-none shrink-0">
                                                    {formatNum(totales.unidades_formuladas ?? 0)} <span className="text-[8.5px] font-bold text-gray-400/70">ud</span>
                                                </p>
                                            </div>
                                            <p className="text-base font-black text-gray-800 mt-1.5 leading-none">
                                                {formatCOP(totales.total_formulado)}
                                            </p>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1C85E8] flex items-center justify-center shadow-inner shrink-0">
                                            <FaStethoscope size={15} />
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

                            {/* Label sección */}
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                                {cfg.icon}
                                {cfg.label} — {listaFiltrada.length} producto{listaFiltrada.length !== 1 ? 's' : ''}
                                {busqueda && <span className="normal-case font-bold text-gray-300">· "{busqueda}"</span>}
                            </p>

                            {/* Lista de productos */}
                            {listaVisible.length === 0 ? (
                                <div className="text-center py-16 bg-white/50 rounded-[28px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                                    {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin productos registrados en este modo.'}
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
                        </div>
                    )}

                </main>

                <BarraNave />
            </div>
        </>
    );
};

export default DetallesTop;