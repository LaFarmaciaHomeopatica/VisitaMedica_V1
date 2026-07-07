import React, { useState } from 'react';
import { FaFileExcel, FaTriangleExclamation } from 'react-icons/fa6';

export default function ExportTempConfirmModal({ isOpen, onClose, onConfirm, selectedIds = [] }) {
    const [exportando, setExportando] = useState(false);

    if (!isOpen) return null;

    const noHaySeleccion = selectedIds.length === 0;

    const handleConfirmar = () => {
        if (noHaySeleccion) return;
        setExportando(true);
        onConfirm();

        // Como la descarga es window.location.href (no da callback real),
        // simulamos el cierre tras un breve delay para dar feedback visual.
        setTimeout(() => {
            setExportando(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={!exportando ? onClose : undefined} />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">

                {noHaySeleccion ? (
                    <>
                        <div className="flex items-center gap-3 mb-3">
                            <FaTriangleExclamation className="text-amber-500 text-xl" />
                            <h3 className="text-base font-black text-slate-800 uppercase">Sin registros seleccionados</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Selecciona al menos un registro en la tabla antes de exportar.
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition"
                            >
                                Entendido
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-3">
                            <FaFileExcel className="text-emerald-500 text-xl" />
                            <h3 className="text-base font-black text-slate-800 uppercase">Exportar médicos temporales</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-6">
                            Se exportarán <span className="font-black text-slate-700">{selectedIds.length}</span> registro{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''} a Excel.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={exportando}
                                className="px-5 py-2 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl disabled:opacity-40 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmar}
                                disabled={exportando}
                                className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-emerald-700 disabled:opacity-60 transition flex items-center gap-2"
                            >
                                {exportando ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Exportando...
                                    </>
                                ) : (
                                    'Confirmar Exportación'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}