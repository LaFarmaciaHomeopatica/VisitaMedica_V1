import React from 'react';

export default function MedicosPaginator({
    currentItems, selectedIds, onSelectAll,
    itemsPerPage, onItemsPerPageChange,
    currentPage, onPageChange, totalPages,
}) {
    return (
        /* 
           AJUSTES PARA FIJARLO SIN ESPACIOS:
           1. fixed: Lo sacamos del flujo para que no deje "huecos" al cargar.
           2. top-[144px]: Este valor debe ser la suma del Header + Toolbar. 
              Si el Toolbar termina en 144px, este empieza ahí.
           3. w-full: Asegura que cubra todo el ancho.
        */
        <div className="fixed top-[137px] left-0 right-0 z-40 px-6 py-1 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between shadow-sm w-full">
            <div className="flex items-center gap-4">
                {/* Seleccionar todos */}
                <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                    <input
                        type="checkbox"
                        checked={currentItems.length > 0 && currentItems.every(m => selectedIds.includes(m.id))}
                        onChange={e => onSelectAll(e, currentItems)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Todo</span>
                </div>

                {/* Registros por página */}
                <div className="flex items-center gap-2">
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

            {/* Navegación */}
            <div className="flex items-center gap-1">
                <button
                    disabled={currentPage === 1}
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
                        type="number"
                        value={currentPage}
                        min="1"
                        max={totalPages}
                        onChange={e => {
                            const val = Number(e.target.value);
                            if (val >= 1 && val <= totalPages) onPageChange(val);
                        }}
                        className="w-10 text-center bg-white border border-slate-200 rounded-lg text-[10px] font-black text-blue-600 p-1"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">de {totalPages || 1}</span>
                </div>
                <button
                    disabled={currentPage === totalPages || totalPages === 0}
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