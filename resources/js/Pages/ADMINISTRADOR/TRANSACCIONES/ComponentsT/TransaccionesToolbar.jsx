import React, { useRef } from 'react';
import {
    FaMagnifyingGlass, FaTrashCan, FaFileExcel, FaPlus
} from 'react-icons/fa6';

export default function TransaccionesToolbar({
    searchTerm, onSearchChange,
    selectedIds,
    onDelete, onNew,
    onFileChange,
}) {
    const fileInputRef = useRef(null);

    return (
        <div className="flex flex-col xl:flex-row items-center justify-between border-b border-slate-200 px-6 py-6 gap-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md w-full relative">
                <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="BUSCAR MÉDICO, PRODUCTO O SEMANA..."
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#3D3FD8]/20 transition-all"
                />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Input file oculto — ref local */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                />

                {/* Eliminar */}
                <button
                    disabled={selectedIds.length === 0}
                    onClick={onDelete}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all
                        ${selectedIds.length > 0
                            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white'
                            : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                >
                    <FaTrashCan className="inline mr-2" />
                    ELIMINAR {selectedIds.length > 0 && `(${selectedIds.length})`}
                </button>

                {/* Importar */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-amber-50 text-amber-600 border border-amber-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2"
                >
                    Importar
                </button>

                {/* Exportar */}
                <a
                    href={route('Gtransacciones.exportar')}
                    className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                >
                    <FaFileExcel className="w-3.5 h-3.5" /> Exportar
                </a>

                {/* Nueva transacción */}
                <button
                    onClick={onNew}
                    className="bg-[#3D3FD8] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    <FaPlus className="w-3 h-3" /> Nueva Transacción
                </button>
            </div>
        </div>
    );
}