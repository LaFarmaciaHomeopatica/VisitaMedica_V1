import React from 'react';
import { Link } from '@inertiajs/react';
import { FaUserPlus, FaTrash, FaChartLine, FaFileInvoiceDollar } from 'react-icons/fa6';

// Agregamos default values para evitar el error de undefined
export default function MedicosTempTable({
    currentItems = [],
    selectedIds = [],
    onSelectOne,
    onPromote,
    onDelete,
    onStats,
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
                                Documento
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Médico (Referencia Excel)
                            </th>
                           
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase text-center">
                                Acción
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {currentItems.map(m => (
                            <tr
                                key={m.id}
                                // Ahora esto no fallará porque selectedIds siempre será al menos []
                                className={`${selectedIds?.includes(m.id) ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'} transition-colors group`}
                            >
                                <td className="px-6 py-1 border-r border-slate-50 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds?.includes(m.id)}
                                        onChange={() => onSelectOne(m.id)}
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </td>

                                <td className="px-6 py-2 border-r border-slate-50">
                                    <span className="text-[11px] font-black text-slate-600">
                                        {m.documento}
                                    </span>
                                </td>

                                <td className="px-6 py-2 border-r border-slate-50">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase leading-none tracking-tight">
                                        {m.nombre_referencia}
                                    </span>
                                </td>

                               

                                <td className="px-6 py-2 text-center flex gap-1 justify-center">
  
  {m.documento ? (
        <Link
            href={route('Gmedicos.showPorDocumento', m.documento)}
            title="Ver detalle"
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm inline-flex items-center"
        >
            <FaChartLine className="h-4 w-4" />
        </Link>
    ) : (
        <span
            title="Sin documento registrado"
            className="p-2 bg-slate-50 text-slate-200 rounded-xl inline-flex items-center cursor-not-allowed"
        >
            <FaChartLine className="h-4 w-4" />
        </span>
    )}
                                    <button
                                        onClick={() => onPromote(m)}
                                        title="Promover a médico"
                                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <FaUserPlus className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(m.id)}
                                        title="Eliminar"
                                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <FaTrash className="h-4 w-4" />
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