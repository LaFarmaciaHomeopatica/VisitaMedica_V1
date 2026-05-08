import React from 'react';

export default function ImportWarningModal({ isOpen, duplicatesCount, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-red-900/40 backdrop-blur-md" />
            <div className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-8 text-center">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">MÉDICOS YA EXISTENTES</h3>
                <p className="text-slate-500 text-sm mb-6 uppercase font-bold tracking-tighter">
                    Se detectaron <span className="text-red-600 font-black">{duplicatesCount} documentos</span> que ya están en el sistema.
                    ¿Deseas actualizar su información con los datos del Excel?
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm}
                        className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-900 transition-all tracking-widest">
                        SÍ, SOBREESCRIBIR DATOS
                    </button>
                    <button onClick={onCancel}
                        className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all tracking-widest">
                        CANCELAR Y REVISAR
                    </button>
                </div>
            </div>
        </div>
    );
}