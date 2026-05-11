import React from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

// Hooks
import { useMedicosTempFilter } from './HooksM/useMedicosTempFilter';
import { useMedicoTempForm } from './HooksM/useMedicoTempForm';
import { useMedicosTempSelection } from './HooksM/useMedicosTempSelection'; // Nuevo Hook

// Componentes
import MedicosTempToolbar from './ComponentsM/MedicosTempToolbar';
import MedicosTempTable from './ComponentsM/MedicosTempTable';
import MedicoTempPromoteModal from './ComponentsM/MedicoTempPromoteModal';

const GmedicosTemporales = ({
    auth,
    medicosTemporales = [],
    categorias = [],
    visitadores = [],
    tiposDocumento = [],
}) => {
    // 1. Inicialización de Hooks
    const filter = useMedicosTempFilter(medicosTemporales);
    const form = useMedicoTempForm();
    const selection = useMedicosTempSelection(); // Gestión de checkboxes

    // Funciones de acción para el Toolbar
    const handleDeleteSelected = () => {
        if (confirm(`¿Estás seguro de eliminar ${selection.selectedIds.length} registros?`)) {
            console.log("Eliminando IDs:", selection.selectedIds);
            // Aquí iría tu lógica de router.delete...
        }
    };

    const handleExport = () => {
        console.log("Exportando datos filtrados...");
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Validación de Médicos" />

            <div className="w-full min-h-screen bg-[#F8FAFC]">
                {/* TOOLBAR: Conectamos búsqueda, paginación 
                    y el estado global de selección (Select All)
                */}
                <MedicosTempToolbar
                    // Búsqueda
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}

                    // Selección Masiva
                    selectedIds={selection.selectedIds}
                    onSelectAll={selection.toggleSelectAll}
                    currentItems={filter.currentItems} // Importante para el map interno

                    // Paginación
                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}

                    // Acciones
                    onDelete={handleDeleteSelected}
                    onExport={handleExport}
                    onNew={() => console.log("Nueva Gestión")}
                />

                {/* TABLE: Conectamos los datos filtrados y 
                    la selección individual por fila
                */}
                <MedicosTempTable
                    currentItems={filter.currentItems}
                    selectedIds={selection.selectedIds}
                    onSelectOne={selection.toggleSelectOne}
                    onPromote={form.openPromoteModal}
                />
            </div>

            {/* MODAL DE GESTIÓN */}
            <MedicoTempPromoteModal
                isOpen={form.isModalOpen}
                onClose={() => form.setIsModalOpen(false)}
                onSubmit={form.handlePromote}
                data={form.data}
                setData={form.setData}
                processing={form.processing}
                errors={form.errors}
                categorias={categorias}
                visitadores={visitadores}
                tiposDocumento={tiposDocumento}
            />
        </PanelAdmin>
    );
};

export default GmedicosTemporales;