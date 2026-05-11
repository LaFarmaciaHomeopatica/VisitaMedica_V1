import React from 'react';

export default function MedicosPaginator({
    currentItems, selectedIds, onSelectAll,
    itemsPerPage, onItemsPerPageChange,
    currentPage, onPageChange, totalPages,
}) {

    // FUNCIÓN DE LIMPIEZA RADICAL
    const validateAndSend = (value, callback, max = null) => {
        // 1. Eliminamos cualquier cosa que no sea un número (letras, puntos, signos -)
        const cleanValue = value.replace(/\D/g, '');

        if (cleanValue === '') {
            callback(0);
            return;
        }

        let num = parseInt(cleanValue, 10);

        // 2. Si el número es 0, lo forzamos a 1 para que no rompa la lógica de paginación
        if (num < 1) num = 1;

        // 3. Si hay un máximo (para páginas), lo respetamos
        if (max !== null && num > max) num = max;

        callback(num);
    };

    return (
        <div className="fixed top-[137px] left-0 right-0 z-40 px-6 py-1 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between shadow-sm w-full">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                    <input
                        type="checkbox"
                        checked={currentItems.length > 0 && currentItems.every(m => selectedIds.includes(m.id))}
                        onChange={e => onSelectAll(e, currentItems)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Todo</span>
                </div>

                {/* REGISTROS POR PÁGINA */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar</span>
                    <input
                        type="text" // Cambiamos a text para anular las flechitas del navegador
                        inputMode="numeric"
                        value={itemsPerPage || ''}
                        onChange={e => validateAndSend(e.target.value, onItemsPerPageChange)}
                        className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">registros</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
                >
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="flex items-center gap-2 px-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Página</span>
                    <input
                        type="text" // Cambiamos a text para anular las flechitas del navegador
                        inputMode="numeric"
                        value={currentPage || ''}
                        onChange={e => validateAndSend(e.target.value, onPageChange, totalPages)}
                        className="w-10 text-center bg-white border border-slate-200 rounded-lg text-[10px] font-black text-blue-600 p-1 outline-none"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">de {Math.max(1, totalPages)}</span>
                </div>

                <button
                    type="button"
                    disabled={currentPage >= totalPages || totalPages === 0}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
                >
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}