import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';

const VisitasIndex = ({ visitas = [], medicos = [], visitadores = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: null,
        medico_id: '',
        visitador_id: '',
        fecha_programada: '',
        fecha_realizada: '',
        estado: 'sin programar',
        comentarios: ''
    });

    // --- LÓGICA DE FILTRADO DINÁMICO (MÉDICOS POR VISITADOR) ---
    const medicosFiltradosPorVisitador = useMemo(() => {
        if (!data.visitador_id) return [];
        // Filtramos la lista global de medicos por el visitador_id seleccionado en el form
        return medicos.filter(m => m.visitador_id == data.visitador_id);
    }, [data.visitador_id, medicos]);

    // --- LÓGICA DE FILTRADO DE TABLA ---
    const filteredVisitas = visitas.filter(v => {
        const nombreMedico = medicos.find(m => m.id == v.medico_id)?.nombre || '';
        const search = searchTerm.toLowerCase();
        return (
            nombreMedico.toLowerCase().includes(search) ||
            v.estado.toLowerCase().includes(search)
        );
    });

    const totalPages = Math.ceil(filteredVisitas.length / (itemsPerPage || 1));
    const currentItems = filteredVisitas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // --- HELPERS ---
    const getEstadoEstilo = (estado) => {
        const estilos = {
            'sin programar': 'bg-slate-100 text-slate-600',
            'programada': 'bg-blue-100 text-blue-700',
            'efectiva': 'bg-emerald-100 text-emerald-700',
            'No contactado': 'bg-amber-100 text-amber-700',
            'reprogramada': 'bg-purple-100 text-purple-700',
            'cancelada': 'bg-rose-100 text-rose-700',
        };
        return estilos[estado] || 'bg-gray-100 text-gray-600';
    };

    const getNameById = (list, id) => list.find(item => item.id == id)?.nombre || 'No asignado';

    // --- ACCIONES ---
    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (visita) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: visita.id,
            medico_id: visita.medico_id,
            visitador_id: visita.visitador_id,
            fecha_programada: visita.fecha_programada ? visita.fecha_programada.replace(' ', 'T').substring(0, 16) : '',
            fecha_realizada: visita.fecha_realizada ? visita.fecha_realizada.replace(' ', 'T').substring(0, 16) : '',
            estado: visita.estado,
            comentarios: visita.comentarios || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gvisitas.update', data.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('Gvisitas.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleConfirmDelete = () => {
        destroy(route('Gvisitas.destroy', data.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Visitas" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                {/* BARRA SUPERIOR */}
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
                                placeholder="BUSCAR POR MÉDICO O ESTADO..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-[#3D3FD8] text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all"
                    >
                        + Nueva Visita
                    </button>
                </div>

                {/* PAGINACIÓN */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
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
                    </div>
                    <div className="flex items-center gap-1">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" /></svg>
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Página {currentPage} de {totalPages || 1}</span>
                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" /></svg>
                        </button>
                    </div>
                </div>

                {/* TABLA */}
                <div className="flex-grow w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold">
                                <th className="px-6 py-4">Médico</th>
                                <th className="px-6 py-4">Visitador</th>
                                <th className="px-6 py-4">F. Programada</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentItems.length > 0 ? currentItems.map((v) => (
                                <tr key={v.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-3 font-bold text-slate-700 text-[11px] uppercase">{getNameById(medicos, v.medico_id)}</td>
                                    <td className="px-6 py-3 text-slate-500 text-[10px] font-bold">{getNameById(visitadores, v.visitador_id)}</td>
                                    <td className="px-6 py-3 text-slate-500 text-[10px]">{v.fecha_programada}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${getEstadoEstilo(v.estado)}`}>
                                            {v.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => openEditModal(v)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" /></svg>
                                            </button>
                                            <button onClick={() => { setData('id', v.id); setIsDeleteModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-[10px] font-bold text-slate-400 uppercase italic">No hay visitas registradas</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-lg rounded-[30px] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-black text-slate-800 mb-6">{isEditing ? 'Editar Visita' : 'Nueva Visita'}</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Visitador</label>
                                    <select
                                        value={data.visitador_id}
                                        onChange={e => {
                                            setData({
                                                ...data,
                                                visitador_id: e.target.value,
                                                medico_id: '' // Limpiamos médico al cambiar visitador
                                            });
                                        }}
                                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold"
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {visitadores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                                    </select>
                                    {errors.visitador_id && <div className="text-rose-500 text-[9px] mt-1 font-bold">{errors.visitador_id}</div>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Médico</label>
                                    <select
                                        value={data.medico_id}
                                        onChange={e => setData('medico_id', e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold"
                                        required
                                        disabled={!data.visitador_id}
                                    >
                                        <option value="">{data.visitador_id ? 'Seleccionar...' : 'Elija Visitador primero'}</option>
                                        {medicosFiltradosPorVisitador.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                    {errors.medico_id && <div className="text-rose-500 text-[9px] mt-1 font-bold">{errors.medico_id}</div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">F. Programada</label>
                                    <input type="datetime-local" value={data.fecha_programada} onChange={e => setData('fecha_programada', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold" required />
                                    {errors.fecha_programada && <div className="text-rose-500 text-[9px] mt-1 font-bold">{errors.fecha_programada}</div>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">F. Realizada</label>
                                    <input type="datetime-local" value={data.fecha_realizada} onChange={e => setData('fecha_realizada', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold" />
                                    {errors.fecha_realizada && <div className="text-rose-500 text-[9px] mt-1 font-bold">{errors.fecha_realizada}</div>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Estado</label>
                                <select value={data.estado} onChange={e => setData('estado', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold">
                                    <option value="sin programar">SIN PROGRAMAR</option>
                                    <option value="programada">PROGRAMADA</option>
                                    <option value="efectiva">EFECTIVA</option>
                                    <option value="No contactado">NO CONTACTADO</option>
                                    <option value="reprogramada">REPROGRAMADA</option>
                                    <option value="cancelada">CANCELADA</option>
                                </select>
                                {errors.estado && <div className="text-rose-500 text-[9px] mt-1 font-bold">{errors.estado}</div>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Comentarios</label>
                                <textarea value={data.comentarios} onChange={e => setData('comentarios', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold h-24" placeholder="Notas de la visita..."></textarea>
                                {errors.comentarios && <div className="text-rose-500 text-[9px] font-bold">{errors.comentarios}</div>}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col gap-2">
                            <button type="submit" disabled={processing} className="w-full bg-[#3D3FD8] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-blue-700 disabled:bg-slate-400 transition-all">
                                {processing ? 'PROCESANDO...' : 'GUARDAR VISITA'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="py-2 text-[10px] font-black text-slate-400 uppercase">CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[35px] p-10 text-center">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">!</div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar Registro?</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase mb-6">Esta acción borrará el historial de la visita.</p>
                        <button disabled={processing} onClick={handleConfirmDelete} className="bg-rose-600 text-white w-full py-4 rounded-2xl font-black text-[11px] uppercase mb-2 hover:bg-rose-700 transition-all">
                            {processing ? 'ELIMINANDO...' : 'ELIMINAR AHORA'}
                        </button>
                        <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 text-[10px] font-black uppercase">REGRESAR</button>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default VisitasIndex;