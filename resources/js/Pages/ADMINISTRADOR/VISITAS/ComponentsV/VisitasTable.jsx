import React from 'react';
import { getEstadoEstilo, getNameById } from './visitaHelpers';

export default function VisitasTable({
    currentItems,
    medicos,
    visitadores,
    selectedIds = [],
    onSelectOne,
    onView,
    onEdit,
    onDelete
}) {
    return (
        <div className="flex-grow w-full mt-[30px]">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto">
                    <thead className="sticky top-[-30px] z-30 shadow-sm">
                        <tr className="bg-blue-600 border-b border-slate-200">
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100 text-center w-10">
                                Sel.
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Médico
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Visitador
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Fecha Programada
                            </th>
                            {/* Nueva Columna: Muestras */}
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Muestras
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Estado
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase text-center">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                        {currentItems.length > 0 ? currentItems.map(v => {
                            // Buscamos el médico correspondiente a esta fila
                            const medicoActual = medicos?.find(m => m.id === v.medico_id);

                            return (
                                <tr
                                    key={v.id}
                                    className={`${selectedIds.includes(v.id) ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'} transition-colors group`}
                                >
                                    <td className="px-6 py-1 border-r border-slate-50 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(v.id)}
                                            onChange={() => onSelectOne(v.id)}
                                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </td>

                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[11px] font-bold text-slate-700 uppercase leading-none tracking-tight">
                                            {medicoActual 
                                                ? `${medicoActual.nombre} ${medicoActual.apellido || ''}`
                                                : 'MÉDICO SIN ASIGNAR'
                                            }
                                        </span>
                                    </td>

                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[10px] text-slate-600 font-bold uppercase">
                                            {getNameById(visitadores, v.visitador_id)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[10px] text-slate-500 font-medium italic">
                                            {v.fecha_programada}
                                        </span>
                                    </td>

                                    {/* Datos de Muestras */}
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[10px] text-slate-600 font-semibold truncate max-w-[150px] block">
                                            {v.muestras ? v.muestras : <span className="text-slate-300 italic font-normal text-[9px]">Sin muestras</span>}
                                        </span>
                                    </td>

                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border ${getEstadoEstilo(v.estado)}`}>
                                            {v.estado}
                                        </span>
                                    </td>

                                    <td className="px-6 py-2 text-center flex gap-1 justify-center">
                                        <button
                                            onClick={() => onView(v)}
                                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm group/btn"
                                            title="Ver detalle"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => onEdit(v)}
                                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm group/btn"
                                            title="Editar visita"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => onDelete(v.id)}
                                            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm group/btn"
                                            title="Eliminar registro"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-20 text-center">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
                                        No se encontraron visitas registradas
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}