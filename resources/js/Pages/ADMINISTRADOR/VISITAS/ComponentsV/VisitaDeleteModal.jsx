import React from 'react';

export default function VisitaDeleteModal({ isOpen, onClose, onConfirm, processing }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl border border-rose-50">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black animate-pulse">
                    !
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">¿CONFIRMAR?</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">
                    ESTA ACCIÓN BORRARÁ PERMANENTEMENTE EL HISTORIAL DE ESTA VISITA.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        disabled={processing}
                        onClick={onConfirm}
                        className="bg-rose-600 text-white w-full py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                    >
                        {processing ? 'ELIMINANDO...' : 'SÍ, ELIMINAR AHORA'}
                    </button>
                    <button
                        onClick={onClose}
                        className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors py-2"
                    >
                        CANCELAR ACCIÓN
                    </button>
                </div>
            </div>
        </div>
    );
}