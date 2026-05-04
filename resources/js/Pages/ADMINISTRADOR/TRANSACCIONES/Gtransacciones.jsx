import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import PanelAdmin from "../PanelAdmin";
import {
    FaPlus, FaPencil, FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaTrashCan,
    FaCloudArrowUp, FaFileExcel, FaXmark, FaSliders, FaGear
} from 'react-icons/fa6';

const Gtransacciones = ({ auth, transacciones = [], medicos = [], productos = [], errors: serverErrors }) => {
    // --- ESTADOS DE UI ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const fileInputRef = useRef(null);

    // --- BÚSQUEDA Y PAGINACIÓN ---
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    // CORRECCIÓN: Se agrega setItemsPerPage al estado
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- FORMULARIO ---
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: null,
        medico_documento: '',
        producto_codigo: '',
        unidades_compradas: 0,
        unidades_formuladas: 0,
        valor_comprado: 0,
        valor_formulado: 0,
        semana: '',
    });
    // --- NUEVO: ESTADO PARA VISIBILIDAD DE COLUMNAS ---
    const [showColumnFilter, setShowColumnFilter] = useState(false);
    const columnFilterRef = useRef(null);
    const [visibleColumns, setVisibleColumns] = useState({
        semana: true,
        documento: false,
        medico: true,
        codigoProducto: false,
        producto: true,
        compras: true,
        formulaciones: true,
        valorComprado: false,
        valorFormulado: false,
    });

    // --- FILTRADO ---
    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return transacciones.filter(t =>
            t.medico?.nombre?.toLowerCase().includes(term) ||
            t.medico_documento?.toString().includes(term) ||
            t.producto?.nombre?.toLowerCase().includes(term) ||
            t.semana?.toString().includes(term)
        );
    }, [transacciones, searchTerm]);

    // --- LÓGICA DE PAGINACIÓN ---
    const totalPages = useMemo(() => {
        return Math.ceil(filteredItems.length / (itemsPerPage || 1));
    }, [filteredItems.length, itemsPerPage]);

    const currentItems = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage;
        const firstIndex = lastIndex - itemsPerPage;
        return filteredItems.slice(firstIndex, lastIndex);
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
        const action = isEditing
            ? put(route('Gtransacciones.update', { transaccion: data.id }))
            : post(route('Gtransacciones.store'));

        action.then(() => {
            setIsModalOpen(false);
            reset();
        });
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

    // CORRECCIÓN: Selección solo de los ítems visibles en la página actual
    const toggleSelectAll = () => {
        if (currentItems.length > 0 && selectedIds.length === currentItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentItems.map(t => t.id));
        }
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        router.post(route('Gtransacciones.importar'), {
            archivo: file
        }, {
            forceFormData: true,
            onSuccess: () => {
                fileInputRef.current.value = '';
            },
        });
    };




    // Cerrar el desplegable al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (columnFilterRef.current && !columnFilterRef.current.contains(event.target)) {
                setShowColumnFilter(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Gestión de Transacciones" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                {/* BARRA SUPERIOR */}
                <div className="flex flex-col xl:flex-row items-center justify-between border-b border-slate-200 px-6 py-6 gap-4">
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

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImportExcel}
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                        />

                        <button
                            disabled={selectedIds.length === 0}
                            onClick={() => setIsDeleteModalOpen(true)}
                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all ${selectedIds.length > 0 ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                        >
                            <FaTrashCan className="inline mr-2" /> ELIMINAR {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </button>

                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="bg-amber-50 text-amber-600 border border-amber-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2"
                        >
                            Importar
                        </button>

                        <a
                            href={route('Gtransacciones.exportar')}
                            className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                        >
                            <FaFileExcel className="w-3.5 h-3.5" /> Exportar
                        </a>

                        <button onClick={openCreateModal} className="bg-[#3D3FD8] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                            <FaPlus className="w-3 h-3" /> Nueva Transacción
                        </button>
                    </div>
                </div>

                {/* SUB-BARRA: MOSTRAR X ÍTEMS Y PAGINACIÓN */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                            <input
                                type="checkbox"
                                onChange={toggleSelectAll}
                                checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Todo</span>
                        </div>
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
                    </div>


                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 disabled:opacity-30 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <FaChevronLeft className="w-3 h-3 text-slate-600" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">
                            {currentPage} de {totalPages || 1}
                        </span>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 disabled:opacity-30 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <FaChevronRight className="w-3 h-3 text-slate-600" />
                        </button>
                    </div>

                    <div className="relative" ref={columnFilterRef}>
                        <button
                            onClick={() => setShowColumnFilter(!showColumnFilter)}
                            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                        >
                            <FaGear className={`w-3 h-3 transition-transform ${showColumnFilter ? 'rotate-90' : ''}`} />
                            Columnas
                        </button>

                        {showColumnFilter && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase px-2 mb-1">Ver/Ocultar Campos</span>
                                {Object.keys(visibleColumns).map((col) => (
                                    <label key={col} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns[col]}
                                            onChange={() => toggleColumn(col)}
                                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8]"
                                        />
                                        <span className={`text-[10px] font-bold uppercase ${visibleColumns[col] ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {col.replace(/([A-Z])/g, ' $1')}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>




                </div>

                {/* TABLA */}
                <div className="flex-grow overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-center w-16">
                                    <input type="checkbox" onChange={toggleSelectAll} checked={currentItems.length > 0 && selectedIds.length === currentItems.length} className="w-4 h-4 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8]" />
                                </th>
                                {visibleColumns.semana && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Semana</th>}
                                {visibleColumns.documento && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Documento</th>}
                                {visibleColumns.medico && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Médico</th>}
                                {visibleColumns.codigoProducto && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cód. Prod</th>}
                                {visibleColumns.producto && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Producto</th>}
                                {visibleColumns.compras && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Un. Compradas</th>}
                                {visibleColumns.formulaciones && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Un. Formuladas</th>}
                                {visibleColumns.valorComprado && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Val. Comprado</th>}
                                {visibleColumns.valorFormulado && <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Val. Formulado</th>}
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentItems.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                                    {/* 1. Checkbox: de py-4 a py-2 */}
                                    <td className="px-6 py-2 text-center">
                                        <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])} className="w-4 h-4 rounded border-slate-300 text-[#3D3FD8] focus:ring-[#3D3FD8]" />
                                    </td>

                                    {/* 2. Columnas de datos: Todas con py-2 */}
                                    {visibleColumns.semana && <td className="px-6 py-2"><span className="text-[10px] font-black text-[#3D3FD8] bg-blue-50 px-3 py-1 rounded-lg">SEM {t.semana}</span></td>}
                                    {visibleColumns.documento && <td className="px-6 py-2 text-[10px] font-bold text-slate-500">{t.medico_documento}</td>}
                                    {visibleColumns.medico && <td className="px-6 py-2 text-[10px] font-black text-slate-700 uppercase">{t.medico ? `${t.medico.nombre} ${t.medico.apellido}` : '---'}</td>}
                                    {visibleColumns.codigoProducto && <td className="px-6 py-2 text-[10px] font-bold text-slate-500">{t.producto_codigo}</td>}
                                    {visibleColumns.producto && <td className="px-6 py-2 text-[10px] font-black text-slate-700 uppercase">{t.producto?.nombre || '---'}</td>}
                                    {visibleColumns.compras && <td className="px-6 py-2 text-[10px] font-black text-slate-700">{t.unidades_compradas}</td>}
                                    {visibleColumns.formulaciones && <td className="px-6 py-2 text-[10px] font-black text-slate-700">{t.unidades_formuladas}</td>}
                                    {visibleColumns.valorComprado && <td className="px-6 py-2 text-[10px] font-black text-emerald-600">${Number(t.valor_comprado).toLocaleString()}</td>}
                                    {visibleColumns.valorFormulado && <td className="px-6 py-2 text-[10px] font-black text-purple-600">${Number(t.valor_formulado).toLocaleString()}</td>}

                                    {/* 3. Acciones: de py-4 a py-2 y botón más pequeño (p-2) */}
                                    <td className="px-6 py-2 text-center">
                                        <button onClick={() => openEditModal(t)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all transform hover:scale-110">
                                            <FaPencil className="w-3 h-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR/EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
                                {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <FaXmark className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Médico</label>
                                <select
                                    value={data.medico_documento}
                                    onChange={e => setData('medico_documento', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/10"
                                >
                                    <option value="">Seleccionar Médico</option>
                                    {medicos.map(m => (
                                        <option key={m.documento} value={m.documento}>{m.nombre} {m.apellido}</option>
                                    ))}
                                </select>
                                {errors.medico_documento && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.medico_documento}</p>}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Producto</label>
                                <select
                                    value={data.producto_codigo}
                                    onChange={e => setData('producto_codigo', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/10"
                                >
                                    <option value="">Seleccionar Producto</option>
                                    {productos.map(p => (
                                        <option key={p.codigo} value={p.codigo}>{p.nombre}</option>
                                    ))}
                                </select>
                                {errors.producto_codigo && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.producto_codigo}</p>}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Unidades Compradas</label>
                                <input
                                    type="number"
                                    value={data.unidades_compradas}
                                    onChange={e => setData('unidades_compradas', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Valor Comprado</label>
                                <input
                                    type="number"
                                    value={data.valor_comprado}
                                    onChange={e => setData('valor_comprado', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Semana (1-53)</label>
                                <input
                                    type="number"
                                    value={data.semana}
                                    onChange={e => setData('semana', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                                />
                                {errors.semana && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.semana}</p>}
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all">Cancelar</button>
                                <button disabled={processing} type="submit" className="bg-[#3D3FD8] text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                                    {processing ? 'Guardando...' : 'Confirmar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center border border-slate-100">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaTrashCan className="w-8 h-8" />
                        </div>
                        <h3 className="text-[14px] font-black text-slate-800 uppercase mb-2">¿Confirmar Eliminación?</h3>
                        <p className="text-slate-400 text-[11px] font-medium mb-8 leading-relaxed">
                            Estás a punto de eliminar {selectedIds.length} registros. Esta acción es irreversible y afectará los reportes estadísticos.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all">Cancelar</button>
                            <button onClick={handleConfirmDelete} className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100 transition-all">Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default Gtransacciones;