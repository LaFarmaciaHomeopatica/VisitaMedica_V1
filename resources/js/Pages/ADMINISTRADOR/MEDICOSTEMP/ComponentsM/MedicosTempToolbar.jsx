import React, { useRef } from 'react';
import { FaCircleExclamation } from 'react-icons/fa6';

export default function MedicosTempToolbar({
    searchTerm, onSearchChange,
    selectedIds = [],
    onDelete, onExport, onNew,
    onTemplate, // <-- NUEVO
    onImport, // <-- Nueva prop para manejar la importación desde el componente padre
    currentItems = [], onSelectAll,
    itemsPerPage, onItemsPerPageChange,
    currentPage, onPageChange, totalPages
}) {
    // Referencia para activar el explorador de archivos oculto
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && onImport) {
            onImport(file); // Le pasamos el archivo seleccionado al padre
            e.target.value = ''; // Limpiamos el input para permitir subir el mismo archivo consecutivamente
        }
    };

    return (
        <div className="fixed top-20 left-0 right-0 z-50 bg-white border-b border-slate-200 w-full shadow-sm px-4 py-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto lg:overflow-visible">

                {/* 1. SECCIÓN IZQUIERDA: CHECKBOX Y BUSCADOR */}
                <div className="flex items-center gap-3 min-w-fit">
                    <div className="flex items-center gap-3 border-r border-slate-200 pr-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={currentItems.length > 0 && currentItems.every(m => selectedIds.includes(m.id))}
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
                            <svg className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar en validación..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700"
                        />
                    </div>
                </div>

                {/* 2. SECCIÓN CENTRAL: PAGINACIÓN */}
                <div className="flex items-center gap-4 border-l border-r border-slate-200 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
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
                                className="w-12 text-center bg-white border border-slate-400 rounded-md text-sm font-bold text-blue-700 py-1 px-1 focus:border-blue-500 outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-500">DE {totalPages || 1}</span>
                        </div>

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => onPageChange(currentPage + 1)}
                            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 text-slate-600 border border-slate-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500">VER</span>
                        <input
                            type="number"
                            value={itemsPerPage === 0 ? '' : itemsPerPage}
                            onChange={e => onItemsPerPageChange(e.target.value)}
                            className="w-14 bg-white border border-slate-400 rounded-md text-sm font-bold text-center py-1 px-1 text-slate-800 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* 3. SECCIÓN DERECHA: INDICADOR Y ACCIONES */}
                <div className="flex items-center gap-2 min-w-fit">
                    {/* Indicador de Estado */}
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-2 rounded-lg border border-amber-100/50 mr-2">
                        <FaCircleExclamation className="text-xs" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                            Bandeja de Validación
                        </span>
                    </div>

                    {/* Botón Borrar */}
                    <button
                        onClick={onDelete}
                        disabled={selectedIds.length === 0}
                        className={`${selectedIds.length > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'} px-3 py-2 rounded-lg font-bold text-[10px] uppercase border transition-all flex items-center gap-1.5`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} BORRAR
                    </button>

                    {/* Botón Plantilla */}
<button
    onClick={onTemplate}
    className="px-3 py-2 rounded-lg font-bold text-[10px] uppercase border border-transparent text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-1.5"
>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H8a2 2 0 01-2-2V5a2 2 0 012-2h6l6 6v11a2 2 0 01-2 2z" />
    </svg>
    PLANTILLA
</button>

                    {/* BOTÓN NUEVO: IMPORTAR */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".xlsx,.xls,.csv" 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="px-3 py-2 rounded-lg font-bold text-[10px] uppercase border border-transparent text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        IMPORTAR
                    </button>

                    {/* Botón Exportar */}
                   {/* Botón Exportar */}
{/* Botón Exportar */}
<button 
    onClick={() => onExport(selectedIds)}
    className={`px-3 py-2 rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-1.5 border ${
        selectedIds.length > 0
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : 'text-slate-400 border-transparent hover:bg-slate-50'
    }`}
>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    {selectedIds.length > 0 ? `(${selectedIds.length}) EXPORTAR` : 'EXPORTAR'}
</button>
                </div>

            </div>
        </div>
    );
}