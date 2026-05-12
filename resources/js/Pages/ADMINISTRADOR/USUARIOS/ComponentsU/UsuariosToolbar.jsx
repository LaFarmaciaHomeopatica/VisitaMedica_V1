import React from 'react';

export default function UsuariosToolbar({
    searchTerm,
    onSearchChange,
    onNew,
    // Props de paginación integradas
    currentPage,
    onPageChange,
    totalPages,
    itemsPerPage,
    onItemsPerPageChange
}) {
    return (
        <div className="fixed top-20 left-0 right-0 z-50 bg-white border-b border-slate-200 w-full shadow-sm px-4 py-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto lg:overflow-visible">

                {/* 1. SECCIÓN IZQUIERDA: BUSCADOR (ESTILO MÉDICOS) */}
                <div className="flex items-center gap-3 min-w-fit">
                    <div className="relative w-48 lg:w-64 group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700"
                        />
                    </div>
                </div>

                {/* 2. SECCIÓN CENTRAL: PAGINACIÓN (DISEÑO MÉDICOS) */}
                <div className="flex items-center gap-4 border-l border-r border-slate-200 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage <= 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Pág.</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                // Mostramos vacío si es 0 para evitar bloqueos al borrar
                                value={currentPage === 0 ? '' : currentPage}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    onPageChange(val);
                                }}
                                className="w-12 text-center bg-white border border-slate-400 rounded-md text-sm font-bold text-blue-700 py-1 px-1 focus:border-blue-500 outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                de {Math.max(1, totalPages)}
                            </span>
                        </div>

                        <button
                            disabled={currentPage >= totalPages || totalPages === 0}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Ver</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={itemsPerPage === 0 ? '' : itemsPerPage}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                onItemsPerPageChange(val);
                            }}
                            className="w-14 bg-white border border-slate-400 rounded-md text-sm font-bold text-center py-1 px-1 text-slate-800 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* 3. SECCIÓN DERECHA: ACCIÓN NUEVO */}
                <div className="flex items-center gap-2 min-w-fit">
                    <button
                        onClick={onNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5"
                    >
                        <span className="text-sm">+</span> NUEVO USUARIO
                    </button>
                </div>

            </div>
        </div>
    );
}