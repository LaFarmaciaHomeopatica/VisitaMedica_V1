import React from 'react';
import { FaPencil } from 'react-icons/fa6';

export default function TransaccionesTable({
    currentItems, selectedIds,
    onToggleSelectAll, onToggleSelectOne,
    visibleColumns, onEdit,
}) {
    return (
        <div className="flex-grow overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-5 text-center w-16">
                            <input
                                type="checkbox"
                                onChange={() => onToggleSelectAll(currentItems)}
                                checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                                className="w-4 h-4 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8]"
                            />
                        </th>
                        {visibleColumns.semana && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Semana</th>}
                        {visibleColumns.documento && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Documento</th>}
                        {visibleColumns.medico && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Médico</th>}
                        {visibleColumns.codigoProducto && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cód. Prod</th>}
                        {visibleColumns.producto && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Producto</th>}
                        {visibleColumns.compras && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Un. Compradas</th>}
                        {visibleColumns.formulaciones && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Un. Formuladas</th>}
                        {visibleColumns.valorComprado && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Val. Comprado</th>}
                        {visibleColumns.valorFormulado && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Val. Formulado</th>}
                        <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {currentItems.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(t.id)}
                                    onChange={() => onToggleSelectOne(t.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8]"
                                />
                            </td>
                            {visibleColumns.semana && <td className="px-6 py-2"><span className="text-[10px] font-black text-[#3D3FD8] bg-blue-50 px-3 py-1 rounded-lg">SEM {t.semana}</span></td>}
                            {visibleColumns.documento && <td className="px-6 py-2 text-[10px] font-bold text-slate-500">{t.medico_documento}</td>}
                            {visibleColumns.medico && <td className="px-6 py-2 text-[10px] font-black text-slate-700 uppercase">{t.medico ? `${t.medico.nombre} ${t.medico.apellido}` : '---'}</td>}
                            {visibleColumns.codigoProducto && <td className="px-6 py-2 text-[10px] font-bold text-slate-500">{t.producto_codigo}</td>}
                            {visibleColumns.producto && <td className="px-6 py-2 text-[10px] font-black text-slate-700 uppercase">{t.producto?.nombre || '---'}</td>}
                            {visibleColumns.compras && <td className="px-6 py-2 text-[10px] font-black text-slate-700">{t.unidades_compradas}</td>}
                            {visibleColumns.formulaciones && <td className="px-6 py-2 text-[10px] font-black text-slate-700">{t.unidades_formuladas}</td>}
                            {visibleColumns.valorComprado && <td className="px-6 py-2 text-[10px] font-black text-emerald-600">${Number(t.valor_comprado).toLocaleString()}</td>}
                            {visibleColumns.valorFormulado && <td className="px-6 py-2 text-[10px] font-black text-purple-600">${Number(t.valor_formulado).toLocaleString()}</td>}
                            <td className="px-6 py-2 text-center">
                                <button
                                    onClick={() => onEdit(t)}
                                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all transform hover:scale-110"
                                >
                                    <FaPencil className="w-3 h-3" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}