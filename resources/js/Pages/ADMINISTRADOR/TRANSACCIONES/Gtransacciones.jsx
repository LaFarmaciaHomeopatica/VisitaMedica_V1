import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import PanelAdmin from "../PanelAdmin";
import {
    FaPlus, FaPencil, FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaTrashCan
} from 'react-icons/fa6';

const Gtransacciones = ({ auth, transacciones = [], medicos = [], productos = [] }) => {
    // --- ESTADOS DE UI ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // --- BÚSQUEDA Y PAGINACIÓN ---
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // --- FORMULARIO ---
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: null,
        medico_documento: '', // Cambiado de medico_id
        producto_codigo: '',   // Cambiado de producto_id
        unidades_compradas: 0,
        unidades_formuladas: 0,
        valor_comprado: 0,
        valor_formulado: 0,
        semana: '',
    });

    // --- FILTRADO ---
    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return transacciones.filter(t =>
            t.medico?.nombre?.toLowerCase().includes(term) ||
            t.medico_documento?.toString().includes(term) || // Buscable por documento
            t.producto?.nombre?.toLowerCase().includes(term) ||
            t.semana?.toString().includes(term)
        );
    }, [transacciones, searchTerm]);

    // --- PAGINACIÓN ---
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage;
        return filteredItems.slice(lastIndex - itemsPerPage, lastIndex);
    }, [filteredItems, currentPage, itemsPerPage]);

    // --- ACCIONES ---
    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (t) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: t.id,
            medico_documento: t.medico_documento || '',
            producto_codigo: t.producto_codigo || '',
            unidades_compradas: t.unidades_compradas || 0,
            unidades_formuladas: t.unidades_formuladas || 0,
            valor_comprado: t.valor_comprado || 0,
            valor_formulado: t.valor_formulado || 0,
            semana: t.semana || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gtransacciones.update', { transaccion: data.id }), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
                preserveScroll: true
            });
        } else {
            post(route('Gtransacciones.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
                preserveScroll: true
            });
        }
    };

    const handleConfirmDelete = () => {
        if (selectedIds.length === 0) return;
        router.delete(route('Gtransacciones.destroy_multiple'), {
            data: { ids: selectedIds },
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedIds([]);
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === currentItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentItems.map(t => t.id));
        }
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Gestión de Transacciones" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                {/* BARRA SUPERIOR */}
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 px-6 py-6 gap-4">
                    <div className="flex-1 max-w-md w-full relative">
                        <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="BUSCAR MÉDICO, PRODUCTO O SEMANA..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#3D3FD8]/20 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            disabled={selectedIds.length === 0}
                            onClick={() => setIsDeleteModalOpen(true)}
                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all ${selectedIds.length > 0 ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                        >
                            ELIMINAR {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </button>

                        <button onClick={openCreateModal} className="bg-[#3D3FD8] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                            <FaPlus className="w-3 h-3" /> Nueva Transacción
                        </button>
                    </div>
                </div>

                {/* TABLA */}
                <div className="flex-grow overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-center w-16">
                                    <input
                                        type="checkbox"
                                        onChange={toggleSelectAll}
                                        checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                                        className="w-4 h-4 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8]"
                                    />
                                </th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Semana</th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Médico</th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Producto</th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Compras</th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Formulaciones</th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentItems.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(t.id)}
                                            onChange={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}
                                            className="w-4 h-4 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8]"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-[#3D3FD8] bg-blue-50 px-3 py-1.5 rounded-lg">SEM {t.semana}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1">{t.medico?.nombre || 'SIN MÉDICO'}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">DOC: {t.medico_documento || '---'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-700 uppercase leading-none mb-1">{t.producto?.nombre || 'SIN PRODUCTO'}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">CÓD: {t.producto_codigo || '---'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[11px] font-black text-slate-700">{t.unidades_compradas} U.</div>
                                        <div className="text-[9px] text-emerald-600 font-black tracking-tight">${Number(t.valor_comprado).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[11px] font-black text-slate-700">{t.unidades_formuladas} U.</div>
                                        <div className="text-[9px] text-purple-600 font-black tracking-tight">${Number(t.valor_formulado).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => openEditModal(t)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-[#3D3FD8] hover:text-white transition-all transform hover:scale-110">
                                            <FaPencil className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                <div className="px-6 py-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Página {currentPage} de {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-3 bg-slate-50 border border-slate-100 rounded-xl disabled:opacity-30 hover:bg-white transition-all"
                        >
                            <FaChevronLeft className="w-3 h-3 text-slate-600" />
                        </button>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-3 bg-slate-50 border border-slate-100 rounded-xl disabled:opacity-30 hover:bg-white transition-all"
                        >
                            <FaChevronRight className="w-3 h-3 text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                                    {isEditing ? 'Editar Registro' : 'Nueva Transacción'}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Complete los datos de la operación</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Seleccionar Médico</label>
                                <select
                                    value={data.medico_documento}
                                    onChange={e => setData('medico_documento', e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-[11px] font-black text-slate-600 focus:ring-2 focus:ring-[#3D3FD8]/20 uppercase"
                                >
                                    <option value="">ELIJA UN MÉDICO...</option>
                                    {medicos.map(m => (
                                        <option key={m.documento} value={m.documento}>
                                            {m.nombre.toUpperCase()} ({m.documento})
                                        </option>
                                    ))}
                                </select>
                                {errors.medico_documento && <div className="text-red-500 text-[9px] font-black mt-2 ml-2 uppercase italic">{errors.medico_documento}</div>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Seleccionar Producto</label>
                                <select
                                    value={data.producto_codigo}
                                    onChange={e => setData('producto_codigo', e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-[11px] font-black text-slate-600 focus:ring-2 focus:ring-[#3D3FD8]/20 uppercase"
                                >
                                    <option value="">ELIJA UN PRODUCTO...</option>
                                    {productos.map(p => (
                                        <option key={p.codigo} value={p.codigo}>
                                            {p.nombre.toUpperCase()} ({p.codigo})
                                        </option>
                                    ))}
                                </select>
                                {errors.producto_codigo && <div className="text-red-500 text-[9px] font-black mt-2 ml-2 uppercase italic">{errors.producto_codigo}</div>}
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Unidades Compradas</label>
                                <input type="number" value={data.unidades_compradas} onChange={e => setData('unidades_compradas', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-[11px] font-black text-slate-600 focus:ring-2 focus:ring-[#3D3FD8]/20" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Unidades Formuladas</label>
                                <input type="number" value={data.unidades_formuladas} onChange={e => setData('unidades_formuladas', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-[11px] font-black text-slate-600 focus:ring-2 focus:ring-[#3D3FD8]/20" />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Valor Comprado ($)</label>
                                <input type="number" step="0.01" value={data.valor_comprado} onChange={e => setData('valor_comprado', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-[11px] font-black text-emerald-600 focus:ring-2 focus:ring-[#3D3FD8]/20" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Valor Formulado ($)</label>
                                <input type="number" step="0.01" value={data.valor_formulado} onChange={e => setData('valor_formulado', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-[11px] font-black text-purple-600 focus:ring-2 focus:ring-[#3D3FD8]/20" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Semana del año</label>
                                <input type="number" min="1" max="53" value={data.semana} onChange={e => setData('semana', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-[11px] font-black text-slate-600 focus:ring-2 focus:ring-[#3D3FD8]/20" required />
                                {errors.semana && <div className="text-red-500 text-[9px] font-black mt-2 ml-2 uppercase italic">{errors.semana}</div>}
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col gap-4">
                            <button type="submit" disabled={processing} className="w-full bg-[#3D3FD8] text-white py-5 rounded-[20px] font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-95">
                                {processing ? 'GUARDANDO CAMBIOS...' : 'CONFIRMAR TRANSACCIÓN'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar y salir</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL DE ELIMINACIÓN */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white p-10 rounded-[40px] max-w-sm w-full text-center shadow-2xl">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaTrashCan className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 uppercase mb-3 tracking-tighter">¿Borrar registros?</h4>
                        <p className="text-slate-500 text-[11px] font-bold uppercase mb-8 leading-relaxed tracking-tight">
                            VAS A ELIMINAR <span className="text-rose-600">{selectedIds.length}</span> ELEMENTOS. ESTA ACCIÓN ES IRREVERSIBLE.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleConfirmDelete} className="bg-rose-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">Eliminar definitivamente</button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">Mejor no</button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default Gtransacciones;