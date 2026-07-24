import React, { useState, useEffect, useRef } from 'react';
import { FaArrowRotateRight, FaFlagCheckered } from 'react-icons/fa6';

// ── Formateador de moneda ───────────────────────────────────────────────────
const formatearCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(valor || 0);
};

// ── Permite superar el 100% ──────────────────────────────────────────────────
function pct(actual, meta) {
    if (!meta || meta <= 0) return 0;
    return Math.round((actual / meta) * 100);
}

// ── Barra de progreso ────────────────────────────────────────────────────────
function Bar({ actual, meta, color }) {
    const p    = pct(actual, meta);
    const over = meta > 0 && actual >= meta;

    return (
        <div className="w-full bg-slate-100/80 h-2.5 sm:h-3 rounded-full overflow-hidden relative">
            <div
                className="h-full rounded-full transition-all duration-700 ease-out shadow-inner"
                style={{ width: `${Math.min(p, 100)}%`, background: over ? '#10b981' : color }}
            />
            {over && (
                <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{ background: 'linear-gradient(90deg, #10b981, #34d399)', opacity: 0.85 }}
                />
            )}
        </div>
    );
}

const MetricasCard = ({
    porcentaje,
    visitasEfectivasCount,
    meta,
    metaDinero,
    mes,
}) => {
    const [valorComprado, setValorComprado]   = useState(0);
    const [valorFormulado, setValorFormulado] = useState(0);
    const [odooCargado, setOdooCargado]       = useState(false);
    const [odooCargando, setOdooCargando]     = useState(false);
    const [desdeCache, setDesdeCache]         = useState(true);

    const cargaTokenRef = useRef(0);

    const cargarOdoo = async (forzar = false) => {
        const miToken = ++cargaTokenRef.current;
        setOdooCargando(true);
        if (forzar) setOdooCargado(false);

        try {
            const url = `/panel/odoo-stats?mes=${mes}${forzar ? '&forzar=1' : ''}`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();

            if (cargaTokenRef.current !== miToken) return;

            setValorComprado(data.valor_comprado ?? 0);
            setValorFormulado(data.valor_formulado ?? 0);
            setDesdeCache(!!data.desde_cache);
        } catch (e) {
            // Manejo de error
        } finally {
            if (cargaTokenRef.current === miToken) {
                setOdooCargado(true);
                setOdooCargando(false);
            }
        }
    };

    useEffect(() => {
        cargarOdoo(false);
    }, [mes]);

    const totalValor       = valorComprado + valorFormulado;
    const porcentajeVentas = pct(totalValor, metaDinero);
    const faltanteMeta     = metaDinero - totalValor;

    return (
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-white/60 mt-4 text-slate-800">

            {/* ── SECCIÓN: CUMPLIMIENTO DE VISITAS ── */}
            <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Cumplimiento de visitas
                    </p>
                    <span className="text-[#1C85E8] font-black text-xs sm:text-sm">{porcentaje}%</span>
                </div>
                
                <div className="w-full bg-slate-100/80 h-2.5 sm:h-3 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] h-full rounded-full transition-all duration-700 ease-out shadow-inner"
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                </div>
                
                <div className="flex justify-between text-[10px] sm:text-[11px] mt-1.5 text-slate-500 font-medium">
                    <span>{visitasEfectivasCount} de {meta} visitas</span>
                    <span className="uppercase text-[9px] text-slate-400 font-bold">Meta mes</span>
                </div>
            </div>

            {/* ── SECCIÓN: CUMPLIMIENTO DE VENTAS ── */}
            <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">
                            Cumplimiento de ventas
                        </p>
                        {odooCargado && (
                            <p className="text-xs sm:text-sm font-black text-slate-700 mt-0.5">
                                Total: <span className="text-emerald-600">{formatearCOP(totalValor)}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {!odooCargado ? (
                            <span className="h-3 w-3 rounded-full border-2 border-emerald-300 border-t-transparent animate-spin inline-block" />
                        ) : (
                            <button
                                onClick={() => cargarOdoo(true)}
                                disabled={odooCargando}
                                title="Recargar Odoo"
                                className="p-1 text-slate-300 hover:text-emerald-600 transition-colors disabled:opacity-50"
                            >
                                <FaArrowRotateRight className={`h-2.5 w-2.5 ${odooCargando ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <span className={`font-black text-xs sm:text-sm ${porcentajeVentas >= 100 ? 'text-emerald-600' : 'text-[#24C765]'}`}>
                            {odooCargado ? `${porcentajeVentas}%` : '—'}
                        </span>
                    </div>
                </div>

                {!odooCargado ? (
                    <div className="animate-pulse space-y-2 py-1">
                        <div className="w-full h-2.5 bg-slate-100 rounded-full" />
                        <div className="h-2 w-2/3 bg-slate-100 rounded" />
                    </div>
                ) : (
                    <>
                        <Bar actual={totalValor} meta={metaDinero} color="#24C765" />

                        {/* Desglose de Comp y Form */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 text-[10px] sm:text-[11px] text-slate-600 font-semibold">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#24C765] inline-block shrink-0" />
                                Comp: <strong className="text-slate-700">{formatearCOP(valorComprado)}</strong>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#8b5cf6] inline-block shrink-0" />
                                Form: <strong className="text-slate-700">{formatearCOP(valorFormulado)}</strong>
                            </span>
                        </div>
{/* ── BLOQUE DESTACADO DE METAS Y FALTANTE ── */}
<div className="mt-3.5 pt-2 flex flex-col gap-2.5">
    
    {/* 1. Tarjeta de Faltante / Logro (Estilo Alerta/Progreso) */}
    <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
        faltanteMeta <= 0 
            ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
            : 'bg-amber-100/80 border-amber-300 text-amber-950 shadow-sm'
    }`}>
        <span className="text-[10px] uppercase font-black tracking-wider opacity-90">
            {faltanteMeta <= 0 ? 'Estado Meta' : 'Falta para la meta'}
        </span>
        <span className="text-xs sm:text-sm font-black tracking-tight">
            {faltanteMeta <= 0 
                ? '¡Meta alcanzada! 🎉' 
                : formatearCOP(faltanteMeta)}
        </span>
    </div>

    {/* 2. Tarjeta Destacada de Meta Total (Estilo Tarjeta de Objetivo - Azul / Slate Oscuro) */}
    <div className="p-3 rounded-2xl bg-blue-950 text-white border border-blue-900/80 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-800/60 rounded-lg text-blue-300">
                <FaFlagCheckered className="text-xs" />
            </div>
            <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-blue-200 block">
                    Meta del Mes
                </span>
                {desdeCache && (
                    <span className="text-[8px] text-blue-300/80 font-medium block uppercase -mt-0.5">
                        Origen: Odoo
                    </span>
                )}
            </div>
        </div>
        <div className="text-right">
            <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                {formatearCOP(metaDinero)}
            </span>
        </div>
    </div>

</div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MetricasCard;