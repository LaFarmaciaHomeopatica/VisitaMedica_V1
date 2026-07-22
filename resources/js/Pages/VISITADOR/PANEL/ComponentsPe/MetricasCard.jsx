import React, { useState, useEffect, useRef } from 'react';
import { FaArrowRotateRight } from 'react-icons/fa6';

// ── permite superar el 100% (igual que Gmetas.jsx) ─────────────────────────
function pct(actual, meta) {
    if (!meta || meta <= 0) return 0;
    return Math.round((actual / meta) * 100);
}

// ── barra de progreso con brillo cuando supera la meta (igual que Gmetas.jsx) ─
function Bar({ actual, meta, color }) {
    const p    = pct(actual, meta);
    const over = meta > 0 && actual >= meta;

    return (
        <div className="w-full bg-gray-100/70 h-3 rounded-full overflow-hidden relative">
            <div
                className="h-3 rounded-full transition-all duration-700 ease-out shadow-inner"
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

/**
 * Tarjeta que muestra las barras de progreso de visitas y ventas del mes.
 *
 * La barra de ventas sigue el mismo patrón que Gmetas.jsx / MetasController:
 * los datos de Odoo (valor_comprado / valor_formulado) NO llegan por props
 * desde el servidor (index() los deja en 0), se piden aparte, una vez, al
 * endpoint /panel/odoo-stats, cacheado 4h en backend. Mientras llegan se
 * muestra un skeleton, y hay un botón para forzar refresco (?forzar=1).
 */
const MetricasCard = ({
    porcentaje,
    visitasEfectivasCount,
    meta,
    metaDinero,
    mes, // 'YYYY-MM'
}) => {
    const [valorComprado, setValorComprado]   = useState(0);
    const [valorFormulado, setValorFormulado] = useState(0);
    const [odooCargado, setOdooCargado]       = useState(false);
    const [odooCargando, setOdooCargando]     = useState(false);
    const [desdeCache, setDesdeCache]         = useState(true);

    // Token para descartar respuestas obsoletas si cambia el mes a mitad de camino
    const cargaTokenRef = useRef(0);

    const cargarOdoo = async (forzar = false) => {
        const miToken = ++cargaTokenRef.current;
        setOdooCargando(true);
        if (forzar) setOdooCargado(false);

        try {
            const url = `/panel/odoo-stats?mes=${mes}${forzar ? '&forzar=1' : ''}`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();

            if (cargaTokenRef.current !== miToken) return; // respuesta obsoleta

            setValorComprado(data.valor_comprado ?? 0);
            setValorFormulado(data.valor_formulado ?? 0);
            setDesdeCache(!!data.desde_cache);
        } catch (e) {
            // si falla, simplemente se queda en 0 y se puede reintentar con el botón
        } finally {
            if (cargaTokenRef.current === miToken) {
                setOdooCargado(true);
                setOdooCargando(false);
            }
        }
    };

    useEffect(() => {
        cargarOdoo(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mes]);

    const totalValor      = valorComprado + valorFormulado;
    const porcentajeVentas = pct(totalValor, metaDinero);

    return (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50 mt-4 text-slate-800">

            {/* — Barra de visitas — */}
            <div className="flex justify-between items-end mb-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                    Cumplimiento de visitas
                </p>
                <span className="text-[#1C85E8] font-black text-sm">{porcentaje}%</span>
            </div>
            <div className="w-full bg-gray-100/70 h-3 rounded-full overflow-hidden">
                <div
                    className="bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] h-3 rounded-full transition-all duration-700 ease-out shadow-inner"
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                />
            </div>
            <div className="flex justify-between text-[11px] mt-1.5 text-gray-500 font-semibold mb-5">
                <span>{visitasEfectivasCount} de {meta} visitas</span>
                <span className="uppercase text-[9px] tracking-wider text-gray-400">Meta mes</span>
            </div>

            {/* — Barra de ventas (Odoo: comprado + formulado) — */}
            <div className="border-t border-gray-100/80 pt-4">
                <div className="flex justify-between items-end mb-1.5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                        Cumplimiento de ventas
                    </p>
                    <div className="flex items-center gap-2">
                        {!odooCargado ? (
                            <span className="h-3 w-3 rounded-full border-2 border-emerald-300 border-t-transparent animate-spin inline-block" />
                        ) : (
                            <button
                                onClick={() => cargarOdoo(true)}
                                disabled={odooCargando}
                                title="Volver a consultar Odoo, ignorando la caché de 4 horas"
                                className="text-gray-300 hover:text-emerald-600 transition-colors disabled:opacity-50"
                            >
                                <FaArrowRotateRight className={`h-2.5 w-2.5 ${odooCargando ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <span className={`font-black text-sm ${porcentajeVentas >= 100 ? 'text-emerald-600' : 'text-[#24C765]'}`}>
                            {odooCargado ? `${porcentajeVentas}%` : '—'}
                        </span>
                    </div>
                </div>

                {!odooCargado ? (
                    // ── Skeleton mientras llega el dato de Odoo ──
                    <div className="animate-pulse space-y-1.5">
                        <div className="w-full h-3 bg-gray-100 rounded-full" />
                        <div className="h-2.5 w-2/3 bg-gray-100 rounded" />
                    </div>
                ) : (
                    <>
                        <Bar actual={totalValor} meta={metaDinero} color="#24C765" />
                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-500 font-semibold">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#24C765] inline-block" />
                                Comp: ${new Intl.NumberFormat('es-CO').format(valorComprado)}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] inline-block" />
                                Form: ${new Intl.NumberFormat('es-CO').format(valorFormulado)}
                            </span>
                        </div>
                        <div className="text-right text-[9px] mt-1 text-gray-400 uppercase tracking-wider">
                            Meta: ${new Intl.NumberFormat('es-CO').format(metaDinero)} · Odoo{desdeCache ? ' (caché)' : ''}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MetricasCard;