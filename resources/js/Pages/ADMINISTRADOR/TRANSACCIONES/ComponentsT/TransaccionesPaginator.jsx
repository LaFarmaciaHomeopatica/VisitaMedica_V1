import React from 'react';
import { FaChevronLeft, FaChevronRight, FaGear } from 'react-icons/fa6';

export default function TransaccionesPaginator({
    currentItems, selectedIds, onToggleSelectAll,
    itemsPerPage, onItemsPerPageChange,
    currentPage, onPageChange, totalPages,
    // columnas
    visibleColumns, showColumnFilter, setShowColumnFilter,
    columnFilterRef, onToggleColumn,
}) {
    return (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            {/* Izquierda: checkbox + mostrar */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                    <input
                        type="checkbox"
                        onChange={() => onToggleSelectAll(currentItems)}
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

            {/* Centro: paginación */}
            <div className="flex items-center gap-1">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 disabled:opacity-30 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <FaChevronLeft className="w-3 h-3 text-slate-600" />
                </button>
                <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">
                    {currentPage} de {totalPages || 1}
                </span>
                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 disabled:opacity-30 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <FaChevronRight className="w-3 h-3 text-slate-600" />
                </button>
            </div>

            {/* Derecha: filtro de columnas */}
            <div className="relative" ref={columnFilterRef}>
                <button
                    onClick={() => setShowColumnFilter(!showColumnFilter)}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                >
                    <FaGear className={`w-3 h-3 transition-transform ${showColumnFilter ? 'rotate-90' : ''}`} />
                    Columnas
                </button>

                {showColumnFilter && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase px-2 mb-1">
                            Ver/Ocultar Campos
                        </span>
                        {Object.keys(visibleColumns).map(col => (
                            <label
                                key={col}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={visibleColumns[col]}
                                    onChange={() => onToggleColumn(col)}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8]"
                                />
                                <span className={`text-[10px] font-bold uppercase ${visibleColumns[col] ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {col.replace(/([A-Z])/g, ' $1')}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}