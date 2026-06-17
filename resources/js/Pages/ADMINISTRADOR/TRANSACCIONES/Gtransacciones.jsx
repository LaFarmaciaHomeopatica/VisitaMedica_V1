import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

// Hooks
import { useTransaccionesFilter } from './HooksT/useTransaccionesFilter';
import { useTransaccionesSelection } from './HooksT/useTransaccionesSelection';
import { useTransaccionForm } from './HooksT/useTransaccionForm';
import { useColumnVisibility } from './HooksT/useColumnVisibility';

// Componentes
import TransaccionesToolbar from './ComponentsT/TransaccionesToolbar';
import TransaccionesPaginator from './ComponentsT/TransaccionesPaginator';
import TransaccionesTable from './ComponentsT/TransaccionesTable';
import TransaccionFormModal from './ComponentsT/TransaccionFormModal';
import TransaccionDeleteModal from './ComponentsT/TransaccionDeleteModal';
import TransaccionesCalendar from './ComponentsT/TransaccionesCalendar';

const Gtransacciones = ({ auth, transacciones = [], medicos = [], productos = [], calendarData = {} }) => {
    const filter = useTransaccionesFilter(transacciones);
    const selection = useTransaccionesSelection();
    const form = useTransaccionForm();
    const columns = useColumnVisibility();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [importing, setImporting]     = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const tableRef = useRef(null);

    const handleDayClick = (dateStr) => {
        filter.setSearchTerm(dateStr);
        setShowCalendar(false);
        setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    // --- Importación ---
    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        router.post(route('Gtransacciones.importar'), { archivo: file }, {
            forceFormData: true,
            onSuccess: (page) => {
                e.target.value = '';
                setImporting(false);
                const result = page.props.flash?.import_result;
                if (result) setImportResult(result);
            },
            onError: () => setImporting(false),
            onFinish: () => setImporting(false),
        });
    };

    // --- Exportación Modificada (Soporta Selección de filas) ---
    const handleExport = () => {
        let url = route('Gtransacciones.exportar');

        // Si hay elementos seleccionados en el hook, los adjuntamos a la URL
        if (selection.selectedIds && selection.selectedIds.length > 0) {
            const params = new URLSearchParams();
            selection.selectedIds.forEach(id => params.append('ids[]', id));
            url += '?' + params.toString();
        }

        // Ejecuta la descarga nativa sin interrumpir el estado de Inertia
        window.location.href = url;
    };

    // --- Plantilla ---
    const handleDownloadTemplate = () => {
        window.location.href = route('Gtransacciones.plantilla');
    };

    // --- Eliminación ---
    const handleConfirmDelete = () => {
        if (selection.selectedIds.length === 0) return;
        router.delete(route('Gtransacciones.destroy_multiple'), {
            data: { ids: selection.selectedIds },
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                selection.clearSelection();
            },
        });
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Gestión de Transacciones" />

            <div className="w-full min-h-screen flex flex-col bg-white">

                {showCalendar && (
                    <div className="px-6 pt-4 pb-2">
                        <TransaccionesCalendar calendarData={calendarData} onDayClick={handleDayClick} />
                    </div>
                )}

                <TransaccionesToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}
                    selectedIds={selection.selectedIds}
                    onDelete={() => {
                        if (selection.selectedIds.length > 0) setIsDeleteModalOpen(true);
                    }}
                    onNew={form.openCreateModal}
                    onFileChange={handleImportExcel}
                    onExport={handleExport}
                    onDownloadTemplate={handleDownloadTemplate}

                    currentItems={filter.currentItems}
                    onSelectAll={selection.toggleSelectAll}

                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}
                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                    visibleColumns={columns.visibleColumns}
                    showColumnFilter={columns.showColumnFilter}
                    setShowColumnFilter={columns.setShowColumnFilter}
                    columnFilterRef={columns.columnFilterRef}
                    onToggleColumn={columns.toggleColumn}
                    showCalendar={showCalendar}
                    onToggleCalendar={() => setShowCalendar(v => !v)}
                />

                <div ref={tableRef} />

                <TransaccionesTable
                    currentItems={filter.currentItems}
                    selectedIds={selection.selectedIds}
                    onToggleSelectAll={selection.toggleSelectAll}
                    onToggleSelectOne={selection.toggleSelectOne}
                    visibleColumns={columns.visibleColumns}
                    onEdit={form.openEditModal}
                />
            </div>

            <TransaccionFormModal
                isOpen={form.isModalOpen}
                onClose={() => form.setIsModalOpen(false)}
                isEditing={form.isEditing}
                data={form.data}
                setData={form.setData}
                processing={form.processing}
                errors={form.errors}
                onSubmit={form.handleSubmit}
                medicos={medicos}
                productos={productos}
            />

            <TransaccionDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                count={selection.selectedIds.length}
            />

            {/* Overlay de carga durante importación */}
            {importing && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl px-12 py-10 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-[12px] font-black text-slate-700 uppercase tracking-widest">Procesando archivo...</p>
                        <p className="text-[10px] text-slate-400">Esto puede tardar unos segundos</p>
                    </div>
                </div>
            )}

            {/* Modal de resultado de importación */}
            {importResult && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                        <div className={`px-8 py-5 ${importResult.ok ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-rose-50 border-b border-rose-100'}`}>
                            <h3 className={`text-[12px] font-black uppercase tracking-widest ${importResult.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {importResult.ok ? 'Importación completada' : 'Error en importación'}
                            </h3>
                        </div>
                        <div className="px-8 py-6">
                            {importResult.ok ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">Nuevas</span>
                                        <span className="text-[14px] font-black text-emerald-600">{importResult.importadas}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">Actualizadas</span>
                                        <span className="text-[14px] font-black text-blue-600">{importResult.actualizadas}</span>
                                    </div>
                                    {importResult.pendientes > 0 && (
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase">Médicos pendientes</span>
                                            <span className="text-[14px] font-black text-amber-500">{importResult.pendientes}</span>
                                        </div>
                                    )}
                                    {importResult.invalidas > 0 && (
                                        <div className="py-2 border-b border-slate-50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase">Filas omitidas</span>
                                                <span className="text-[14px] font-black text-rose-500">{importResult.invalidas}</span>
                                            </div>
                                        </div>
                                    )}
                                    {importResult.codigosNoExisten?.length > 0 && (
                                        <div className="pt-1">
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-2">
                                                Códigos de producto no registrados:
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                {importResult.codigosNoExisten.map(codigo => (
                                                    <span
                                                        key={codigo}
                                                        className="inline-block px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-black rounded-md uppercase"
                                                    >
                                                        {codigo}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-slate-400 mt-2">
                                                Registra estos productos antes de importar las filas correspondientes.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-[11px] text-rose-600 font-bold">{importResult.error}</p>
                            )}
                        </div>
                        <div className="px-8 pb-6 flex justify-end">
                            <button
                                onClick={() => setImportResult(null)}
                                className="bg-slate-800 text-white px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-700 transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default Gtransacciones;