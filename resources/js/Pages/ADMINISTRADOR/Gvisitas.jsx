import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';
import Swal from 'sweetalert2';

const VisitasIndex = ({ visitas = [], medicos = [], visitadores = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedVisita, setSelectedVisita] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: null,
        medico_id: '',
        visitador_id: '',
        fecha_programada: '',
        fecha_realizada: '',
        estado: 'sin programar',
        comentarios: ''
    });

    // --- ALERTA DE ERRORES DE VALIDACIÓN ---
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'ERROR DE VALIDACIÓN',
                text: 'Por favor verifique los campos marcados en rojo.',
                confirmButtonColor: '#3D3FD8',
            });
        }
    }, [errors]);

    // --- LÓGICA DE SINCRONIZACIÓN DE FECHAS ---
    const handleFechaProgramadaChange = (val) => {
        const nuevaFechaProgramada = val;
        let nuevaFechaRealizada = data.fecha_realizada;

        if (val) {
            const fechaSolo = val.split('T')[0];
            if (data.fecha_realizada) {
                const horaActualRealizada = data.fecha_realizada.split('T')[1] || "00:00";
                nuevaFechaRealizada = `${fechaSolo}T${horaActualRealizada}`;
            } else {
                nuevaFechaRealizada = val;
            }
        }

        setData(prev => ({
            ...prev,
            fecha_programada: nuevaFechaProgramada,
            fecha_realizada: nuevaFechaRealizada
        }));
    };

    // --- FILTRADO Y BÚSQUEDA ---
    const medicosFiltradosPorVisitador = useMemo(() => {
        if (!data.visitador_id) return [];
        return medicos.filter(m => String(m.visitador_id) === String(data.visitador_id));
    }, [data.visitador_id, medicos]);

    const filteredVisitas = useMemo(() => {
        return visitas.filter(v => {
            const nombreMedico = medicos.find(m => m.id == v.medico_id)?.nombre || '';
            const nombreVisitador = visitadores.find(vis => vis.id == v.visitador_id)?.nombre || '';
            const search = searchTerm.toLowerCase();
            return (
                nombreMedico.toLowerCase().includes(search) ||
                nombreVisitador.toLowerCase().includes(search) ||
                v.estado.toLowerCase().includes(search)
            );
        });
    }, [searchTerm, visitas, medicos, visitadores]);

    // --- PAGINACIÓN ---
    const totalPages = Math.ceil(filteredVisitas.length / (itemsPerPage || 1));
    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredVisitas.slice(start, start + itemsPerPage);
    }, [filteredVisitas, currentPage, itemsPerPage]);

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

    const getNameById = (list, id) => list.find(item => item.id == id)?.nombre || 'NO ASIGNADO';

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

    const openViewModal = (visita) => {
        setSelectedVisita(visita);
        setIsViewModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gvisitas.update', data.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    Swal.fire({ icon: 'success', title: 'ACTUALIZADO', timer: 1500, showConfirmButton: false });
                }
            });
        } else {
            post(route('Gvisitas.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    Swal.fire({ icon: 'success', title: 'GUARDADO', timer: 1500, showConfirmButton: false });
                }
            });
        }
    };

    const handleConfirmDelete = () => {
        destroy(route('Gvisitas.destroy', data.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                Swal.fire({ icon: 'success', title: 'ELIMINADO', timer: 1500, showConfirmButton: false });
            }
        });
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Visitas" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                {/* BARRA SUPERIOR */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white border-b border-slate-200 px-6 py-4 w-full gap-4">
                    <div className="flex-1 max-w-md w-full">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7-0 11-14 0 7 7-0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="BUSCAR POR MÉDICO, VISITADOR O ESTADO..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-[#3D3FD8] outline-none transition-all"
                            />
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-[#3D3FD8] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                        + Nueva Visita
                    </button>
                </div>

                {/* PAGINACIÓN */}
                <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Mostrar</span>
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
                    <div className="flex items-center gap-4">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 disabled:opacity-20 hover:bg-white rounded-full transition-colors">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg>
                        </button>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Página {currentPage} de {totalPages || 1}</span>
                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 disabled:opacity-20 hover:bg-white rounded-full transition-colors">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" /></svg>
                        </button>
                    </div>
                </div>

                {/* TABLA */}
                <div className="flex-grow w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-400 font-black">
                                <th className="px-6 py-5 tracking-widest">Médico</th>
                                <th className="px-6 py-5 tracking-widest">Visitador</th>
                                <th className="px-6 py-5 tracking-widest">F. Programada</th>
                                <th className="px-6 py-5 tracking-widest">Estado</th>
                                <th className="px-6 py-5 text-center tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentItems.length > 0 ? currentItems.map((v) => (
                                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 font-black text-slate-700 text-[11px] uppercase">{getNameById(medicos, v.medico_id)}</td>
                                    <td className="px-6 py-4 text-slate-500 text-[10px] font-bold uppercase">{getNameById(visitadores, v.visitador_id)}</td>
                                    <td className="px-6 py-4 text-slate-500 text-[10px] font-medium">{v.fecha_programada}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${getEstadoEstilo(v.estado)}`}>
                                            {v.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-1.5">
                                            <button onClick={() => openViewModal(v)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => openEditModal(v)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2.5" /></svg>
                                            </button>
                                            <button onClick={() => { setData('id', v.id); setIsDeleteModalOpen(true); }} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No se encontraron visitas registradas</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-lg rounded-[30px] shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-slate-100">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{isEditing ? 'EDITAR VISITA' : 'NUEVA VISITA'}</h3>
                            <div className="h-1 w-12 bg-[#3D3FD8] mt-1 rounded-full"></div>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Visitador Responsable</label>
                                    <select
                                        value={data.visitador_id}
                                        onChange={e => setData(prev => ({ ...prev, visitador_id: e.target.value, medico_id: '' }))}
                                        className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all ${errors.visitador_id ? 'border-rose-500' : ''}`}
                                        required
                                    >
                                        <option value="">SELECCIONAR...</option>
                                        {visitadores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                                    </select>
                                    {errors.visitador_id && <p className="text-rose-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.visitador_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Médico / Contacto</label>
                                    <select
                                        value={data.medico_id}
                                        onChange={e => {
                                            const nuevoMedicoId = e.target.value;
                                            setData('medico_id', nuevoMedicoId);

                                            // Validación de duplicados: Buscar si ya existe una visita programada para este médico
                                            const medicoYaAsignado = visitas.find(v =>
                                                v.medico_id == nuevoMedicoId &&
                                                v.estado === 'programada' &&
                                                v.id !== data.id // Ignorar si es la misma visita que estamos editando
                                            );

                                            if (medicoYaAsignado) {
                                                Swal.fire({
                                                    icon: 'info',
                                                    title: 'AVISO',
                                                    text: 'ESTE MÉDICO YA TIENE UNA VISITA PROGRAMADA PENDIENTE.',
                                                    confirmButtonColor: '#3D3FD8',
                                                });
                                            }
                                        }}
                                        className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all disabled:opacity-50 ${errors.medico_id ? 'border-rose-500' : ''}`}
                                        required
                                        disabled={!data.visitador_id}
                                    >
                                        <option value="">{data.visitador_id ? 'SELECCIONAR...' : 'ELIJA VISITADOR'}</option>
                                        {medicosFiltradosPorVisitador.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                    {errors.medico_id && <p className="text-rose-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.medico_id}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Fecha Programada</label>
                                    <input
                                        type="datetime-local"
                                        value={data.fecha_programada}
                                        onChange={e => handleFechaProgramadaChange(e.target.value)}
                                        className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all ${errors.fecha_programada ? 'border-rose-500 bg-rose-50' : ''}`}
                                        required
                                    />
                                    {errors.fecha_programada && <p className="text-rose-500 text-[9px] font-black mt-1.5 ml-1 uppercase">{errors.fecha_programada}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Fecha de Cierre</label>
                                    <input
                                        type="datetime-local"
                                        value={data.fecha_realizada}
                                        onChange={e => setData('fecha_realizada', e.target.value)}
                                        className="w-full bg-blue-50/50 border-2 border-blue-100/50 rounded-2xl p-3.5 text-xs font-bold text-blue-700 outline-none focus:border-[#3D3FD8] transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Estado de la Visita</label>
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

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Comentarios y Notas</label>
                                <textarea
                                    value={data.comentarios}
                                    onChange={e => setData('comentarios', e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold h-32 outline-none focus:bg-white focus:border-[#3D3FD8] transition-all"
                                    placeholder="DETALLES DE LA REUNIÓN, MUESTRAS ENTREGADAS, ETC..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-[#3D3FD8] text-white py-4.5 rounded-[20px] font-black text-[11px] uppercase tracking-[0.15em] hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-xl shadow-blue-200 active:scale-95"
                            >
                                {processing ? 'GUARDANDO DATOS...' : 'CONFIRMAR REGISTRO'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >
                                DESCARTAR CAMBIOS
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL VER DETALLE */}
            {isViewModalOpen && selectedVisita && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[30px] shadow-2xl p-8 border border-slate-100">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">DETALLE DE VISITA</h3>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Ficha Informativa</p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getEstadoEstilo(selectedVisita.estado)} shadow-sm`}>
                                {selectedVisita.estado}
                            </span>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Médico</label>
                                    <p className="text-[13px] font-black text-slate-800 uppercase leading-tight">{getNameById(medicos, selectedVisita.medico_id)}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Visitador</label>
                                    <p className="text-[13px] font-black text-slate-800 uppercase leading-tight">{getNameById(visitadores, selectedVisita.visitador_id)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fecha Programada</label>
                                    <p className="text-xs font-bold text-slate-600 italic">{selectedVisita.fecha_programada || 'NO DEFINIDA'}</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fecha de Realización</label>
                                    <p className="text-xs font-bold text-blue-600 italic">{selectedVisita.fecha_realizada || 'SIN REGISTRO FINAL'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50/80 rounded-[20px] p-6 border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest text-center border-b border-slate-200 pb-2">Comentarios del Visitador</label>
                                <p className="text-xs text-slate-600 font-bold leading-relaxed italic text-center">
                                    "{selectedVisita.comentarios || "EL VISITADOR NO HA INGRESADO COMENTARIOS PARA ESTA VISITA."}"
                                </p>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button onClick={() => setIsViewModalOpen(false)} className="w-full bg-slate-800 text-white py-4.5 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl active:scale-95">
                                CERRAR PANEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl border border-rose-50">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black animate-pulse">!</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">¿CONFIRMAR?</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">
                            ESTA ACCIÓN BORRARÁ PERMANENTEMENTE EL HISTORIAL DE ESTA VISITA.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                disabled={processing}
                                onClick={handleConfirmDelete}
                                className="bg-rose-600 text-white w-full py-4.5 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                            >
                                {processing ? 'ELIMINANDO...' : 'SÍ, ELIMINAR AHORA'}
                            </button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors py-2">
                                CANCELAR ACCIÓN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default VisitasIndex;