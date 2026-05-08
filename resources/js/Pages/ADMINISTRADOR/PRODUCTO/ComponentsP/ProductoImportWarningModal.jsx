import React from 'react';

export default function ProductoImportWarningModal({ isOpen, duplicatesCount, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-red-900/40 backdrop-blur-md" />
            <div className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-10 text-center">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">!</div>
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">Sobreescribir Datos</h3>
                <p className="text-slate-500 text-[10px] mb-8 font-bold uppercase tracking-tight">
                    Se encontraron <span className="text-red-600 font-black">{duplicatesCount} códigos</span> repetidos.
                    ¿Deseas actualizar la información de estos productos con los datos del Excel?
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm}
                        className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                        SÍ, ACTUALIZAR EXISTENTES
                    </button>
                    <button onClick={onCancel}
                        className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                        VOLVER A REVISAR
                    </button>
                </div>
            </div>
        </div>
    );
}