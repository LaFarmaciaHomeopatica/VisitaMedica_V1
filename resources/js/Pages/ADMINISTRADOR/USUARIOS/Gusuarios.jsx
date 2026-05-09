import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

const UsuarioIndex = ({ usuarios = [], roles = [] }) => {
    // --- ESTADOS DE UI ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // --- ESTADOS DE BÚSQUEDA Y PAGINACIÓN ---
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: null,
        username: '',
        password: '',
        id_rol: '',
        estado: 'habilitado'
    });

    // Lógica de Filtrado y Paginación
    const filteredUsuarios = usuarios.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsuarios.length / (itemsPerPage || 1));

    const getRolInfo = (id_rol) => {
        const rolEncontrado = roles.find(r => r.id === parseInt(id_rol));
        const nombre = rolEncontrado ? rolEncontrado.nombre : 'Sin Rol';
        return {
            nombre: nombre,
            clase: 'bg-blue-50 text-blue-700 border border-blue-100'
        };
    };

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
            password: '', // Se deja vacío por seguridad al editar
            id_rol: user.id_rol,
            estado: user.estado
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            // Coincide con Route::put('/Gusuarios/{id}')
            put(route('Gusuarios.update', { id: data.id }), {
                onSuccess: () => setIsModalOpen(false),
                preserveScroll: true
            });
        } else {
            // Coincide con Route::post('/Gusuarios')
            post(route('Gusuarios.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                preserveScroll: true
            });
        }
    };

    const handleConfirmDelete = () => {
        // Coincide con Route::delete('/Gusuarios/{id}')
        destroy(route('Gusuarios.destroy', { id: data.id }), {
            onSuccess: () => setIsDeleteModalOpen(false),
            preserveScroll: true
        });
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Usuarios" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                {/* BARRA SUPERIOR DE ACCIONES */}
                <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 w-full">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7-0 11-14 0 7 7-0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="BUSCAR USUARIO POR USERNAME..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="bg-[#3D3FD8] text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all"
                        >
                            + Nuevo Usuario
                        </button>
                    </div>
                </div>

                {/* BARRA DE PAGINACIÓN */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar</span>
                            <input
                                type="number"
                                value={itemsPerPage === 0 ? '' : itemsPerPage}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setItemsPerPage(val === '' ? 0 : parseInt(val, 10));
                                    setCurrentPage(1);
                                }}
                                className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">registros</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex items-center gap-2 px-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Página</span>
                            <input type="number" value={currentPage} className="w-10 text-center bg-white border border-slate-200 rounded-lg text-[10px] font-black text-blue-600 p-1" readOnly />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">de {totalPages || 1}</span>
                        </div>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>

                {/* TABLA */}
                <div className="flex-grow w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Username</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Rol Asignado</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Estado</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentItems.length > 0 ? currentItems.map((u) => {
                                const rolInfo = getRolInfo(u.id_rol);
                                return (
                                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-3 border-r border-slate-50">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase">@{u.username}</span>
                                        </td>
                                        <td className="px-6 py-3 border-r border-slate-50">
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-tighter ${rolInfo.clase}`}>
                                                {rolInfo.nombre}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 border-r border-slate-50">
                                            <div className="flex flex-col leading-tight">
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${u.estado === 'habilitado' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {u.estado}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openEditModal(u)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => { setData('id', u.id); setIsDeleteModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                                        No se encontraron registros
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL FORMULARIO --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-10">
                        <h3 className="text-2xl font-black text-slate-800 mb-2">{isEditing ? 'Editar Usuario' : 'Nuevo Registro'}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Completa los datos de acceso</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Nombre de Usuario</label>
                                <input type="text" value={data.username} onChange={e => setData('username', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20" required />
                                {errors.username && <p className="text-rose-500 text-[10px] mt-2 font-black uppercase">{errors.username}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Contraseña </label>
                                <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20" required={!isEditing} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Rol</label>
                                    <select value={data.id_rol} onChange={e => setData('id_rol', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-600" required>
                                        <option value="">Seleccionar...</option>
                                        {roles.map((rol) => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
                                    </select>
                                    {errors.id_rol && <p className="text-rose-500 text-[10px] mt-2 font-black">{errors.id_rol}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Estado</label>
                                    <select value={data.estado} onChange={e => setData('estado', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-600">
                                        <option value="habilitado">HABILITADO</option>
                                        <option value="inhabilitado">INHABILITADO</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col gap-3">
                            <button type="submit" disabled={processing} className="w-full bg-[#3D3FD8] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                                {processing ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- MODAL ELIMINAR --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[35px] shadow-2xl p-10 text-center">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">¿Eliminar Usuario?</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Esta acción no se puede deshacer</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleConfirmDelete} className="bg-rose-600 text-white w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all">
                                CONFIRMAR ELIMINACIÓN
                            </button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 py-2 text-[10px] font-black uppercase hover:text-slate-600">REGRESAR</button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default UsuarioIndex;