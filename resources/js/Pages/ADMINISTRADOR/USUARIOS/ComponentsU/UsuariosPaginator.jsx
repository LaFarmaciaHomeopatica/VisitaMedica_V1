import React from 'react';

export default function UsuariosPaginator({
    currentPage, onPageChange, totalPages,
    itemsPerPage, onItemsPerPageChange,
}) {
    return (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar</span>
                    <input
                        type="number"
                        value={itemsPerPage === 0 ? '' : itemsPerPage}
                        onChange={e => onItemsPerPageChange(e.target.value)}
                        className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">registros</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30"
                >
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-2 px-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Página</span>
                    <input
                        type="number"
                        value={currentPage}
                        readOnly
                        className="w-10 text-center bg-white border border-slate-200 rounded-lg text-[10px] font-black text-blue-600 p-1"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">de {totalPages || 1}</span>
                </div>
                <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30"
                >
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}