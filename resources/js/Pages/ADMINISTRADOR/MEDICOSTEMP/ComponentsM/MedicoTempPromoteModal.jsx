import React from 'react';

export default function MedicoTempPromoteModal({
    isOpen, onClose, onSubmit,
    data, setData, processing, errors,
    categorias, visitadores, tiposDocumento,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            />
            <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-12 overflow-y-auto max-h-[90vh]">

                {/* Cabecera */}
                <div className="mb-10 text-center">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                        Oficializar Médico
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                        Convierte este registro temporal en un perfil oficial
                    </p>
                </div>

                {/* Campos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Tipo de documento */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Tipo de Documento
                        </label>
                        <select
                            value={data.tipo_documento_id}
                            onChange={e => setData('tipo_documento_id', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {tiposDocumento.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                        {errors.tipo_documento_id && (
                            <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.tipo_documento_id}</p>
                        )}
                    </div>

                    {/* Documento */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Documento
                        </label>
                        <input
                            type="text"
                            value={data.documento}
                            onChange={e => setData('documento', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                        />
                        {errors.documento && (
                            <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.documento}</p>
                        )}
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                        />
                        {errors.nombre && (
                            <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.nombre}</p>
                        )}
                    </div>

                    {/* Apellido */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Apellido
                        </label>
                        <input
                            type="text"
                            value={data.apellido}
                            onChange={e => setData('apellido', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                        />
                        {errors.apellido && (
                            <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.apellido}</p>
                        )}
                    </div>

                    {/* Especialidad */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Especialidad
                        </label>
                        <input
                            type="text"
                            value={data.especialidad}
                            onChange={e => setData('especialidad', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {/* Teléfono */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Teléfono de Contacto
                        </label>
                        <input
                            type="text"
                            value={data.telefono_contacto}
                            onChange={e => setData('telefono_contacto', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {/* Horario */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Horario de Atención
                        </label>
                        <input
                            type="text"
                            value={data.horario_atencion}
                            onChange={e => setData('horario_atencion', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Dirección
                        </label>
                        <input
                            type="text"
                            value={data.direccion_detalles}
                            onChange={e => setData('direccion_detalles', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {/* Geolocalización */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Geolocalización
                        </label>
                        <input
                            type="text"
                            value={data.geolocalizacion}
                            onChange={e => setData('geolocalizacion', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Categoría
                        </label>
                        <select
                            value={data.categoria_id}
                            onChange={e => setData('categoria_id', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">Sin categoría</option>
                            {categorias.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Visitador */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Visitador Asignado
                        </label>
                        <select
                            value={data.visitador_id}
                            onChange={e => setData('visitador_id', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">Sin asignar</option>
                            {visitadores.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.nombre} {v.apellido}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha inicio relación */}
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Fecha Inicio Relación
                        </label>
                        <input
                            type="date"
                            value={data.fecha_inicio_relacion}
                            onChange={e => setData('fecha_inicio_relacion', e.target.value)}
                            className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                {/* Acciones */}
                <div className="mt-12 flex gap-4">
                    <button
                        onClick={onSubmit}
                        disabled={processing}
                        className="flex-1 bg-indigo-600 text-white py-5 rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-60"
                    >
                        {processing ? 'PROCESANDO...' : 'GUARDAR Y ACTIVAR MÉDICO'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 disabled:opacity-40"
                    >
                        Descartar
                    </button>
                </div>
            </div>
        </div>
    );
}