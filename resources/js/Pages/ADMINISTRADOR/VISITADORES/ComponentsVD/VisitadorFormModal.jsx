// resources/js/Pages/ADMINISTRADOR/VISITADORES/ComponentsVD/VisitadorFormModal.jsx
import React from 'react';

const VisitadorFormModal = ({ isOpen, onClose, isEditing, form, ui, tiposDocumento }) => {
    if (!isOpen) return null;

    const { data, setData, errors, processing, post, put } = form;
    const { userName, isSearching } = ui;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gvisitadores.update', data.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('Gvisitadores.store'), {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-xl font-black text-slate-800 mb-6 uppercase">
                        {isEditing ? 'Actualizar Visitador' : 'Nuevo Visitador'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* ID Usuario Sistema */}
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black text-blue-500 uppercase mb-2">ID Usuario Sistema *</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={data.usuario_id}
                                    onChange={e => setData('usuario_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={isEditing}
                                    required
                                />
                                {isSearching && <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
                            </div>
                            <div className="mt-2 text-[10px] font-bold uppercase">
                                <span className={userName.includes('no encontrado') ? 'text-rose-500' : 'text-blue-700'}>
                                    {userName || "Esperando ID..."}
                                </span>
                            </div>
                            {errors.usuario_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.usuario_id}</p>}
                        </div>

                        {/* Zona Asignada */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Zona Asignada</label>
                            <select value={data.zona_id} onChange={e => setData('zona_id', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" required>
                                <option value="">Seleccione...</option>
                                <option value="1">Zona 1 - Norte</option>
                                <option value="2">Zona 2 - Sur</option>
                                <option value="3">Zona 3 - Centro</option>
                            </select>
                            {errors.zona_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.zona_id}</p>}
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nombre</label>
                            <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm uppercase outline-none" required />
                            {errors.nombre && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.nombre}</p>}
                        </div>

                        {/* Apellido */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Apellido</label>
                            <input type="text" value={data.apellido} onChange={e => setData('apellido', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm uppercase outline-none" required />
                            {errors.apellido && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.apellido}</p>}
                        </div>

                        {/* Tipo de Documento */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo de Documento</label>
                            <select value={data.tipo_documento_id} onChange={e => setData('tipo_documento_id', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none" required>
                                <option value="">Seleccione...</option>
                                {tiposDocumento.map(tipo => (<option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>))}
                            </select>
                            {errors.tipo_documento_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.tipo_documento_id}</p>}
                        </div>

                        {/* Número Documento */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Número Documento</label>
                            <input type="text" value={data.documento} onChange={e => setData('documento', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none" required />
                            {errors.documento && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.documento}</p>}
                        </div>

                        {/* Estado del Visitador */}
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Estado del Visitador</label>
                            <select
                                value={data.estado}
                                onChange={e => setData('estado', e.target.value)}
                                className={`w-full border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${data.estado === 'habilitado' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                                required
                            >
                                <option value="habilitado">Habilitado</option>
                                <option value="inhabilitado">Inhabilitado</option>
                            </select>
                            {errors.estado && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.estado}</p>}
                        </div>

                        {/* Meta de Visitas Mensual */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Meta de Visitas Mensual</label>
                            <input type="number" value={data.meta_visitas_mensual} onChange={e => setData('meta_visitas_mensual', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none" />
                            {errors.meta_visitas_mensual && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.meta_visitas_mensual}</p>}
                        </div>

                        {/* Meta de Ventas Mensual */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Meta de Ventas Mensual</label>
                            <input type="number" value={data.meta_ventas_mensual} onChange={e => setData('meta_ventas_mensual', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none" />
                            {errors.meta_ventas_mensual && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.meta_ventas_mensual}</p>}
                        </div>

                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing || (!isEditing && (!userName || userName.includes('no encontrado')))}
                            className="flex-[2] py-4 bg-[#3D3FD8] text-white rounded-2xl font-black text-[11px] uppercase shadow-lg hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all"
                        >
                            {processing ? 'GUARDANDO...' : isEditing ? 'CONFIRMAR CAMBIOS' : 'REGISTRAR VISITADOR'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VisitadorFormModal;