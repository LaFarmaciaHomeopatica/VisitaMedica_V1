import React from 'react';
import { FaXmark } from 'react-icons/fa6';

export default function TransaccionFormModal({
    isOpen, onClose,
    isEditing, data, setData,
    processing, errors, onSubmit,
    medicos, productos,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">

                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
                        {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <FaXmark className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-8 grid grid-cols-2 gap-6">
                    {/* Médico */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Médico</label>
                        <select
                            value={data.medico_documento}
                            onChange={e => setData('medico_documento', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/10"
                        >
                            <option value="">Seleccionar Médico</option>
                            {medicos.map(m => (
                                <option key={m.documento} value={m.documento}>
                                    {m.nombre} {m.apellido}
                                </option>
                            ))}
                        </select>
                        {errors.medico_documento && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.medico_documento}</p>}
                    </div>

                    {/* Producto */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Producto</label>
                        <select
                            value={data.producto_codigo}
                            onChange={e => setData('producto_codigo', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/10"
                        >
                            <option value="">Seleccionar Producto</option>
                            {productos.map(p => (
                                <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                            ))}
                        </select>
                        {errors.producto_codigo && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.producto_codigo}</p>}
                    </div>

                    {/* Unidades compradas */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Unidades Compradas</label>
                        <input
                            type="number"
                            value={data.unidades_compradas}
                            onChange={e => setData('unidades_compradas', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Valor comprado */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Valor Comprado</label>
                        <input
                            type="number"
                            value={data.valor_comprado}
                            onChange={e => setData('valor_comprado', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Semana */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Semana (1-53)</label>
                        <input
                            type="number"
                            value={data.semana}
                            onChange={e => setData('semana', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                        {errors.semana && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.semana}</p>}
                    </div>

                    {/* Acciones */}
                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-[#3D3FD8] text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                        >
                            {processing ? 'Guardando...' : 'Confirmar Registro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}