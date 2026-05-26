import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

// Hooks
import { useVisitasFilter } from './HooksV/useVisitasFilter';
import { useVisitaForm } from './HooksV/useVisitaForm';
import { useVisitasSelection } from './HooksV/useVisitasSelection'; // Nuevo Hook

// Componentes
import VisitasToolbar from './ComponentsV/VisitasToolbar';
import VisitasTable from './ComponentsV/VisitasTable';
import VisitaFormModal from './ComponentsV/VisitaFormModal';
import VisitaViewModal from './ComponentsV/VisitaViewModal';
import VisitaDeleteModal from './ComponentsV/VisitaDeleteModal';

const VisitasIndex = ({ auth, visitas = [], medicos = [], visitadores = [], productos = [] }) => {
    // 1. Inicialización de Hooks
    const filter = useVisitasFilter(visitas, medicos, visitadores);
    const form = useVisitaForm(visitas, medicos);
    const selection = useVisitasSelection();

    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    const handleBulkDelete = () => {
        if (selection.selectedIds.length === 0) return;
        setIsBulkDeleteOpen(true);
    };

    const confirmBulkDelete = () => {
        setBulkProcessing(true);
        router.delete(route('Gvisitas.destroyBulk'), {
            data: { ids: selection.selectedIds },
            onSuccess: () => {
                selection.clearSelection();
                setIsBulkDeleteOpen(false);
                setBulkProcessing(false);
            },
            onError: () => setBulkProcessing(false),
        });
    };

    const handleBulkExport = () => {};

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Gestión de Visitas" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                {/* TOOLBAR: Conectado a filtros, paginación y selección masiva */}
                <VisitasToolbar
                    // Búsqueda
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}

                    // Selección
                    selectedIds={selection.selectedIds}
                    onSelectAll={selection.toggleSelectAll}
                    currentItems={filter.currentItems} // Necesario para el "Seleccionar Todo"

                    // Paginación
                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}

                    // Acciones
                    onNew={form.openCreateModal}
                    onDelete={handleBulkDelete}
                    onExport={handleBulkExport}
                />

                {/* TABLA: Conectada a datos y selección individual por fila */}
                <VisitasTable
                    currentItems={filter.currentItems}
                    medicos={medicos}
                    visitadores={visitadores}

                    // Selección individual
                    selectedIds={selection.selectedIds}
                    onSelectOne={selection.toggleSelectOne}

                    // Acciones de fila
                    onView={form.openViewModal}
                    onEdit={form.openEditModal}
                    onDelete={form.openDeleteModal}
                />
            </div>

            {/* MODALES DE GESTIÓN */}
            <VisitaFormModal
                isOpen={form.isModalOpen}
                onClose={() => form.setIsModalOpen(false)}
                onSubmit={form.handleSubmit}
                isEditing={form.isEditing}
                data={form.data}
                setData={form.setData}
                processing={form.processing}
                errors={form.errors}
                visitadores={visitadores}
                medicosFiltradosPorVisitador={form.medicosFiltradosPorVisitador}
                onFechaProgramadaChange={form.handleFechaProgramadaChange}
                onMedicoChange={form.handleMedicoChange}

                productos={productos}
            />

            <VisitaViewModal
                isOpen={form.isViewModalOpen}
                onClose={() => form.setIsViewModalOpen(false)}
                visita={form.selectedVisita}
                medicos={medicos}
                visitadores={visitadores}
            />

            <VisitaDeleteModal
                isOpen={form.isDeleteModalOpen}
                onClose={() => form.setIsDeleteModalOpen(false)}
                onConfirm={form.handleConfirmDelete}
                processing={form.processing}
            />

            {/* Modal eliminación masiva */}
            <VisitaDeleteModal
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onConfirm={confirmBulkDelete}
                processing={bulkProcessing}
            />
        </PanelAdmin>
    );
};

export default VisitasIndex;