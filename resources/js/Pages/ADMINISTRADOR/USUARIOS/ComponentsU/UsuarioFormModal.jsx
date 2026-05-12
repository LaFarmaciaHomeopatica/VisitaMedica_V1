import React from 'react';

export default function UsuarioFormModal({
    isOpen, onClose, onSubmit,
    isEditing, data, setData,
    processing, errors, roles,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <form onSubmit={onSubmit} className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-10">
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                    {isEditing ? 'Editar Usuario' : 'Nuevo Registro'}
                </h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                    Completa los datos de acceso
                </p>

                <div className="space-y-6">
                    {/* Username */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                            Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            value={data.username}
                            onChange={e => setData('username', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                            required
                        />
                        {errors.username && <p className="text-rose-500 text-[10px] mt-2 font-black uppercase">{errors.username}</p>}
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20"
                            required={!isEditing}
                        />
                    </div>

                    {/* Rol + Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Rol</label>
                            <select
                                value={data.id_rol}
                                onChange={e => setData('id_rol', e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-600"
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {roles.map(rol => (
                                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                                ))}
                            </select>
                            {errors.id_rol && <p className="text-rose-500 text-[10px] mt-2 font-black">{errors.id_rol}</p>}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Estado</label>
                            <select
                                value={data.estado}
                                onChange={e => setData('estado', e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-600"
                            >
                                <option value="habilitado">HABILITADO</option>
                                <option value="inhabilitado">INHABILITADO</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-[#3D3FD8] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                    >
                        {processing ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                    >
                        CANCELAR
                    </button>
                </div>
            </form>
        </div>
    );
}