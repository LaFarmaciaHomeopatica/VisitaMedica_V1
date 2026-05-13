import React from 'react';
import { Head } from '@inertiajs/react';
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
    const selection = useVisitasSelection(); // Hook de gestión de checkboxes

    // Acción para borrar los elementos seleccionados en el Toolbar
    const handleBulkDelete = () => {
        if (selection.selectedIds.length === 0) return;

        // Aquí podrías abrir un modal específico o usar el form.openDeleteModal
        // Por ahora, lo vinculamos a una confirmación simple o lógica de tu form hook
        if (confirm(`¿Estás seguro de eliminar ${selection.selectedIds.length} visitas seleccionadas?`)) {
            console.log("Eliminando visitas:", selection.selectedIds);
            // Lógica de eliminación masiva...
        }
    };

    const handleBulkExport = () => {
        console.log("Exportando visitas seleccionadas:", selection.selectedIds);
    };

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
        </PanelAdmin>
    );
};

export default VisitasIndex;