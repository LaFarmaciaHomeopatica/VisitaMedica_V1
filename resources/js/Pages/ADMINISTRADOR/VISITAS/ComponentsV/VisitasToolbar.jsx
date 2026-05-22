import React from 'react';
import { FaPlus, FaSearch, FaTrash, FaFileExport, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function VisitasToolbar({
    searchTerm, onSearchChange,
    onNew, onDelete, onExport,
    // Props de Selección
    selectedIds = [],
    onSelectAll,
    currentItems = [],
    // Props de Paginación
    itemsPerPage, onItemsPerPageChange,
    currentPage, onPageChange, totalPages
}) {
    const isAllSelected = currentItems.length > 0 && currentItems.every(m => selectedIds.includes(m.id));

    return (
        <div className="fixed top-20 left-0 right-0 z-50 bg-white border-b border-slate-200 w-full shadow-sm px-4 py-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto lg:overflow-visible">

                {/* 1. SECCIÓN IZQUIERDA: SELECCIÓN Y BÚSQUEDA */}
                <div className="flex items-center gap-3 min-w-fit">
                    <div className="flex items-center gap-3 border-r border-slate-200 pr-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={e => onSelectAll(e, currentItems)}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-transform group-hover:scale-105"
                            />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight leading-none select-none">
                                Selecc.<br />Todo
                            </span>
                        </label>
                    </div>

                    <div className="relative w-48 lg:w-64 group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <FaSearch className="w-3 h-3 text-slate-400 group-focus-within:text-[#3D3FD8]" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-[10px] font-bold uppercase tracking-widest focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700"
                        />
                    </div>
                </div>

                {/* 2. SECCIÓN CENTRAL: PAGINACIÓN INTEGRADA */}
                <div className="flex items-center gap-4 border-l border-r border-slate-200 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 transition-colors"
                        >
                            <FaChevronLeft size={10} />
                        </button>

                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500">PÁG.</span>
                            <input
                                type="number"
                                value={currentPage}
                                onChange={e => {
                                    const val = Number(e.target.value);
                                    if (val >= 1 && val <= totalPages) onPageChange(val);
                                }}
                                className="w-12 text-center bg-white border border-slate-400 rounded-md text-sm font-bold text-[#3D3FD8] py-1 px-1 focus:border-blue-500 outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-500">DE {totalPages || 1}</span>
                        </div>

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200 transition-colors"
                        >
                            <FaChevronRight size={10} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500">VER</span>
                        <input
                            type="number"
                            value={itemsPerPage}
                            onChange={e => onItemsPerPageChange(e.target.value)}
                            className="w-14 bg-white border border-slate-400 rounded-md text-sm font-bold text-center py-1 px-1 text-slate-800 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* 3. SECCIÓN DERECHA: ACCIONES */}
                <div className="flex items-center gap-2 min-w-fit">
                    {/* Botón Borrar Dinámico */}
                    <button
                        onClick={onDelete}
                        disabled={selectedIds.length === 0}
                        className={`${selectedIds.length > 0
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'
                            } px-3 py-2 rounded-lg font-bold text-[10px] uppercase border transition-all flex items-center gap-1.5`}
                    >
                        <FaTrash size={12} />
                        {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} BORRAR
                    </button>

                   
                    <button
                        onClick={onNew}
                        className="bg-[#3D3FD8] text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-[#2d2fb1] transition-all flex items-center gap-1.5"
                    >
                        <FaPlus size={10} /> NUEVA VISITA
                    </button>
                </div>

            </div>
        </div>
    );
}