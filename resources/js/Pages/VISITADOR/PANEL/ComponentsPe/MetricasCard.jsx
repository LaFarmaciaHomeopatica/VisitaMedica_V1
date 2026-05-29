import React from 'react';

/**
 * Tarjeta que muestra las barras de progreso de visitas y ventas del mes.
 */
const MetricasCard = ({
    porcentaje,
    porcentajeVentas,
    visitasEfectivasCount,
    meta,
    ventasActuales,
    metaDinero,
}) => (
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

        {/* — Barra de ventas — */}
        <div className="border-t border-gray-100/80 pt-4">
            <div className="flex justify-between items-end mb-1.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                    Cumplimiento de ventas
                </p>
                <span className="text-[#24C765] font-black text-sm">{porcentajeVentas}%</span>
            </div>
            <div className="w-full bg-gray-100/70 h-3 rounded-full overflow-hidden">
                <div
                    className="bg-gradient-to-r from-[#02CFE3] to-[#24C765] h-3 rounded-full transition-all duration-700 ease-out shadow-inner"
                    style={{ width: `${Math.min(porcentajeVentas, 100)}%` }}
                />
            </div>
            <div className="flex justify-between text-[11px] mt-1.5 text-gray-500 font-semibold">
                <span>${new Intl.NumberFormat('es-CO').format(ventasActuales)} vendidos</span>
                <span>Meta: ${new Intl.NumberFormat('es-CO').format(metaDinero)}</span>
            </div>
        </div>
    </div>
);

export default MetricasCard;