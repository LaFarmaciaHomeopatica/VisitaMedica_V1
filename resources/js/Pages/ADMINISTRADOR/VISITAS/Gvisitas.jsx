import React from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

// Hooks
import { useVisitasFilter } from './HooksV/useVisitasFilter';
import { useVisitaForm } from './HooksV/useVisitaForm';


// Componentes

import VisitasToolbar from './ComponentsV/VisitasToolbar';
import VisitasPaginator from './ComponentsV/VisitasPaginator';
import VisitasTable from './ComponentsV/VisitasTable';
import VisitaFormModal from './ComponentsV/VisitaFormModal';
import VisitaViewModal from './ComponentsV/VisitaViewModal';
import VisitaDeleteModal from './ComponentsV/VisitaDeleteModal';

const VisitasIndex = ({ visitas = [], medicos = [], visitadores = [] }) => {
    const filter = useVisitasFilter(visitas, medicos, visitadores);
    const form = useVisitaForm(visitas, medicos);


    return (
        <PanelAdmin>
            <Head title="Gestión de Visitas" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                <VisitasToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}
                    onNew={form.openCreateModal}
                />

                <VisitasPaginator
                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}
                />

                <VisitasTable
                    currentItems={filter.currentItems}
                    medicos={medicos}
                    visitadores={visitadores}
                    onView={form.openViewModal}
                    onEdit={form.openEditModal}
                    onDelete={form.openDeleteModal}
                />
            </div>

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