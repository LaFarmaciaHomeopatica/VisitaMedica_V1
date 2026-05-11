import React from 'react';
import { Head, router } from '@inertiajs/react';
import * as XLSX from 'xlsx';
import PanelAdmin from '../PanelAdmin';

// Hooks
import ProductosToolbar from "./ComponentsP/ProductosToolbar";
import ProductosPaginator from "./ComponentsP/ProductosPaginator";
import ProductosTable from "./ComponentsP/ProductosTable";
import ProductoFormModal from "./ComponentsP/ProductoFormModal";
import ProductoImportPreviewModal from "./ComponentsP/ProductoImportPreviewModal";
import ProductoImportWarningModal from "./ComponentsP/ProductoImportWarningModal";
import ProductoDeleteModal from "./ComponentsP/ProductoDeleteModal";

import { useProductosFilter } from "./HooksP/useProductosFilter";
import { useProductosSelection } from "./HooksP/useProductosSelection";
import { useProductosImport } from "./HooksP/useProductosImport";
import { useProductoForm } from "./HooksP/useProductoForm";

const Gproductos = ({ productos = [] }) => {
    const filter = useProductosFilter(productos);
    const selection = useProductosSelection();
    const importHook = useProductosImport(productos);
    const form = useProductoForm();

    // --- Exportación (se queda en el orquestador porque usa XLSX directo) ---
    const handleExport = () => {
        const dataToExport = selection.selectedIds.length > 0
            ? productos.filter(p => selection.selectedIds.includes(p.id))
            : filter.filteredProductos;

        if (dataToExport.length === 0) return;

        const formatted = dataToExport.map(p => ({
            codigo: p.codigo,
            nombre: p.nombre,
            laboratorio: p.laboratorio || 'N/A',
        }));

        const ws = XLSX.utils.json_to_sheet(formatted);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        XLSX.writeFile(wb, `Reporte_Productos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // --- Eliminación ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

    const handleConfirmDelete = () => {
        if (selection.selectedIds.length === 0) return;
        router.post(route('Gproductos.destroy'), { ids: selection.selectedIds }, {
            onSuccess: () => { setIsDeleteModalOpen(false); selection.clearSelection(); },
            preserveScroll: true,
        });
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Productos" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                <ProductosToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}
                    selectedIds={selection.selectedIds}
                    onFileChange={importHook.handleFileChange}
                    onExport={handleExport}
                    onDelete={() => { if (selection.selectedIds.length > 0) setIsDeleteModalOpen(true); }}
                    onNew={form.openCreateModal}



                    currentItems={filter.currentItems}
                    onSelectAll={selection.handleSelectAll}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}
                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                />

                <ProductosTable
                    currentItems={filter.currentItems}
                    selectedIds={selection.selectedIds}
                    onSelectOne={selection.handleSelectOne}
                    onEdit={form.openEditModal}
                />
            </div>

            <ProductoFormModal
                isOpen={form.isModalOpen}
                onClose={() => form.setIsModalOpen(false)}
                isEditing={form.isEditing}
                data={form.data}
                setData={form.setData}
                processing={form.processing}
                onSubmit={form.handleSubmit}
            />

            <ProductoImportPreviewModal
                isOpen={importHook.isPreviewModalOpen}
                onClose={() => importHook.setIsPreviewModalOpen(false)}
                onConfirm={importHook.handleProcessImport}
                previewData={importHook.previewData}
                productos={productos}
                activeTab={importHook.activeTab}
                setActiveTab={importHook.setActiveTab}
            />

            <ProductoImportWarningModal
                isOpen={importHook.isWarningModalOpen}
                duplicatesCount={importHook.duplicatesFound.length}
                onConfirm={() => importHook.executeServerImport(true)}
                onCancel={() => importHook.setIsWarningModalOpen(false)}
            />

            <ProductoDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                count={selection.selectedIds.length}
            />
        </PanelAdmin>
    );
};

export default Gproductos;