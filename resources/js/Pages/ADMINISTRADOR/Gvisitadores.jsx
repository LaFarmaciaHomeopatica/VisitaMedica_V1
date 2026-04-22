import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';
import axios from 'axios';

const Index = ({ visitadores = [], tiposDocumento = [] }) => {
    // --- ESTADOS DE UI ---
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userName, setUserName] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // --- ESTADOS DE BÚSQUEDA Y PAGINACIÓN ---
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

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

    // Búsqueda dinámica de usuario
    useEffect(() => {
        const buscarUsuario = async () => {
            if (data.usuario_id && !isEditing) {
                setIsSearching(true);
                try {
                    const response = await axios.get(`/usuarios/buscar/${data.usuario_id}`);
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

    // Lógica de filtrado
    const filteredVisitadores = visitadores.filter(v =>
        `${v.nombre} ${v.apellido} ${v.documento}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredVisitadores.slice(indexOfFirstItem, indexOfLastItem);

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
            usuario_id: v.usuario_id || '',
            nombre: v.nombre || '',
            apellido: v.apellido || '',
            documento: v.documento || '',
            tipo_documento_id: v.tipo_documento_id || '',
            zona_id: v.zona_id || '',
            estado: v.estado || 'habilitado'
        });
        setUserName(v.user ? `Vinculado a: ${v.user.username || v.user.nombre}` : 'Usuario vinculado');
        setIsFormModalOpen(true);
    };

    // --- MANEJADORES DE CRUD ---

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            // Se pasa el ID como segundo parámetro para llenar {visitador} en la ruta PUT
            put(route('Gvisitadores.update', { visitador: data.id }), {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    reset();
                }
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
        // Se pasa el ID como parámetro para la ruta DELETE /Gvisitadores/{visitador}
        destroy(route('Gvisitadores.destroy', { visitador: data.id }), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                reset();
            }
        });
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Visitadores" />

            <div className="w-full min-h-screen flex flex-col bg-white">
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
                                placeholder="BUSCAR POR NOMBRE O DOCUMENTO..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button onClick={openCreateModal} className="bg-[#3D3FD8] text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all">
                        + Nuevo Visitador
                    </button>
                </div>

                <div className="flex-grow w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider">Visitador</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider">Zona</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentItems.map((v) => (
                                <tr key={v.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase">{v.nombre} {v.apellido}</span>
                                            <span className="text-[9px] text-blue-500 font-bold uppercase">{v.user ? `@${v.user.username}` : 'Sin usuario'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-[10px] font-medium text-slate-500">
                                        {v.documento} ({v.tipo_documento?.nombre || 'N/A'})
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="text-[9px] font-black px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase">
                                            {v.zona_id ? `Zona ${v.zona_id}` : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-[9px] font-black uppercase ${v.estado === 'habilitado' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {v.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => openEditModal(v)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => { setData('id', v.id); setIsDeleteModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORMULARIO */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8">
                        <form onSubmit={handleSubmit}>
                            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase">
                                {isEditing ? 'Actualizar Visitador' : 'Nuevo Visitador'}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-blue-500 uppercase mb-2">ID Usuario Sistema *</label>
                                    <div className="relative">
                                        <input type="number" value={data.usuario_id} onChange={e => setData('usuario_id', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" disabled={isEditing} required />
                                        {isSearching && <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
                                    </div>
                                    <div className="mt-2 text-[10px] font-bold uppercase">
                                        <span className={userName.includes('no encontrado') ? 'text-rose-500' : 'text-blue-700'}>{userName || "Esperando ID..."}</span>
                                    </div>
                                    {errors.usuario_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.usuario_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Zona Asignada</label>
                                    <select value={data.zona_id} onChange={e => setData('zona_id', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" required>
                                        <option value="">Seleccione...</option>
                                        <option value="1">Zona 1 - Norte</option>
                                        <option value="2">Zona 2 - Sur</option>
                                        <option value="3">Zona 3 - Centro</option>
                                    </select>
                                    {errors.zona_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.zona_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nombre</label>
                                    <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm uppercase" required />
                                    {errors.nombre && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.nombre}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Apellido</label>
                                    <input type="text" value={data.apellido} onChange={e => setData('apellido', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm uppercase" required />
                                    {errors.apellido && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.apellido}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo de Documento</label>
                                    <select value={data.tipo_documento_id} onChange={e => setData('tipo_documento_id', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" required>
                                        <option value="">Seleccione...</option>
                                        {tiposDocumento.map(tipo => (<option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>))}
                                    </select>
                                    {errors.tipo_documento_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.tipo_documento_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Número Documento</label>
                                    <input type="text" value={data.documento} onChange={e => setData('documento', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm" required />
                                    {errors.documento && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.documento}</p>}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={processing || (!isEditing && (!userName || userName.includes('no encontrado')))}
                                    className="flex-[2] py-4 bg-[#3D3FD8] text-white rounded-2xl font-black text-[11px] uppercase shadow-lg hover:bg-blue-700 disabled:bg-slate-200 transition-all"
                                >
                                    {processing ? 'GUARDANDO...' : isEditing ? 'CONFIRMAR CAMBIOS' : 'REGISTRAR VISITADOR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">!</div>
                        <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">¿Eliminar Registro?</h3>
                        <div className="flex flex-col gap-2 mt-6">
                            <button onClick={handleDelete} className="bg-rose-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase hover:bg-rose-700 transition-all">Eliminar Ahora</button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 py-2 text-[10px] font-black uppercase">Regresar</button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default Index;