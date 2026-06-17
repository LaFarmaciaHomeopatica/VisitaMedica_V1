import React, { useRef, useState, useEffect } from 'react';

export default function TransaccionesToolbar({
    searchTerm, onSearchChange,
    selectedIds = [], // Aseguramos un valor por defecto si no viene
    onDelete, onNew,
    onFileChange, onExport, onDownloadTemplate,
    currentItems = [], onSelectAll,
    itemsPerPage, onItemsPerPageChange,
    currentPage, onPageChange, totalPages,
    visibleColumns,
    showColumnFilter,
    setShowColumnFilter,
    columnFilterRef,
    onToggleColumn,
    showCalendar,
    onToggleCalendar,
}) {
    const fileInputRef = useRef(null);

    // Mapeo de keys técnicas a nombres legibles
    const columnLabels = {
        fecha: "Fecha",
        documento: "Documento",
        medico: "Médico",
        codigoProducto: "Cód. Producto",
        producto: "Producto",
        compras: "Un. Compradas",
        formulaciones: "Un. Formuladas",
        valorComprado: "Val. Comprado",
        valorFormulado: "Val. Formulado"
    };

    // Función manejadora local para construir la descarga nativa
    const handleExportClick = () => {
        if (selectedIds.length > 0) {
            // Convertimos el array de IDs a formato query string: ?ids[]=1&ids[]=2
            const params = new URLSearchParams();
            selectedIds.forEach(id => params.append('ids[]', id));
            
            // Reemplaza 'Gtransacciones.exportar' por el nombre de tu ruta o URL /administrador/transacciones/exportar
            window.location.href = route('Gtransacciones.exportar') + '?' + params.toString();
        } else {
            // Si no hay seleccionados, ejecuta la función original (Exportar todo)
            onExport();
        }
    };

    return (
        <div className="fixed top-20 left-0 right-0 z-50 bg-white border-b border-slate-200 w-full shadow-sm px-4 py-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto lg:overflow-visible">

                {/* 1. SECCIÓN IZQUIERDA: SELECCIÓN Y BÚSQUEDA */}
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
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700"
                        />
                    </div>
                </div>

                {/* 2. SECCIÓN CENTRAL: PAGINACIÓN COMPACTA */}
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

                {/* 3. SECCIÓN DERECHA: ACCIONES */}
                <div className="flex items-center gap-2 min-w-fit">

                    {/* BOTÓN MAPA DE CALOR */}
                    <button
                        onClick={onToggleCalendar}
                        className={`px-3 py-2 rounded-lg font-black text-[10px] uppercase transition-all flex items-center gap-1 border ${
                            showCalendar
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                        title="Mapa de calor"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Calor
                    </button>

                    {/* BOTÓN DESPLEGABLE DE COLUMNAS */}
                    <div className="relative" ref={columnFilterRef}>
                        <button
                            onClick={() => setShowColumnFilter(!showColumnFilter)}
                            className="text-slate-600 hover:bg-slate-100 px-3 py-2 rounded-lg font-black text-[10px] uppercase transition-all flex items-center gap-1 border border-slate-200"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                            Columnas
                        </button>

                        {showColumnFilter && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] py-2 animate-in fade-in zoom-in duration-150">
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Configurar Vista</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto px-2">
                                    {Object.keys(columnLabels).map((key) => (
                                        <label
                                            key={key}
                                            className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns[key]}
                                                onChange={() => onToggleColumn(key)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${visibleColumns[key] ? 'text-blue-700' : 'text-slate-500'}`}>
                                                {columnLabels[key]}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BOTÓN BORRAR MULTIPLE */}
                    <button
                        onClick={onDelete}
                        disabled={selectedIds.length === 0}
                        className={`${selectedIds.length > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'} px-3 py-2 rounded-lg font-bold text-[10px] uppercase border transition-all flex items-center gap-1.5`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} BORRAR
                    </button>

                    {/* BOTÓN MODIFICADO DE EXPORTAR (DINÁMICO) */}
                    <button
                        onClick={handleExportClick}
                        className={`px-3 py-2 rounded-lg font-black text-[10px] uppercase border transition-all ${
                            selectedIds.length > 0 
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md' 
                                : 'text-emerald-600 hover:bg-emerald-50 border-transparent'
                        }`}
                    >
                        {selectedIds.length > 0 ? `Exportar (${selectedIds.length})` : 'Exportar Todo'}
                    </button>

                    {/* BOTÓN PLANTILLA */}
                    <button
                        onClick={onDownloadTemplate}
                        className="text-slate-500 hover:bg-slate-100 px-3 py-2 rounded-lg font-black text-[10px] uppercase transition-all border border-slate-200 flex items-center gap-1"
                        title="Descargar plantilla de importación"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        PLANTILLA
                    </button>

                    {/* BOTÓN IMPORTAR */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-amber-600 hover:bg-amber-50 px-3 py-2 rounded-lg font-black text-[10px] uppercase transition-all"
                    >
                        IMPORTAR
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={onFileChange}
                    />

                    {/* BOTÓN CREAR NUEVA */}
                    <button
                        onClick={onNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5"
                    >
                        <span className="text-sm">+</span> NUEVA
                    </button>
                </div>
            </div>
        </div>
    );
}