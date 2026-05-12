import React from 'react';

export default function UsuarioDeleteModal({ isOpen, onClose, onConfirm, processing }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-white w-full max-w-sm rounded-[35px] shadow-2xl p-10 text-center">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">¿Eliminar Usuario?</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                    Esta acción no se puede deshacer
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className="bg-rose-600 text-white w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all"
                    >
                        {processing ? 'ELIMINANDO...' : 'CONFIRMAR ELIMINACIÓN'}
                    </button>
                    <button
                        onClick={onClose}
                        className="text-slate-400 py-2 text-[10px] font-black uppercase hover:text-slate-600"
                    >
                        REGRESAR
                    </button>
                </div>
            </div>
        </div>
    );
}