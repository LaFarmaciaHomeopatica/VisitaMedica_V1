import React from 'react';

export default function VisitasToolbar({ searchTerm, onSearchChange, onNew }) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between bg-white border-b border-slate-200 px-6 py-4 w-full gap-4">
            <div className="flex-1 max-w-md w-full">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="BUSCAR POR MÉDICO, VISITADOR O ESTADO..."
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-[#3D3FD8] outline-none transition-all"
                    />
                </div>
            </div>

            <button
                onClick={onNew}
                className="bg-[#3D3FD8] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
            >
                + Nueva Visita
            </button>
        </div>
    );
}