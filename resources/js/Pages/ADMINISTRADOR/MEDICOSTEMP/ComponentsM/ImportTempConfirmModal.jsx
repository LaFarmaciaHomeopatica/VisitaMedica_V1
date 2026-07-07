import React from 'react';
import { FaFileExcel, FaCircleExclamation } from 'react-icons/fa6';

export default function ImportTempConfirmModal({ isOpen, onClose, onConfirm, file, importando }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={!importando ? onClose : undefined} />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">

                <div className="flex items-center gap-3 mb-3">
                    <FaFileExcel className="text-indigo-500 text-xl" />
                    <h3 className="text-base font-black text-slate-800 uppercase">Importar médicos temporales</h3>
                </div>

                <p className="text-sm text-slate-500 mb-2">
                    Se importará el siguiente archivo:
                </p>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4">
                    <FaFileExcel className="text-emerald-600 shrink-0" />
                    <span className="text-sm font-bold text-slate-700 truncate">{file?.name ?? 'archivo.xlsx'}</span>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-6">
                    <FaCircleExclamation className="text-amber-500 text-xs mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-700">
                        Los registros existentes (mismo documento) se actualizarán; los nuevos se crearán.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={importando}
                        className="px-5 py-2 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl disabled:opacity-40 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={importando}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-indigo-700 disabled:opacity-60 transition flex items-center gap-2"
                    >
                        {importando ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Importando...
                            </>
                        ) : (
                            'Confirmar Importación'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}