import React from 'react';

export default function ProductosTable({ currentItems, selectedIds, onSelectOne, onEdit }) {
    return (
        <div className="flex-grow overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase text-center w-16">Sel.</th>
                        <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase">Código</th>
                        <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase">Nombre del Producto</th>
                        <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase">Laboratorio</th>
                        <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {currentItems.map(p => (
                        <tr
                            key={p.id}
                            className={`hover:bg-blue-50/30 transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-50/50' : ''}`}
                        >
                            <td className="px-6 py-3 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(p.id)}
                                    onChange={() => onSelectOne(p.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                />
                            </td>
                            <td className="px-6 py-3">
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {p.codigo}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-[11px] font-bold text-slate-700 uppercase">{p.nombre}</td>
                            <td className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase italic">
                                {p.laboratorio || 'N/A'}
                            </td>
                            <td className="px-6 py-3 text-center">
                                <button
                                    onClick={() => onEdit(p)}
                                    className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}