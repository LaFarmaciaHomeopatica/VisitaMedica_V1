import React from 'react';

export default function MedicoFormModal({
    isOpen, onClose,
    isEditing, data, setData, errors,
    processing, onSubmit,
    tiposDocumento, categorias,
    visitadorNombre,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
                <form onSubmit={onSubmit} className="max-h-[90vh] overflow-y-auto p-6">
                    <h3 className="text-lg font-black text-slate-800 mb-4 uppercase">
                        {isEditing ? 'Editar' : 'Nuevo'} Médico
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input placeholder="Nombre" value={data.nombre} onChange={e => setData('nombre', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                        <input placeholder="Apellido" value={data.apellido} onChange={e => setData('apellido', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />

                        <div className="flex gap-2">
                            <select value={data.tipo_documento_id} onChange={e => setData('tipo_documento_id', e.target.value)}
                                className="w-1/3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold" required>
                                <option value="" disabled>Tipo</option>
                                {tiposDocumento.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                            <input placeholder="Documento" type="number" value={data.documento} onChange={e => setData('documento', e.target.value)}
                                className="w-2/3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" required />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Categoría del Médico</label>
                            <select value={data.categoria_id} onChange={e => setData('categoria_id', e.target.value)}
                                className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Sin Categoría / Seleccionar...</option>
                                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                            </select>
                            {errors.categoria_id && <div className="text-red-500 text-[9px] mt-1 font-bold">{errors.categoria_id}</div>}
                        </div>

                        <input placeholder="Especialidad" value={data.especialidad} onChange={e => setData('especialidad', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                        <input placeholder="Teléfono" value={data.telefono_contacto} onChange={e => setData('telefono_contacto', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                        <input placeholder="Horario" value={data.horario_atencion} onChange={e => setData('horario_atencion', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />

                        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
                            <input placeholder="Dirección" value={data.direccion_detalles} onChange={e => setData('direccion_detalles', e.target.value)}
                                className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                            <input placeholder="Geo (Lat, Long)" value={data.geolocalizacion} onChange={e => setData('geolocalizacion', e.target.value)}
                                className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                        </div>

                        <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded-2xl flex gap-3">
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-blue-600 uppercase block mb-1 tracking-widest">ID Visitador</label>
                                <input type="number" value={data.visitador_id} onChange={e => setData('visitador_id', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-blue-200 text-sm outline-none" />
                                {visitadorNombre && <p className="text-[9px] text-blue-600 mt-1 font-bold italic tracking-tighter">{visitadorNombre}</p>}
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Fecha Inicio</label>
                                <input type="date" value={data.fecha_inicio_relacion} onChange={e => setData('fecha_inicio_relacion', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose}
                            className="flex-1 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 py-3 rounded-xl transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-[2] bg-[#3D3FD8] text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                            {processing ? 'Guardando...' : 'Confirmar Médico'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}