import React from 'react';

export default function ExportConfirmModal({ isOpen, onClose, onConfirm, selectedIds, medicos }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase">Confirmar Exportación</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                </div>

                {selectedIds.length === 0 && (
                    <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <p className="text-amber-800 text-[10px] font-black uppercase">No hay médicos seleccionados</p>
                            <p className="text-amber-600 text-[9px] font-bold uppercase">Selecciona al menos un registro en la tabla para exportar.</p>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto p-2 bg-white">
                    {selectedIds.length > 0 ? (
                        <table className="w-full text-[9px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 uppercase">
                                    {['Tipo Documento', 'Documento', 'Nombre', 'Especialidad', 'Categoría',
                                        'Teléfono', 'Geolocalización', 'Detalles Dirección', 'Horario Atención',
                                        'Visitador Asignado', 'Fecha Inicio Relación'].map(h => (
                                            <th key={h} className="px-2 py-2 font-bold text-slate-600 border border-slate-200">{h}</th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                {medicos.filter(m => selectedIds.includes(m.id)).map((m, i) => (
                                    <tr key={m.id || i} className="hover:bg-slate-50">
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.tipo_documento?.nombre || 'N/A'}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.documento}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.nombre}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.especialidad}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.categoria?.nombre || 'N/A'}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.telefono_contacto}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap font-mono text-[8px]">{m.geolocalizacion}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.direccion_detalles}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.horario_atencion}</td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">
                                            {m.visitador ? `${m.visitador.nombre} ${m.visitador.apellido}` : 'Sin asignar'}
                                        </td>
                                        <td className="px-2 py-1 border border-slate-100 whitespace-nowrap">{m.fecha_inicio_relacion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-slate-300">
                            <span className="text-[10px] font-black uppercase tracking-widest">Esperando selección...</span>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-4">
                    <span className="text-slate-500 text-[10px] font-bold uppercase">{selectedIds.length} Médicos listos</span>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-6 py-2 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-200 rounded-xl">Volver</button>
                        <button onClick={onConfirm} disabled={selectedIds.length === 0}
                            className={`px-8 py-2 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg ${selectedIds.length === 0 ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            Generar Archivo .XLSX
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}