import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

export default function MedicosTempPaginator({
    currentPage, onPageChange, totalPages,
    itemsPerPage, onItemsPerPageChange,
}) {
    return (
        <div className="bg-white px-8 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-8">
                {/* Checkbox seleccionar todo (decorativo por ahora) */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Todo</span>
                </div>

                {/* Items por página */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mostrar</span>
                    <input
                        type="number"
                        value={itemsPerPage === 0 ? '' : itemsPerPage}
                        onChange={e => onItemsPerPageChange(e.target.value)}
                        className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Navegación */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <FaChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {currentPage} DE {totalPages || 1}
                </span>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <FaChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}