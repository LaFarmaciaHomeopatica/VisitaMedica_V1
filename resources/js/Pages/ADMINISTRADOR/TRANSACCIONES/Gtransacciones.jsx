import React, { useState } from 'react';
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

const Gtransacciones = ({ auth, transacciones = [], medicos = [], productos = [] }) => {
    const filter = useTransaccionesFilter(transacciones);
    const selection = useTransaccionesSelection();
    const form = useTransaccionForm();
    const columns = useColumnVisibility();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // --- Importación ---
    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        router.post(route('Gtransacciones.importar'), { archivo: file }, {
            forceFormData: true,
            onSuccess: () => { e.target.value = ''; },
        });
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
                <TransaccionesToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}
                    selectedIds={selection.selectedIds}
                    onDelete={() => {
                        if (selection.selectedIds.length > 0) setIsDeleteModalOpen(true);
                    }}
                    onNew={form.openCreateModal}
                    onFileChange={handleImportExcel}

                    currentItems={filter.currentItems}
                    // CORRECCIÓN AQUÍ: Cambiado de onToggleSelectAll a onSelectAll
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
                />

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
        </PanelAdmin>
    );
};

export default Gtransacciones;