// resources/js/Pages/ADMINISTRADOR/VISITADORES/ComponentsVD/VisitadorTable.jsx
import React from 'react';

const VisitadorTable = ({ currentItems, selectedIds, onSelectOne, onEdit, onDelete }) => {
    return (
        /* 
           mt-[30px] o superior para compensar el Toolbar fixed. 
           Ajusta este valor según la altura total de tus componentes superiores.
        */
        <div className="flex-grow w-full mt-[30px]">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto">
                    <thead className="sticky top-[-30px] z-30 shadow-sm">
                        <tr className="bg-blue-600 border-b border-slate-200">
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-white/10 text-center w-10">
                                Sel.
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-white/10">
                                Visitador
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-white/10">
                                Documento
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-white/10">
                                Zona / Región
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-white/10">
                                Estado
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase text-center">
                                Acción
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {currentItems.length > 0 ? (
                            currentItems.map((v) => (
                                <tr
                                    key={v.id}
                                    className={`${selectedIds.includes(v.id)
                                        ? 'bg-blue-50/50'
                                        : 'hover:bg-blue-50/30'
                                        } transition-colors group`}
                                >
                                    {/* Columna Selección */}
                                    <td className="px-6 py-1 border-r border-slate-50 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(v.id)}
                                            onChange={() => onSelectOne(v.id)}
                                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8] cursor-pointer"
                                        />
                                    </td>

                                    {/* Visitador e Info de Usuario */}
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase leading-tight">
                                                {v.nombre} {v.apellido}
                                            </span>
                                            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">
                                                {v.user ? `@${v.user.username || v.user.nombre}` : 'Sin usuario'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Documento */}
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[10px] text-slate-600 font-medium">
                                            {v.tipo_documento?.nombre || 'DOC'}: {v.documento}
                                        </span>
                                    </td>

                                    {/* Zona */}
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[9px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-tighter">
                                            {v.zona?.nombre || `ZONA ${v.zona_id || 'N/A'}`}
                                        </span>
                                    </td>

                                    {/* Estado */}
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${v.estado === 'habilitado'
                                            ? 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                                            : 'text-rose-500 bg-rose-50 border border-rose-100'
                                            }`}>
                                            {v.estado}
                                        </span>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-2 text-center">
                                        <div className="flex gap-1 justify-center">
                                            <button
                                                onClick={() => onEdit(v)}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onDelete(v)}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                        No se encontraron visitadores registrados
                                    </span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VisitadorTable;