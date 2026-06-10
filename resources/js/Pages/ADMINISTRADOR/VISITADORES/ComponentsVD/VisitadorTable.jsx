// resources/js/Pages/ADMINISTRADOR/VISITADORES/ComponentsVD/VisitadorTable.jsx
import React from 'react';
import { Link } from '@inertiajs/react';
import { FaChartLine } from 'react-icons/fa6';

const VisitadorTable = ({ currentItems, onEdit, onToggleEstado }) => {
    return (
        <div className="flex-grow w-full mt-[30px]">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto">
                    <thead className="sticky top-[-30px] z-30 shadow-sm">
                        <tr className="bg-blue-600 border-b border-slate-200">
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
                                <tr key={v.id} className="hover:bg-blue-50/30 transition-colors group">

                                    {/* Visitador e Info de Usuario */}
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase leading-tight">
                                                {v.nombre} {v.apellido}
                                            </span>
                                            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">
                                                {v.user ? `${v.user.username || v.user.nombre}` : 'Sin usuario'}
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

                                    {/* Estado — clic para toggle */}
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <button
                                            onClick={() => onToggleEstado(v.id)}
                                            title="Clic para cambiar estado"
                                            className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border cursor-pointer transition-all hover:opacity-75 ${
                                                v.estado === 'Habilitado'
                                                    ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                    : 'text-rose-500 bg-rose-50 border-rose-100'
                                            }`}
                                        >
                                            {v.estado}
                                        </button>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-2 text-center">
                                        <div className="flex gap-1 justify-center">
                                            <Link
                                                href={route('Gvisitadores.show', v.id)}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm inline-flex items-center"
                                                title="Ver detalle"
                                            >
                                                <FaChartLine className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => onEdit(v)}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
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
