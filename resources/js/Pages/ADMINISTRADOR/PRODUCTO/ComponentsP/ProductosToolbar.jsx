import React, { useRef } from 'react';

export default function ProductosToolbar({
    searchTerm, onSearchChange,
    selectedIds,
    onImport, onFileChange,
    onExport, onDelete, onNew,
}) {
    const fileInputRef = useRef(null);

    return (
        <div className="fixed top-20 left-0 right-0 z-50 bg-white border-b border-slate-200 w-full shadow-sm px-4 py-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto lg:overflow-visible">
                {/* Búsqueda */}
                <div className="relative w-48 lg:w-64 group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Input file oculto — ref local */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx,.xls"
                        onChange={onFileChange}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg font-bold text-[10px] uppercase hover:bg-amber-600 hover:text-white transition-all"
                    >
                        Importar
                    </button>

                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-bold text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all"
                    >
                        {selectedIds.length > 0 ? `Exportar (${selectedIds.length})` : 'Exportar Todo'}
                    </button>

                    <button
                        disabled={selectedIds.length === 0}
                        onClick={onDelete}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[10px] uppercase transition-all border
                        ${selectedIds.length > 0
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white'
                                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                    >
                        ELIMINAR {selectedIds.length > 0 && `(${selectedIds.length})`}
                    </button>

                    <button
                        onClick={onNew}
                        className="bg-[#3D3FD8] text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all"
                    >
                        + Nuevo Producto
                    </button>
                </div>
            </div>
        </div>
    );
}