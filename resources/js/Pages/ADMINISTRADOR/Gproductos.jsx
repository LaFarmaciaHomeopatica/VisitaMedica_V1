import React, { useState, useRef, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';
import * as XLSX from 'xlsx';

const Gproductos = ({ productos = [] }) => {
    // --- ESTADOS DE UI ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);

    // --- ESTADOS PARA IMPORTACIÓN Y DUPLICADOS ---
    const [previewData, setPreviewData] = useState([]);
    const [duplicatesFound, setDuplicatesFound] = useState([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

    // --- ESTADOS DE SELECCIÓN ---
    const [selectedIds, setSelectedIds] = useState([]);

    // --- ESTADOS DE BÚSQUEDA Y PAGINACIÓN ---
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: null,
        nombre: '',
        laboratorio: '',
        codigo: '',
    });

    // --- LÓGICA DE FILTRADO ---
    const filteredProductos = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return productos.filter(p =>
            p.nombre?.toLowerCase().includes(term) ||
            p.laboratorio?.toLowerCase().includes(term) ||
            p.codigo?.toLowerCase().includes(term)
        );
    }, [productos, searchTerm]);

    // --- LÓGICA DE PAGINACIÓN ---
    const totalPages = Math.ceil(filteredProductos.length / (itemsPerPage || 1));
    const currentItems = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredProductos.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredProductos, currentPage, itemsPerPage]);

    // --- LÓGICA DE SELECCIÓN ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const idsOnPage = currentItems.map(p => p.id);
            setSelectedIds(idsOnPage);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // --- ACCIONES DE FORMULARIO ---
    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (prod) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: prod.id,
            nombre: prod.nombre,
            laboratorio: prod.laboratorio || '',
            codigo: prod.codigo,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gproductos.update', { producto: data.id }), {
                onSuccess: () => setIsModalOpen(false),
                preserveScroll: true
            });
        } else {
            post(route('Gproductos.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                preserveScroll: true
            });
        }
    };

    // --- LÓGICA DE IMPORTACIÓN ---
    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const dataExcel = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);

            const dups = dataExcel.filter(row => {
                const codExcel = row.codigo?.toString().trim();
                return productos.some(p => p.codigo?.toString().trim() === codExcel);
            });

            setPreviewData(dataExcel);
            setDuplicatesFound(dups);
            setIsPreviewModalOpen(true);
        };
        reader.readAsBinaryString(file);
    };

    // Al hacer click en "Cargar" o "Revisar Duplicados"
    const handleProcessImport = () => {
        if (duplicatesFound.length > 0) {
            setIsPreviewModalOpen(false);
            setIsWarningModalOpen(true);
        } else {
            executeServerImport(false); // Importación normal sin sobreescribir
        }
    };

    const executeServerImport = (sobreescribir = false) => {
        router.post(route('productos.import'), {
            data: previewData,
            sobreescribir: sobreescribir // Enviamos al controlador si debe pisar datos o no
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsPreviewModalOpen(false);
                setIsWarningModalOpen(false);
                setPreviewData([]);
                setDuplicatesFound([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            onError: () => {
                alert("Error al importar los productos.");
            }
        });
    };

    const handleConfirmDelete = () => {
        if (selectedIds.length === 0) return;
        router.post(route('Gproductos.destroy'), {
            ids: selectedIds
        }, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedIds([]);
            },
            preserveScroll: true
        });
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Productos" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                {/* BARRA SUPERIOR */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white border-b border-slate-200 px-6 py-4 gap-4">
                    <div className="flex-1 max-w-md w-full">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7-0 11-14 0 7 7-0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="BUSCAR POR NOMBRE, CÓDIGO O LAB..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />

                        <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg font-bold text-[10px] uppercase hover:bg-amber-600 hover:text-white transition-all">
                            Importar
                        </button>

                        <a href={route('productos.export')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg font-bold text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all">
                            Exportar
                        </a>

                        <button
                            disabled={selectedIds.length === 0}
                            onClick={() => setIsDeleteModalOpen(true)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[10px] uppercase transition-all border ${selectedIds.length > 0 ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}`}
                        >
                            ELIMINAR {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </button>

                        <button onClick={openCreateModal} className="bg-[#3D3FD8] text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all">
                            + Nuevo Producto
                        </button>
                    </div>
                </div>

                {/* PAGINACIÓN */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                            <input type="checkbox" onChange={handleSelectAll} checked={currentItems.length > 0 && selectedIds.length === currentItems.length} className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Todo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar</span>
                            <input type="number" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1" />
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                        <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">{currentPage} de {totalPages || 1}</span>
                        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                </div>

                {/* TABLA */}
                <div className="flex-grow overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase text-center w-16">Sel.</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase">Código</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase">Nombre del Producto</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase">Laboratorio</th>
                                <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentItems.map((p) => (
                                <tr key={p.id} className={`hover:bg-blue-50/30 transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-3 text-center">
                                        <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => handleSelectOne(p.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                                    </td>
                                    <td className="px-6 py-3"><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">{p.codigo}</span></td>
                                    <td className="px-6 py-3 text-[11px] font-bold text-slate-700 uppercase">{p.nombre}</td>
                                    <td className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase italic">{p.laboratorio || 'N/A'}</td>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => openEditModal(p)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-10">
                        <h3 className="text-2xl font-black text-slate-800 mb-8">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Código</label>
                                <input type="text" value={data.codigo} onChange={e => setData('codigo', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre</label>
                                <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Laboratorio</label>
                                <input type="text" value={data.laboratorio} onChange={e => setData('laboratorio', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                        </div>
                        <div className="mt-10 flex flex-col gap-3">
                            <button type="submit" disabled={processing} className="w-full bg-[#3D3FD8] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">
                                {processing ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase">Cerrar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL PREVISUALIZACIÓN */}
            {isPreviewModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsPreviewModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-[90vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-white">
                            <h3 className="text-lg font-black text-slate-800 uppercase">Previsualización ({previewData.length} ítems)</h3>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <table className="w-full text-[10px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 uppercase">
                                        {previewData.length > 0 && Object.keys(previewData[0]).map(key => (
                                            <th key={key} className="px-4 py-2 font-bold text-slate-600 border border-slate-200">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, i) => {
                                        const codExcel = row.codigo?.toString().trim();
                                        const esDuplicado = productos.some(p => p.codigo?.toString().trim() === codExcel);
                                        return (
                                            <tr key={i} className={esDuplicado ? 'bg-red-50' : ''}>
                                                {Object.values(row).map((val, j) => (
                                                    <td key={j} className={`px-4 py-2 border border-slate-100 ${esDuplicado ? 'text-red-700 font-bold' : 'text-slate-600'}`}>
                                                        {val || '---'}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-50 flex gap-3 border-t">
                            <button onClick={() => setIsPreviewModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold text-xs uppercase">Cancelar</button>
                            <button onClick={handleProcessImport} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase text-white shadow-lg transition-all ${duplicatesFound.length > 0 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                                {duplicatesFound.length > 0 ? `Detectados ${duplicatesFound.length} duplicados - Revisar` : `Confirmar Importación`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ADVERTENCIA DUPLICADOS */}
            {isWarningModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-red-900/40 backdrop-blur-md"></div>
                    <div className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-10 text-center">
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">!</div>
                        <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">Sobreescribir Datos</h3>
                        <p className="text-slate-500 text-[10px] mb-8 font-bold uppercase tracking-tight">Se encontraron <span className="text-red-600 font-black">{duplicatesFound.length} códigos</span> repetidos. ¿Deseas actualizar la información de estos productos con los datos del Excel?</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => executeServerImport(true)} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">SÍ, ACTUALIZAR EXISTENTES</button>
                            <button onClick={() => setIsWarningModalOpen(false)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">VOLVER A REVISAR</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ELIMINAR */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-sm rounded-[35px] shadow-2xl p-10 text-center">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">!</div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">¿Eliminar {selectedIds.length} ítems?</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Esta acción es irreversible</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleConfirmDelete} className="bg-rose-600 text-white w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg">SÍ, ELIMINAR AHORA</button>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 py-2 text-[10px] font-black uppercase">CANCELAR</button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default Gproductos;