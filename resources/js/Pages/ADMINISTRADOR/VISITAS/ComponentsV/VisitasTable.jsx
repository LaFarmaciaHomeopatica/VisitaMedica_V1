import React from 'react';
import { getEstadoEstilo, getNameById } from './visitaHelpers';

export default function VisitasTable({
    currentItems, medicos, visitadores,
    onView, onEdit, onDelete,
}) {
    return (
        <div className="flex-grow w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-400 font-black">
                        <th className="px-6 py-5 tracking-widest">Médico</th>
                        <th className="px-6 py-5 tracking-widest">Visitador</th>
                        <th className="px-6 py-5 tracking-widest">F. Programada</th>
                        <th className="px-6 py-5 tracking-widest">Estado</th>
                        <th className="px-6 py-5 text-center tracking-widest">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {currentItems.length > 0 ? currentItems.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4 font-black text-slate-700 text-[11px] uppercase">
                                {getNameById(medicos, v.medico_id)}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-[10px] font-bold uppercase">
                                {getNameById(visitadores, v.visitador_id)}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-[10px] font-medium">
                                {v.fecha_programada}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${getEstadoEstilo(v.estado)}`}>
                                    {v.estado}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex justify-center gap-1.5">
                                    {/* Ver */}
                                    <button
                                        onClick={() => onView(v)}
                                        className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                    {/* Editar */}
                                    <button
                                        onClick={() => onEdit(v)}
                                        className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5" />
                                        </svg>
                                    </button>
                                    {/* Eliminar */}
                                    <button
                                        onClick={() => onDelete(v.id)}
                                        className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="px-6 py-20 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
                                    No se encontraron visitas registradas
                                </p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}