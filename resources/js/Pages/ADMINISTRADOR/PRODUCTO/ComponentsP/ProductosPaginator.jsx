import React from 'react';

export default function ProductosPaginator({
    currentItems, selectedIds, onSelectAll,
    itemsPerPage, onItemsPerPageChange,
    currentPage, onPageChange, totalPages,
}) {
    return (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                    <input
                        type="checkbox"
                        onChange={e => onSelectAll(e, currentItems)}
                        checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Todo</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar</span>
                    <input
                        type="number"
                        value={itemsPerPage === 0 ? '' : itemsPerPage}
                        onChange={e => onItemsPerPageChange(e.target.value)}
                        className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 disabled:opacity-30"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">
                    {currentPage} de {totalPages || 1}
                </span>

                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 disabled:opacity-30"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}