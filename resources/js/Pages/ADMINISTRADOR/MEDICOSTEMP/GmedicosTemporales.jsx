import React from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

// Hooks
import { useMedicosTempFilter } from './HooksM/useMedicosTempFilter';
import { useMedicoTempForm } from './HooksM/useMedicoTempForm';

// Componentes
import MedicosTempToolbar from './ComponentsM/MedicosTempToolbar';
import MedicosTempPaginator from './ComponentsM/MedicosTempPaginator';
import MedicosTempTable from './ComponentsM/MedicosTempTable';
import MedicoTempPromoteModal from './ComponentsM/MedicoTempPromoteModal';

const GmedicosTemporales = ({
    auth,
    medicosTemporales = [],
    categorias = [],
    visitadores = [],
    tiposDocumento = [],
}) => {
    const filter = useMedicosTempFilter(medicosTemporales);
    const form = useMedicoTempForm();

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Validación de Médicos" />

            <div className="w-full min-h-screen bg-[#F8FAFC]">
                <MedicosTempToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}
                />

                <MedicosTempPaginator
                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}
                />

                <MedicosTempTable
                    currentItems={filter.currentItems}
                    onPromote={form.openPromoteModal}
                />
            </div>

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