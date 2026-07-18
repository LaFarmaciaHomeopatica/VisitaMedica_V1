import React from 'react';

export const COLOR_COMPRADO = '#4184F0';
export const COLOR_FORMULADO = '#8b5cf6';

/**
 * Una sola barra dividida proporcionalmente entre "comprado" (azul) y
 * "formulado" (morado) — reemplaza el patrón anterior de dos barras
 * paralelas independientes. El ancho de cada segmento es su participación
 * dentro de la suma comprado + formulado, no contra un máximo externo.
 */
export default function BarraComparativa({ comprado = 0, formulado = 0, height = 'h-1.5', className = '' }) {
    const total = (comprado || 0) + (formulado || 0);
    const pctComprado = total > 0 ? (comprado / total) * 100 : 0;
    const pctFormulado = total > 0 ? (formulado / total) * 100 : 0;

    return (
        <div className={`flex-1 ${height} bg-slate-100 rounded-full overflow-hidden flex gap-[1.5px] ${className}`}>
            {pctComprado > 0 && (
                <div className="h-full rounded-full" style={{ width: `${pctComprado}%`, background: COLOR_COMPRADO }} />
            )}
            {pctFormulado > 0 && (
                <div className="h-full rounded-full" style={{ width: `${pctFormulado}%`, background: COLOR_FORMULADO }} />
            )}
        </div>
    );
}

/**
 * Leyenda compartida "Comprado / Formulado" — una vez por sección, no por
 * fila. La identidad de cada serie nunca depende solo del color (el par
 * azul/morado falla el chequeo de daltonismo), así que el texto siempre
 * acompaña al color en algún punto de la sección.
 */
export function LeyendaCompradoFormulado({ className = '' }) {
    return (
        <div className={`flex items-center gap-3 text-[8px] font-black uppercase text-slate-400 ${className}`}>
            <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOR_COMPRADO }} /> Comprado
            </span>
            <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLOR_FORMULADO }} /> Formulado
            </span>
        </div>
    );
}
