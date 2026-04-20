import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';

const UsuarioIndex = ({ usuarios }) => {
    // --- ESTADOS DE UI ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // --- FORMULARIO DE INERTIA ---
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: null,
        username: '',
        password: '',
        id_rol: ''
    });

    const getRolName = (id_rol) => {
        const roles = {
            1: { nombre: 'Administrador', clase: 'bg-purple-100 text-purple-700' },
            4: { nombre: 'Visitador', clase: 'bg-blue-100 text-blue-700' },
        };
        return roles[id_rol] || { nombre: 'Usuario', clase: 'bg-gray-100 text-gray-700' };
    };

    // --- MANEJADORES ---
    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: user.id,
            username: user.username,
            password: '', // Password se deja vacío al editar por seguridad
            id_rol: user.id_rol
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gusuarios.update', data.id), {
                onSuccess: () => setIsModalOpen(false)
            });
        } else {
            post(route('Gusuarios.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = () => {
        destroy(route('Gusuarios.destroy', data.id), {
            onSuccess: () => setIsDeleteModalOpen(false)
        });
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Usuarios" />

            <div className="py-2">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800">Usuarios del Sistema</h2>
                            <p className="text-slate-500 text-sm">Control de accesos extraídos de la base de datos.</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="bg-[#3D3FD8] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">+</span> Crear Usuario
                        </button>
                    </div>

                    <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase tracking-wider text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {usuarios.length > 0 ? usuarios.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-5 font-bold text-slate-700">#{u.id}</td>
                                        <td className="px-6 py-5 font-semibold text-slate-600">@{u.username}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getRolName(u.id_rol).clase}`}>
                                                {getRolName(u.id_rol).nombre}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEditModal(u)} className="p-2 hover:bg-amber-100 text-slate-400 hover:text-amber-600 rounded-xl transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => { setData('id', u.id); setData('username', u.username); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-medium">No hay usuarios registrados en la base de datos.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODAL FORMULARIO --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-md rounded-[35px] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-slate-800 mb-6">{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={e => setData('username', e.target.value)}
                                    className={`w-full bg-slate-50 border rounded-2xl px-5 py-3 text-sm outline-none transition-all ${errors.username ? 'border-rose-500' : 'border-slate-100'}`}
                                    required
                                />
                                {errors.username && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.username}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    {isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm outline-none"
                                    required={!isEditing}
                                />
                                {errors.password && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rol Asignado</label>
                                <select
                                    value={data.id_rol}
                                    onChange={e => setData('id_rol', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm outline-none"
                                    required
                                >
                                    <option value="">Seleccione un rol...</option>
                                    <option value="1">Administrador</option>
                                    <option value="2">Visitador</option>
                                </select>
                                {errors.id_rol && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.id_rol}</p>}
                            </div>
                        </div>

                        <div className="pt-8 flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-400">Cancelar</button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-[#3D3FD8] text-white py-3 rounded-2xl font-bold text-sm shadow-lg disabled:bg-slate-200 transition-all"
                            >
                                {processing ? 'Enviando...' : 'Guardar Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- MODAL ELIMINAR --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">¿Confirmar eliminación?</h3>
                        <p className="text-slate-500 text-sm mb-8">Borrarás a <b>@{data.username}</b>. Esta acción es permanente.</p>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleDelete} className="bg-rose-500 text-white w-full py-4 rounded-2xl font-bold text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-100">Sí, eliminar permanentemente</button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 py-2 text-sm font-bold hover:text-slate-600">No, cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default UsuarioIndex;