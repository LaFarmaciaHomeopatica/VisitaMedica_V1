import React from 'react';
import { FaBagShopping, FaStethoscope } from 'react-icons/fa6';
import { formatCOP, formatNum } from '../helpers.jsx';

// ─── Resumen financiero (2 tarjetas KPI) ──────────────────────────────────────
const ResumenFinanciero = ({ modo, totales }) => (
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
);

export default ResumenFinanciero;
