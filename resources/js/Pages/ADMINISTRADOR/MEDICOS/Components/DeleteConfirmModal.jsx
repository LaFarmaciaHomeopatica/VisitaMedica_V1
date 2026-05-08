import React from 'react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, medicosSeleccionados }) {
    if (!isOpen) return null;

    const hasVisitorAssigned = medicosSeleccionados.some(m => m.visitador_id !== null);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 flex flex-col border border-slate-100">

                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>

                <h3 className="text-xl font-black text-slate-800 uppercase text-center">¿Confirmar eliminación?</h3>

                <div className="mt-6 max-h-[200px] overflow-y-auto space-y-2 mb-4 pr-2">
                    {medicosSeleccionados.map(medico => (
                        <div key={medico.id} className="flex flex-col p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-700">{medico.nombre} {medico.apellido}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Visitador:</span>
                                {medico.visitador ? (
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                        {medico.visitador.nombre} {medico.visitador.apellido}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-medium text-slate-400 italic">Sin asignar</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {hasVisitorAssigned && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-center mb-4">
                        <p className="text-[10px] text-amber-700 font-black uppercase flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            Atención: Hay visitadores vinculados
                        </p>
                    </div>
                )}

                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic text-center mb-6">
                    "Recuerda que el médico tiene un historial"
                </p>

                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm}
                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all">
                        Eliminar {medicosSeleccionados.length} Registro(s)
                    </button>
                    <button onClick={onClose}
                        className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}