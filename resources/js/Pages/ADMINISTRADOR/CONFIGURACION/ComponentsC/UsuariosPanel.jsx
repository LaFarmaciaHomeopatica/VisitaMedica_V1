import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

import { useUsuariosFilter } from '../../USUARIOS/HooksU/useUsuariosFilter';
import { useUsuarioForm } from '../../USUARIOS/HooksU/useUsuarioForm';

import UsuariosToolbar from '../../USUARIOS/ComponentsU/UsuariosToolbar';
import UsuariosPaginator from '../../USUARIOS/ComponentsU/UsuariosPaginator';
import UsuariosTable from '../../USUARIOS/ComponentsU/UsuariosTable';
import UsuarioFormModal from '../../USUARIOS/ComponentsU/UsuarioFormModal';
import UsuarioDeleteModal from '../../USUARIOS/ComponentsU/UsuarioDeleteModal';

export default function UsuariosPanel({ usuarios = [], roles = [] }) {
    const filter = useUsuariosFilter(usuarios);
    const form = useUsuarioForm();
    const { flash } = usePage().props;
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (flash?.success) setToast({ type: 'success', msg: flash.success });
        else if (flash?.error) setToast({ type: 'error', msg: flash.error });
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);

    return (
        <>
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold transition-all ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
        </>
    );
}
