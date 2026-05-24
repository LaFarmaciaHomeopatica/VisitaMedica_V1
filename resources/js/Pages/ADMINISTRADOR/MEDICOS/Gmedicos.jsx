import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
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
    const importHook = useMedicosImport(medicos);
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

    // --- Handlers de exportación ---
    const executeExport = () => {
        const idsParam = selection.selectedIds.length > 0 ? `?ids=${selection.selectedIds.join(',')}` : '';
        window.location.href = route('Gmedicos.exportar') + idsParam;
        setIsExportModalOpen(false);
    };

    // --- Handlers de eliminación ---
    const handleOpenDelete = () => {
        if (selection.selectedIds.length === 0) return;
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        router.post(route('medicos.eliminar-masivo'), { ids: selection.selectedIds }, {
            onSuccess: () => { setIsDeleteModalOpen(false); selection.clearSelection(); },
        });
    };

    // --- Handlers de asignación de visitador ---
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

    // --- Handler ver detalle ---
    const openViewModal = (medico) => {
        setSelectedMedico(medico);
        setIsViewModalOpen(true);
    };

    return (
        <PanelAdmin>
            <Head title="Directorio de Médicos" />

            <div className="w-full min-h-screen flex flex-col bg-white">

                <MedicosToolbar
                    // Props de búsqueda y acciones
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

                    // PROPS DE PAGINACIÓN (Conectadas correctamente al hook filter y selection)
                    currentItems={filter.currentItems}           // Los médicos de la página actual
                    onSelectAll={selection.handleSelectAll}      // Función del hook de selección
                    itemsPerPage={filter.itemsPerPage}           // Valor del hook de filtro
                    onItemsPerPageChange={filter.setItemsPerPage} // Función del hook de filtro
                    currentPage={filter.currentPage}             // Página actual
                    onPageChange={filter.setCurrentPage}         // Función para cambiar página
                    totalPages={filter.totalPages}               // Total calculado
                />



                <MedicosTable
                    currentItems={filter.currentItems}
                    selectedIds={selection.selectedIds}
                    onSelectOne={selection.handleSelectOne}
                    onEdit={form.openEditModal}
                    onView={openViewModal}
                />
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
                categorias={categorias}
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

export default Gmedicos;