import React from 'react';

export default function ProductoFormModal({ isOpen, onClose, isEditing, data, setData, processing, onSubmit }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <form onSubmit={onSubmit} className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-10">
                <h3 className="text-2xl font-black text-slate-800 mb-8">
                    {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>

                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Código</label>
                        <input
                            type="text"
                            value={data.codigo}
                            onChange={e => setData('codigo', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre</label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Laboratorio</label>
                        <input
                            type="text"
                            value={data.laboratorio}
                            onChange={e => setData('laboratorio', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-[#3D3FD8] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all"
                    >
                        {processing ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                    <button type="button" onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase">
                        Cerrar
                    </button>
                </div>
            </form>
        </div>
    );
}