import React from 'react';

export default function VisitasPaginator({
    currentPage, onPageChange, totalPages,
    itemsPerPage, onItemsPerPageChange,
}) {
    return (
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase">Mostrar</span>
                <input
                    type="number"
                    value={itemsPerPage === 0 ? '' : itemsPerPage}
                    onChange={e => onItemsPerPageChange(e.target.value)}
                    className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 disabled:opacity-20 hover:bg-white rounded-full transition-colors"
                >
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 19l-7-7 7-7" strokeWidth="3" />
                    </svg>
                </button>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                    Página {currentPage} de {totalPages || 1}
                </span>
                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 disabled:opacity-20 hover:bg-white rounded-full transition-colors"
                >
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 5l7 7-7 7" strokeWidth="3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}