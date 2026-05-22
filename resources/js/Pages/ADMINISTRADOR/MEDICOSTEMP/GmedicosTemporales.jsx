import React from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

import { useMedicosTempFilter }    from './HooksM/useMedicosTempFilter';
import { useMedicoTempForm }       from './HooksM/useMedicoTempForm';
import { useMedicosTempSelection } from './HooksM/useMedicosTempSelection';

import MedicosTempToolbar    from './ComponentsM/MedicosTempToolbar';
import MedicosTempTable      from './ComponentsM/MedicosTempTable';
import MedicoTempPromoteModal from './ComponentsM/MedicoTempPromoteModal';

const GmedicosTemporales = ({
    auth,
    medicosTemporales = [],
    categorias        = [],
    visitadores       = [],
    tiposDocumento    = [],
}) => {
    const filter    = useMedicosTempFilter(medicosTemporales);
    const form      = useMedicoTempForm();
    const selection = useMedicosTempSelection();

    const handleDeleteSelected = () => {
        if (confirm(`¿Estás seguro de eliminar ${selection.selectedIds.length} registros?`)) {
            console.log('Eliminando IDs:', selection.selectedIds);
        }
    };

    const handleExport = () => {
        console.log('Exportando datos filtrados...');
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Validación de Médicos" />

            <div className="w-full min-h-screen bg-[#F8FAFC]">
                <MedicosTempToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}

                    selectedIds={selection.selectedIds}
                    onSelectAll={selection.toggleSelectAll}
                    currentItems={filter.currentItems}

                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}

                    onDelete={handleDeleteSelected}
                    onExport={handleExport}
                    onNew={() => console.log('Nueva Gestión')}
                />

                <MedicosTempTable
                    currentItems={filter.currentItems}
                    selectedIds={selection.selectedIds}
                    onSelectOne={selection.toggleSelectOne}
                    onPromote={form.openPromoteModal}  // ← dispara el modal
                />
            </div>

            <MedicoTempPromoteModal
                isOpen={form.isModalOpen}
                onClose={form.closeModal}              // ← cierra + reset limpio
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