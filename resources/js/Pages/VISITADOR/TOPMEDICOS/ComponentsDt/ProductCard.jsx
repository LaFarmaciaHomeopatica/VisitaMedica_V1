import React from 'react';
import { FaBuilding } from 'react-icons/fa6';
import { formatCOP, formatNum } from '../helpers.jsx';

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

    const rankColor = 'text-slate-400';

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

export default ProductCard;
