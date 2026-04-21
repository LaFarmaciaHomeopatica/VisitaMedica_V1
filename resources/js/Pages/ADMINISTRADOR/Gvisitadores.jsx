import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';
import axios from 'axios';

const Index = ({ visitadores, tiposDocumento }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userName, setUserName] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: null,
        usuario_id: '',
        nombre: '',
        apellido: '',
        documento: '',
        tipo_documento_id: '',
        zona_id: '',
        estado: 'habilitado'
    });

    // Buscar nombre de usuario dinámicamente al escribir el ID
    useEffect(() => {
        const buscarUsuario = async () => {
            if (data.usuario_id && !isEditing) {
                setIsSearching(true);
                try {
                    // La ruta debe coincidir con la de tu web.php
                    const response = await axios.get(`/usuarios/buscar/${data.usuario_id}`);
                    // AJUSTE: Usamos 'username' que es el campo real en tu BD
                    setUserName(response.data.nombre || response.data.username || 'Usuario encontrado');
                } catch (error) {
                    setUserName('Usuario no encontrado');
                } finally {
                    setIsSearching(false);
                }
            } else if (!data.usuario_id && !isEditing) {
                setUserName('');
            }
        };

        const timer = setTimeout(buscarUsuario, 500);
        return () => clearTimeout(timer);
    }, [data.usuario_id, isEditing]);

    const openCreateModal = () => {
        reset();
        clearErrors();
        setUserName('');
        setIsEditing(false);
        setIsFormModalOpen(true);
    };

    const openEditModal = (v) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: v.id,
            usuario_id: v.usuario_id,
            nombre: v.nombre,
            apellido: v.apellido,
            documento: v.documento,
            tipo_documento_id: v.tipo_documento_id || '',
            zona_id: v.zona_id,
            estado: v.estado
        });
        // AJUSTE: Muestra el 'username' desde la relación del modelo
        setUserName(v.user ? `Vinculado a: ${v.user.username}` : `ID: ${v.usuario_id}`);
        setIsFormModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gvisitadores.update', data.id), {
                onSuccess: () => setIsFormModalOpen(false)
            });
        } else {
            post(route('Gvisitadores.store'), {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = () => {
        destroy(route('Gvisitadores.destroy', data.id), {
            onSuccess: () => setIsDeleteModalOpen(false)
        });
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Visitadores" />

            <div className="py-2">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800">Visitadores Médicos</h2>
                            <p className="text-slate-500 text-sm">Personal extraído de la base de datos.</p>
                        </div>
                        <button onClick={openCreateModal} className="bg-[#3D3FD8] text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition-all flex items-center gap-2">
                            <span className="text-xl">+</span> Registrar Nuevo
                        </button>
                    </div>

                    <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-slate-400 font-bold text-xs uppercase">Visitador</th>
                                    <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase">Documento</th>
                                    <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase">Zona</th>
                                    <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {visitadores.length > 0 ? visitadores.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold uppercase">
                                                    {v.nombre ? v.nombre.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-slate-700 capitalize">{v.nombre} {v.apellido}</span>
                                                    <span className="text-[10px] text-blue-500 font-bold uppercase">
                                                        {/* AJUSTE: Mostrar username en la tabla */}
                                                        {v.user ? `Usuario: ${v.user.username}` : 'Sin usuario'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="block text-sm font-medium text-slate-600">{v.documento}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                                                {v.tipo_documento ? v.tipo_documento.nombre : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-blue-50 text-[#3D3FD8] rounded-lg text-xs font-bold capitalize">
                                                {v.zona_id ? `Zona ${v.zona_id}` : 'No asignada'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEditModal(v)} className="p-2 hover:bg-amber-100 text-slate-400 hover:text-amber-600 rounded-xl transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button onClick={() => { setData('id', v.id); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-medium">No se encontraron visitadores registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Formulario */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[35px] shadow-2xl overflow-hidden">
                        <form className="p-8" onSubmit={handleSubmit}>
                            <h3 className="text-2xl font-black text-slate-800 mb-6">{isEditing ? 'Editar Visitador' : 'Nuevo Visitador'}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-blue-500 uppercase mb-2">ID Usuario Sistema *</label>
                                    <div className="relative">
                                        <input type="number" value={data.usuario_id} onChange={e => setData('usuario_id', e.target.value)} className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm transition-all ${errors.usuario_id ? 'border-rose-500' : 'border-slate-100'}`} disabled={isEditing} required />
                                        {isSearching && <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
                                    </div>
                                    {errors.usuario_id && <p className="text-rose-500 text-[10px] mt-1 font-bold">{errors.usuario_id}</p>}
                                </div>

                                <div className="flex flex-col justify-center">
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Verificación de Cuenta:</label>
                                    <div className={`text-sm font-bold ${userName.includes('no encontrado') ? 'text-rose-500' : 'text-blue-700'}`}>
                                        {userName || "Ingrese un ID..."}
                                    </div>
                                </div>

                                {/* ... resto de los inputs (nombre, apellido, etc) ... */}
                                {/* Asegúrate de mantener tus selects de tipo_documento_id y zona_id */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre</label>
                                    <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" required />
                                    {errors.nombre && <p className="text-rose-500 text-[10px]">{errors.nombre}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Apellido</label>
                                    <input type="text" value={data.apellido} onChange={e => setData('apellido', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" required />
                                </div>
                                {/* ... después de Nombre y Apellido ... */}

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Zona Asignada</label>
                                    <select
                                        value={data.zona_id}
                                        onChange={e => setData('zona_id', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                                        required
                                    >
                                        <option value="">Seleccione Zona...</option>
                                        <option value="1">Zona 1 - Norte</option>
                                        <option value="2">Zona 2 - Sur</option>
                                        <option value="3">Zona 3 - Centro</option>
                                        <option value="4">Zona 4 - Oriente</option>
                                    </select>
                                    {errors.zona_id && <p className="text-rose-500 text-[10px] mt-1">{errors.zona_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Estado del Visitador</label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setData('estado', 'habilitado')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${data.estado === 'habilitado' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Habilitado
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('estado', 'Inhabilitado')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${data.estado === 'Inhabilitado' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Inhabilitado
                                        </button>
                                    </div>
                                    {errors.estado && <p className="text-rose-500 text-[10px] mt-1">{errors.estado}</p>}
                                </div>

                                {/* IMPORTANTE: Mantener los selectores para tipo_documento, zona y estado como los tenías */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo de Documento</label>
                                    <select value={data.tipo_documento_id} onChange={e => setData('tipo_documento_id', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" required>
                                        <option value="">Seleccione...</option>
                                        {tiposDocumento.map(tipo => (
                                            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Número de Documento</label>
                                    <input type="text" value={data.documento} onChange={e => setData('documento', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" required />
                                    {errors.documento && <p className="text-rose-500 text-[10px]">{errors.documento}</p>}
                                </div>
                            </div>

                            <div className="pt-8 flex gap-4">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cerrar</button>
                                <button type="submit" disabled={processing || (!userName && !isEditing) || (userName && userName.includes('no encontrado'))} className="flex-[2] py-4 bg-[#3D3FD8] text-white rounded-2xl font-bold shadow-xl disabled:bg-slate-200 disabled:shadow-none transition-all">
                                    {processing ? 'Procesando...' : isEditing ? 'Guardar Cambios' : 'Registrar en Sistema'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Eliminación (se mantiene igual) */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[40px] p-8 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Eliminar Registro</h3>
                        <p className="text-slate-500 text-sm mb-8">¿Confirmas que deseas borrar permanentemente a este visitador?</p>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleDelete} className="bg-rose-500 text-white py-4 rounded-2xl font-bold hover:bg-rose-600 transition-all">Confirmar Eliminación</button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 py-2 font-bold hover:text-slate-600">No, cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default Index;