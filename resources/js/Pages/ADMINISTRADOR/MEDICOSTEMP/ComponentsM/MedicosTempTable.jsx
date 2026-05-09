import React from 'react';
import { FaUserPlus } from 'react-icons/fa6';

export default function MedicosTempTable({ currentItems, onPromote }) {
    return (
        <div className="p-0 overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="text-left border-b border-slate-50">
                        <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documento</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Médico (Referencia Excel)</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origen de Datos</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                    {currentItems.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-2">
                                <span className="text-[11px] font-black text-slate-600">{m.documento}</span>
                            </td>
                            <td className="px-8 py-2">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                                    {m.nombre_referencia}
                                </span>
                            </td>
                            <td className="px-8 py-2">
                                <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-tighter">
                                    {m.origen_datos}
                                </span>
                            </td>
                            <td className="px-8 py-2 text-right">
                                <button
                                    onClick={() => onPromote(m)}
                                    className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors p-2"
                                    title="Completar Perfil"
                                >
                                    <FaUserPlus className="text-lg" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}