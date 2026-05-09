import React from 'react';
import { FaCircleExclamation } from 'react-icons/fa6';

export default function MedicosTempToolbar({ searchTerm, onSearchChange }) {
    return (
        <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 w-full">
            {/* Buscador */}
            <div className="flex-1 max-w-md">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o documento..."
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Indicador + botón */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <div className="bg-amber-50 text-amber-600 px-5 py-3.5 rounded-2xl flex items-center gap-3 border border-amber-100/50">
                    <FaCircleExclamation className="text-sm" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                        Bandeja de Validación
                    </span>
                </div>

                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-indigo-200">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Nueva Gestión
                    </span>
                </button>
            </div>
        </div>
    );
}