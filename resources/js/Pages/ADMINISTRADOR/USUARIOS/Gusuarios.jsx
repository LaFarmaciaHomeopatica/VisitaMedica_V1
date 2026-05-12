import React from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

// Hooks
import { useUsuariosFilter } from './HooksU/useUsuariosFilter';
import { useUsuarioForm } from './HooksU/useUsuarioForm';

// Componentes
import UsuariosToolbar from './ComponentsU/UsuariosToolbar';
import UsuariosPaginator from './ComponentsU/UsuariosPaginator';
import UsuariosTable from './ComponentsU/UsuariosTable';
import UsuarioFormModal from './ComponentsU/UsuarioFormModal';
import UsuarioDeleteModal from './ComponentsU/UsuarioDeleteModal';

const Gusuarios = ({ usuarios = [], roles = [] }) => {
    const filter = useUsuariosFilter(usuarios);
    const form = useUsuarioForm();

    return (
        <PanelAdmin>
            <Head title="Gestión de Usuarios" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                <UsuariosToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}
                    onNew={form.openCreateModal}

                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}
                />

                <UsuariosTable
                    currentItems={filter.currentItems}
                    roles={roles}
                    onEdit={form.openEditModal}
                    onDelete={form.openDeleteModal}
                />
            </div>

            <UsuarioFormModal
                isOpen={form.isModalOpen}
                onClose={() => form.setIsModalOpen(false)}
                onSubmit={form.handleSubmit}
                isEditing={form.isEditing}
                data={form.data}
                setData={form.setData}
                processing={form.processing}
                errors={form.errors}
                roles={roles}
            />

            <UsuarioDeleteModal
                isOpen={form.isDeleteModalOpen}
                onClose={() => form.setIsDeleteModalOpen(false)}
                onConfirm={form.handleConfirmDelete}
                processing={form.processing}
            />
        </PanelAdmin>
    );
};

export default Gusuarios;