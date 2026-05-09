import React from 'react';

export default function VisitaFormModal({
    isOpen, onClose, onSubmit,
    isEditing, data, setData,
    processing, errors,
    visitadores, medicosFiltradosPorVisitador,
    onFechaProgramadaChange, onMedicoChange,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <form
                onSubmit={onSubmit}
                className="relative bg-white w-full max-w-lg rounded-[30px] shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-slate-100"
            >
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                        {isEditing ? 'EDITAR VISITA' : 'NUEVA VISITA'}
                    </h3>
                    <div className="h-1 w-12 bg-[#3D3FD8] mt-1 rounded-full" />
                </div>

                <div className="space-y-5">
                    {/* Visitador + Médico */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                                Visitador Responsable
                            </label>
                            <select
                                value={data.visitador_id}
                                onChange={e => setData(prev => ({ ...prev, visitador_id: e.target.value, medico_id: '' }))}
                                className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all ${errors.visitador_id ? 'border-rose-500' : ''}`}
                                required
                            >
                                <option value="">SELECCIONAR...</option>
                                {visitadores.map(v => (
                                    <option key={v.id} value={v.id}>{v.nombre}</option>
                                ))}
                            </select>
                            {errors.visitador_id && (
                                <p className="text-rose-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.visitador_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                                Médico / Contacto
                            </label>
                            <select
                                value={data.medico_id}
                                onChange={e => onMedicoChange(e.target.value)}
                                className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all disabled:opacity-50 ${errors.medico_id ? 'border-rose-500' : ''}`}
                                required
                                disabled={!data.visitador_id}
                            >
                                <option value="">{data.visitador_id ? 'SELECCIONAR...' : 'ELIJA VISITADOR'}</option>
                                {medicosFiltradosPorVisitador.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                            {errors.medico_id && (
                                <p className="text-rose-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.medico_id}</p>
                            )}
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                                Fecha Programada
                            </label>
                            <input
                                type="datetime-local"
                                value={data.fecha_programada}
                                onChange={e => onFechaProgramadaChange(e.target.value)}
                                className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all ${errors.fecha_programada ? 'border-rose-500 bg-rose-50' : ''}`}
                                required
                            />
                            {errors.fecha_programada && (
                                <p className="text-rose-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.fecha_programada}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                                Fecha de Cierre
                            </label>
                            <input
                                type="datetime-local"
                                value={data.fecha_realizada}
                                onChange={e => setData('fecha_realizada', e.target.value)}
                                className="w-full bg-blue-50/50 border-2 border-blue-100/50 rounded-2xl p-3.5 text-xs font-bold text-blue-700 outline-none focus:border-[#3D3FD8] transition-all"
                            />
                        </div>
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                            Estado de la Visita
                        </label>
                        <select
                            value={data.estado}
                            onChange={e => setData('estado', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all"
                        >
                            <option value="sin programar">SIN PROGRAMAR</option>
                            <option value="programada">PROGRAMADA</option>
                            <option value="efectiva">EFECTIVA (COMPLETADA)</option>
                            <option value="No contactado">NO CONTACTADO</option>
                            <option value="reprogramada">REPROGRAMADA</option>
                            <option value="cancelada">CANCELADA</option>
                        </select>
                    </div>

                    {/* Comentarios */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                            Comentarios y Notas
                        </label>
                        <textarea
                            value={data.comentarios}
                            onChange={e => setData('comentarios', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold h-32 outline-none focus:bg-white focus:border-[#3D3FD8] transition-all"
                            placeholder="DETALLES DE LA REUNIÓN, MUESTRAS ENTREGADAS, ETC..."
                        />
                    </div>
                </div>

                {/* Acciones */}
                <div className="mt-10 flex flex-col gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-[#3D3FD8] text-white py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.15em] hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-xl shadow-blue-200 active:scale-95"
                    >
                        {processing ? 'GUARDANDO DATOS...' : 'CONFIRMAR REGISTRO'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                        DESCARTAR CAMBIOS
                    </button>
                </div>
            </form>
        </div>
    );
}