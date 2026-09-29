import React, { useState } from 'react';
import { FaCalendarDays } from 'react-icons/fa6';

const MESES = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
    { value: 'todos', label: 'Todos los Meses' },
];

export default function MedicosToolbar({
    searchTerm, onSearchChange,
    selectedIds,
    onDelete, onAssignVisitor, onExport, onImport, onTemplate, onNew,
    fileInputRef, onFileChange,
    currentItems = [], onSelectAll,
    itemsPerPage, onItemsPerPageChange,
    currentPage, onPageChange, totalPages, soloSinVisitador, onToggleSoloSinVisitador,
    filtroMes, onMesChange,
    fechaDesde, fechaHasta, onFechaRangeChange, onClearRangoDates, modoFiltro,
}) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [tempDesde, setTempDesde] = useState(fechaDesde || '');
    const [tempHasta, setTempHasta] = useState(fechaHasta || '');

    const handleApplyRange = () => {
        if (tempDesde && tempHasta) {
            onFechaRangeChange && onFechaRangeChange(tempDesde, tempHasta);
            setIsCalendarOpen(false);
        }
    };

    const handleClearRange = () => {
        setTempDesde('');
        setTempHasta('');
        onClearRangoDates && onClearRangoDates();
        setIsCalendarOpen(false);
    };

    return (
        <div className="fixed top-14 left-0 right-0 z-50 bg-white border-b border-slate-200 w-full shadow-sm px-4 py-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto lg:overflow-visible">

                {/* 1. SECCIÓN IZQUIERDA: CHECKBOX, BUSCADOR Y FILTROS DE FECHAS */}
                <div className="flex items-center gap-3 min-w-fit">
                    <div className="flex items-center gap-3 border-r border-slate-200 pr-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={currentItems.length > 0 && currentItems.every(m => selectedIds.includes(m.id))}
                                onChange={e => onSelectAll(e, currentItems)}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-transform group-hover:scale-105"
                            />
                            {/* Texto identificativo */}
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight leading-none select-none">
                                Selecc.<br />Todo
                            </span>
                        </label>
                    </div>

                    <div className="relative w-36 lg:w-44 group">
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
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700"
                        />
                    </div>

                    {/* SELECTOR DE FILTRO DE MES O RANGO CON ICONO DE CALENDARIO COMPACTO */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 relative">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight leading-none select-none">
                            Mes:
                        </span>
                        <select
                            value={modoFiltro === 'rango' ? 'custom' : (filtroMes || 'todos')}
                            onChange={e => {
                                if (e.target.value !== 'custom') {
                                    handleClearRange();
                                    onMesChange && onMesChange(e.target.value);
                                }
                            }}
                            className={`border text-xs font-bold rounded-lg py-1 px-2 outline-none cursor-pointer ${modoFiltro === 'rango' ? 'bg-slate-100 border-slate-300 text-slate-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}
                        >
                            {MESES.map(m => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                            <option value="custom" disabled>-- Rango Libre --</option>
                        </select>

                        {/* BOTÓN ICONO DE CALENDARIO */}
                        <button
                            type="button"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className={`p-2 rounded-lg border font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                modoFiltro === 'rango'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                            }`}
                            title={modoFiltro === 'rango' ? `Rango activo: ${fechaDesde} al ${fechaHasta}` : 'Filtrar por Rango Libre (Desde / Hasta)'}
                        >
                            <FaCalendarDays className="w-3.5 h-3.5" />
                            {modoFiltro === 'rango' && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            )}
                        </button>

                        {/* POPOVER DESPLEGABLE DE FECHAS */}
                        {isCalendarOpen && (
                            <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 w-64 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <FaCalendarDays className="text-blue-600" />
                                        Rango de Fechas Libre
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsCalendarOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="space-y-2.5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desde:</label>
                                        <input
                                            type="date"
                                            value={tempDesde}
                                            onChange={e => setTempDesde(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hasta:</label>
                                        <input
                                            type="date"
                                            value={tempHasta}
                                            onChange={e => setTempHasta(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-3">
                                        {modoFiltro === 'rango' ? (
                                            <button
                                                type="button"
                                                onClick={handleClearRange}
                                                className="text-[10px] font-bold text-rose-600 hover:underline"
                                            >
                                                Limpiar Rango
                                            </button>
                                        ) : <div />}
                                        <button
                                            type="button"
                                            onClick={handleApplyRange}
                                            disabled={!tempDesde || !tempHasta}
                                            className="px-3.5 py-1.5 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer border-l border-slate-200 pl-3">
                        <input
                            type="checkbox"
                            checked={soloSinVisitador}
                            onChange={e => onToggleSoloSinVisitador(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-tight leading-none select-none whitespace-nowrap">
                            Sin<br />Visitador
                        </span>
                    </label>
                </div>

                {/* 2. SECCIÓN CENTRAL: PAGINACIÓN (NÚMEROS VISIBLES) */}
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
                    <button
                        onClick={onDelete}
                        disabled={selectedIds.length === 0}
                        className={`${selectedIds.length > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'} px-3 py-2 rounded-lg font-bold text-[10px] uppercase border transition-all flex items-center gap-1.5`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} BORRAR
                    </button>

                    <button
                        onClick={onAssignVisitor}
                        disabled={selectedIds.length === 0}
                        className={`${selectedIds.length > 0 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} px-3 py-2 rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-1`}
                    >
                        VINCULAR
                    </button>

                    <button onClick={onExport} className="text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg font-bold text-[10px] uppercase transition-all">
                        EXPORTAR
                    </button>

                    <button onClick={onTemplate} className="text-violet-600 hover:bg-violet-50 px-3 py-2 rounded-lg font-bold text-[10px] uppercase transition-all">
                        PLANTILLA
                    </button>

                    <button onClick={onImport} className="text-amber-600 hover:bg-amber-50 px-3 py-2 rounded-lg font-bold text-[10px] uppercase transition-all">
                        IMPORTAR
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={onFileChange} />

                    <button onClick={onNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5">
                        <span className="text-sm">+</span> NUEVO
                    </button>
                </div>

            </div>
        </div>
    );
}