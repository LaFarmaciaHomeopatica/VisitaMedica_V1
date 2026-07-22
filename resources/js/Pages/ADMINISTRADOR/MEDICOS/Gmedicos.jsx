import React, { useState } from 'react';
import { Head, router, Deferred } from '@inertiajs/react'; // ← Importamos Deferred
import PanelAdmin from '../PanelAdmin';

// Hooks
import { useMedicosFilter } from './Hooks/useMedicosFilter';
import { useMedicosSelection } from './Hooks/useMedicosSelection';
import { useMedicosImport } from './Hooks/useMedicosImport';
import { useMedicoForm } from './Hooks/useMedicoForm';

// Componentes UI
import MedicosToolbar from './Components/MedicosToolbar';
import MedicosTable from './Components/MedicosTable';

// Modales
import MedicoFormModal from './Components/MedicoFormModal';
import ExportConfirmModal from './Components/ExportConfirmModal';
import ImportPreviewModal from './Components/ImportPreviewModal';
import ImportWarningModal from './Components/ImportWarningModal';
import DeleteConfirmModal from './Components/DeleteConfirmModal';
import AssignVisitorModal from './Components/AssignVisitorModal';
import ReviewSelectionModal from './Components/ReviewSelectionModal';
import MedicoViewModal from './Components/MedicoViewModal';

const Gmedicos = ({ auth, medicos = [], visitadores = [], tiposDocumento = [], categorias = [] }) => {
    // --- Hooks ---
    const filter = useMedicosFilter(medicos);
    const selection = useMedicosSelection();
    const importHook = useMedicosImport(medicos, visitadores);
    const form = useMedicoForm(visitadores);

    // --- Estado de modales simples ---
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedMedico, setSelectedMedico] = useState(null);

    // --- Datos derivados ---
    const medicosSeleccionados = medicos.filter(m => selection.selectedIds.includes(m.id));
    const hasPreviousAssignment = medicosSeleccionados.some(m => m.visitador_id !== null);

    // --- Handlers ---
    const executeExport = () => {
        const idsParam = selection.selectedIds.length > 0 ? `?ids=${selection.selectedIds.join(',')}` : '';
        window.location.href = route('Gmedicos.exportar') + idsParam;
        setIsExportModalOpen(false);
    };

    const handleOpenDelete = () => {
        if (selection.selectedIds.length === 0) return;
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        router.post(route('medicos.eliminar-masivo'), { ids: selection.selectedIds }, {
            onSuccess: () => { setIsDeleteModalOpen(false); selection.clearSelection(); },
        });
    };

    const handleOpenAssign = () => {
        if (selection.selectedIds.length === 0) return;
        if (hasPreviousAssignment) {
            setIsReviewModalOpen(true);
        } else {
            setIsAssignModalOpen(true);
        }
    };

    const handleReviewConfirm = (idsConfirmados) => {
        selection.setSelectedIds(idsConfirmados);
        setIsReviewModalOpen(false);
        setIsAssignModalOpen(true);
    };

    const executeAssignVisitor = (visitadorId) => {
        router.post(route('medicos.vincular-visitador'), {
            medico_ids: selection.selectedIds,
            visitador_id: visitadorId,
        }, {
            onSuccess: () => { setIsAssignModalOpen(false); selection.clearSelection(); },
            preserveScroll: true,
        });
    };

    const openViewModal = (medico) => {
        setSelectedMedico(medico);
        setIsViewModalOpen(true);
    };

    return (
        <PanelAdmin>
            <Head title="Directorio de Médicos" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                <MedicosToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}
                    selectedIds={selection.selectedIds}
                    onDelete={handleOpenDelete}
                    onAssignVisitor={handleOpenAssign}
                    onExport={() => setIsExportModalOpen(true)}
                    onTemplate={() => importHook.handleDownloadTemplate({ visitadores, tiposDocumento, categorias })}
                    onImport={importHook.handleImportClick}
                    onNew={form.openCreateModal}
                    fileInputRef={importHook.fileInputRef}
                    onFileChange={importHook.handleFileChange}

                    currentItems={filter.currentItems}
                    onSelectAll={selection.handleSelectAll}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}
                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                />

                {/* Envolvemos la tabla con Deferred para mostrar un indicador mientras cargan los médicos */}
                <Deferred data="medicos" fallback={<CargandoMedicosState />}>
                    <MedicosTable
                        currentItems={filter.currentItems}
                        selectedIds={selection.selectedIds}
                        onSelectOne={selection.handleSelectOne}
                        onEdit={form.openEditModal}
                        onView={openViewModal}
                    />
                </Deferred>
            </div>

            {/* Modales */}
            <MedicoFormModal
                isOpen={form.isFormModalOpen}
                onClose={() => form.setIsFormModalOpen(false)}
                isEditing={form.isEditing}
                data={form.data}
                setData={form.setData}
                errors={form.errors}
                processing={form.processing}
                onSubmit={form.handleSubmit}
                tiposDocumento={tiposDocumento}
                visitadorNombre={form.visitadorNombre}
            />

            <ExportConfirmModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={executeExport}
                selectedIds={selection.selectedIds}
                medicos={medicos}
            />

            <ImportPreviewModal
                isOpen={importHook.isPreviewModalOpen}
                onClose={() => importHook.setIsPreviewModalOpen(false)}
                onConfirm={importHook.handleProcessImport}
                previewData={importHook.previewData}
                activeTab={importHook.activeTab}
                setActiveTab={importHook.setActiveTab}
            />

            <ImportWarningModal
                isOpen={importHook.isWarningModalOpen}
                duplicatesCount={importHook.duplicatesFound.length}
                onConfirm={importHook.executeServerImport}
                onCancel={() => importHook.setIsWarningModalOpen(false)}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDelete}
                medicosSeleccionados={medicosSeleccionados}
            />

            <AssignVisitorModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onConfirm={executeAssignVisitor}
                visitadores={visitadores}
                selectedIds={selection.selectedIds}
                hasPreviousAssignment={hasPreviousAssignment}
            />

            <ReviewSelectionModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onConfirm={handleReviewConfirm}
                medicosSeleccionados={medicosSeleccionados}
            />

            <MedicoViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                medico={selectedMedico}
            />
        </PanelAdmin>
    );
};

// Componente visual para mostrar el estado de carga
const CargandoMedicosState = () => (
    <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-100 rounded-lg shadow-sm my-4">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-700 font-medium text-lg">Consultando médicos, espera...</p>
        <p className="text-gray-400 text-sm mt-1">Sincronizando información y especialidades con Odoo</p>
    </div>
);

export default Gmedicos;