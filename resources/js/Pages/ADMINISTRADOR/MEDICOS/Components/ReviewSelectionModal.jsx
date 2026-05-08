import React, { useState } from 'react';

export default function ReviewSelectionModal({ isOpen, onClose, onConfirm, medicosSeleccionados }) {
    const [tempIds, setTempIds] = useState(() => medicosSeleccionados.map(m => m.id));

    if (!isOpen) return null;

    const toggle = (id) => setTempIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100">

                <div className="p-8 pb-4 text-center">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Revisar Selección</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        Selecciona los médicos que realmente deseas reasignar
                    </p>
                </div>

                <div className="max-h-[300px] overflow-y-auto px-6 py-2 space-y-2 bg-slate-50/50">
                    {medicosSeleccionados.map(medico => {
                        const isSelected = tempIds.includes(medico.id);
                        return (
                            <div key={medico.id} onClick={() => toggle(medico.id)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all
                                    ${isSelected ? 'bg-white border-indigo-500 shadow-sm' : 'bg-slate-100 border-transparent opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{medico.nombre} {medico.apellido}</p>
                                        {medico.visitador_id ? (
                                            <p className="text-[9px] font-black text-amber-600 uppercase">
                                                Vínculo actual: {medico.visitador?.nombre} {medico.visitador?.apellido}
                                            </p>
                                        ) : (
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sin visitador previo</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 bg-white space-y-3">
                    <button disabled={tempIds.length === 0} onClick={() => onConfirm(tempIds)}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50">
                        Continuar con {tempIds.length} Médicos
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 transition-colors">
                        Cancelar todo
                    </button>
                </div>
            </div>
        </div>
    );
}