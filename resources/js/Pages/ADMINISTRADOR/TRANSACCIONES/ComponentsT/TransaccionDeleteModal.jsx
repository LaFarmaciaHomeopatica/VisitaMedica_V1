import React from 'react';
import { FaTrashCan } from 'react-icons/fa6';

export default function TransaccionDeleteModal({ isOpen, onClose, onConfirm, count }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center border border-slate-100">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaTrashCan className="w-8 h-8" />
                </div>
                <h3 className="text-[14px] font-black text-slate-800 uppercase mb-2">¿Confirmar Eliminación?</h3>
                <p className="text-slate-400 text-[11px] font-medium mb-8 leading-relaxed">
                    Estás a punto de eliminar {count} registros. Esta acción es irreversible y afectará los reportes estadísticos.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all"
                    >
                        Sí, Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}