import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { FaChartLine, FaCircleNotch } from 'react-icons/fa6';

export default function MedicosTable({ currentItems, selectedIds, onSelectOne, onEdit, onView }) {
    // true mientras Inertia navega hacia el detalle del médico
    const [cargandoDetalle, setCargandoDetalle] = useState(false);

    const verDetalle = (m) => {
        if (cargandoDetalle) return; // evita doble clic mientras carga
        setCargandoDetalle(true);
        router.visit(route('Gmedicos.show', m.id), {
            onFinish: () => setCargandoDetalle(false),
        });
    };

    return (
        /* 
           1. mt-[185px]: Este margen es VITAL. 
              Debe ser la suma de: Header + Toolbar + Paginator.
              Como ahora los de arriba son fixed/sticky, este margen evita que la tabla empiece debajo de ellos.
        */
        <div className="flex-grow w-full mt-[30px]">

            {/* ── OVERLAY DE CARGA A PANTALLA COMPLETA ─────────────── */}
            {cargandoDetalle && (
                <div className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 px-8 py-6 flex flex-col items-center gap-3">
                        <FaCircleNotch className="h-7 w-7 text-blue-600 animate-spin" />
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Cargando detalle del médico…
                        </p>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto">
                    {/* 
                       2. top-[188px]: 
                          Si tu paginador está en top-[144px] y mide unos 44px de alto, 
                          el thead debe estar en 188px para que no se traslape.
                    */}
                    <thead className="sticky top-[-30px] z-30 shadow-sm">
                        <tr className="bg-blue-600 border-b border-slate-200">
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100 text-center w-10">Sel.</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Nombre Completo</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Documento</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Especialidad</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Categoría</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Visitador</th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {currentItems.map(m => (
                            <tr
                                key={m.id}
                                className={`${selectedIds.includes(m.id) ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'} transition-colors group`}
                            >
                                <td className="px-6 py-1 border-r border-slate-50 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(m.id)}
                                        onChange={() => onSelectOne(m.id)}
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </td>
                                {/* ... resto de tus celdas ... */}
                                <td className="px-6 py-2 border-r border-slate-50">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase leading-none">
                                        {m.nombre}
                                    </span>
                                </td>
                                <td className="px-6 py-2 border-r border-slate-50">
                                    <span className="text-[10px] text-slate-600 font-medium">
                                        {m.tipo_documento?.nombre || 'DOC'}: {m.documento}
                                    </span>
                                </td>
                                <td className="px-6 py-2 border-r border-slate-50">
                                    <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
                                        {m.especialidad || 'GENERAL'}
                                    </span>
                                </td>
                                <td className="px-6 py-2 border-r border-slate-50">
                                    {m.categoria ? (
                                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 uppercase">
                                            {m.categoria.nombre}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] text-slate-300 italic">N/A</span>
                                    )}
                                </td>
                                <td className="px-6 py-2 border-r border-slate-50">
                                    {m.visitador ? (
                                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-tight">
                                            {m.visitador.nombre}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] text-slate-300 italic">Sin asignar</span>
                                    )}
                                </td>
                                <td className="px-6 py-2 text-center flex gap-1 justify-center">
                                    <button
                                        onClick={() => verDetalle(m)}
                                        disabled={cargandoDetalle}
                                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm inline-flex items-center disabled:opacity-50 disabled:cursor-wait"
                                        title="Ver detalle"
                                    >
                                        <FaChartLine className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => onEdit(m)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => onView(m)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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