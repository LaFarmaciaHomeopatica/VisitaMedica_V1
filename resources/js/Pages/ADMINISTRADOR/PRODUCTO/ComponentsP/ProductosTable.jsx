import React from 'react';

export default function ProductosTable({ currentItems, selectedIds, onSelectOne, onEdit }) {
    return (
        /* 1. mt-[30px]: Margen superior para evitar solapamiento con elementos fixed */
        <div className="flex-grow w-full mt-[30px]">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto">
                    {/* 2. Cabecera con estilo sticky y fondo azul */}
                    <thead className="sticky top-[-30px] z-30 shadow-sm">
                        <tr className="bg-blue-600 border-b border-slate-200">
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100 text-center w-10">Sel.</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Código</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Nombre del Producto</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Laboratorio</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentItems.map(p => (
                            <tr
                                key={p.id}
                                className={`${selectedIds.includes(p.id) ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'} transition-colors group`}
                            >
                                <td className="px-6 py-1 border-r border-slate-50 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(p.id)}
                                        onChange={() => onSelectOne(p.id)}
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </td>

                                <td className="px-6 py-2 border-r border-slate-50">
                                    <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
                                        {p.codigo}
                                    </span>
                                </td>

                                <td className="px-6 py-2 border-r border-slate-50">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase leading-none">
                                        {p.nombre}
                                    </span>
                                </td>

                                <td className="px-6 py-2 border-r border-slate-50">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase italic tracking-tight">
                                        {p.laboratorio || 'N/A'}
                                    </span>
                                </td>

                                <td className="px-6 py-2 text-center flex gap-1 justify-center">
                                    <button
                                        onClick={() => onEdit(p)}
                                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}