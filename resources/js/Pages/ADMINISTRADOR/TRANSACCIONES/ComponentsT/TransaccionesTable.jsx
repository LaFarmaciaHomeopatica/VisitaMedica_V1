import React from 'react';

export default function TransaccionesTable({
    currentItems, selectedIds,
    onToggleSelectOne,
    visibleColumns, onEdit,
}) {
    return (
        /* 1. Margen superior para compensar los elementos fijos */
        <div className="flex-grow w-full mt-[30px]">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto">
                    {/* 2. Cabecera Sticky con fondo azul y bordes claros */}
                    <thead className="sticky top-[-30px] z-30 shadow-sm">
                        <tr className="bg-blue-600 border-b border-slate-200">
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100 text-center w-10">Sel.</th>
                            {visibleColumns.fecha && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Fecha</th>}
                            {visibleColumns.documento && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Documento</th>}
                            {visibleColumns.medico && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Médico</th>}
                            {visibleColumns.codigoProducto && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Cód. Prod</th>}
                            {visibleColumns.producto && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Producto</th>}
                            {visibleColumns.compras && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Un. Compradas</th>}
                            {visibleColumns.formulaciones && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Un. Formuladas</th>}
                            {visibleColumns.valorComprado && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Val. Comprado</th>}
                            {visibleColumns.valorFormulado && <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Val. Formulado</th>}
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentItems.map(t => (
                            <tr
                                key={t.id}
                                className={`${selectedIds.includes(t.id) ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'} transition-colors group`}
                            >
                                <td className="px-6 py-1 border-r border-slate-50 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(t.id)}
                                        onChange={() => onToggleSelectOne(t.id)}
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </td>

                                {visibleColumns.fecha && (
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 uppercase">
                                            FECHA: {t.fecha}
                                        </span>
                                    </td>
                                )}

                                {visibleColumns.documento && (
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[10px] text-slate-600 font-medium">{t.medico_documento}</span>
                                    </td>
                                )}

                                {visibleColumns.medico && (
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        {t.medico ? (
                                            <span className="text-[11px] font-bold text-slate-700 uppercase leading-none">
                                                {t.medico.nombre} {t.medico.apellido}
                                            </span>
                                        ) : t.medico_temporal_nombre ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-bold text-amber-700 uppercase leading-none">{t.medico_temporal_nombre}</span>
                                                <span className="text-[8px] font-black bg-amber-100 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded uppercase">Temp</span>
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-slate-400">---</span>
                                        )}
                                    </td>
                                )}

                                {visibleColumns.codigoProducto && (
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[10px] text-slate-600 font-medium">{t.producto_codigo}</span>
                                    </td>
                                )}

                                {visibleColumns.producto && (
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[11px] font-bold text-slate-700 uppercase leading-none">
                                            {t.producto?.nombre || '---'}
                                        </span>
                                    </td>
                                )}

                                {visibleColumns.compras && (
                                    <td className="px-6 py-2 border-r border-slate-50 text-center font-black text-slate-700 text-[10px]">
                                        {t.unidades_compradas}
                                    </td>
                                )}

                                {visibleColumns.formulaciones && (
                                    <td className="px-6 py-2 border-r border-slate-50 text-center font-black text-slate-700 text-[10px]">
                                        {t.unidades_formuladas}
                                    </td>
                                )}

                                {visibleColumns.valorComprado && (
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[10px] font-black text-emerald-600">
                                            ${Number(t.valor_comprado).toLocaleString()}
                                        </span>
                                    </td>
                                )}

                                {visibleColumns.valorFormulado && (
                                    <td className="px-6 py-2 border-r border-slate-50">
                                        <span className="text-[10px] font-black text-purple-600">
                                            ${Number(t.valor_formulado).toLocaleString()}
                                        </span>
                                    </td>
                                )}

                                <td className="px-6 py-2 text-center flex gap-1 justify-center">
                                    <button
                                        onClick={() => onEdit(t)}
                                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm transform hover:scale-105"
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