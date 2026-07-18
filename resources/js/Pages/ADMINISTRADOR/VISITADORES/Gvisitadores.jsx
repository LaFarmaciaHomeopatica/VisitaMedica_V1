// resources/js/Pages/ADMINISTRADOR/VISITADORES/Gvisitadores.jsx
import React, { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import { useVisitadores } from './HooksVD/useVisitadores';
import VisitadorTable from './ComponentsVD/VisitadorTable';
import VisitadorFormModal from './ComponentsVD/VisitadorFormModal';
import VisitadorToolbar from './ComponentsVD/VisitadorToolbar';

const Gvisitadores = ({ visitadores = [], tiposDocumento = [], usuariosLibres = [], zonas = [] }) => {
    const { form, ui, filteredVisitadores } = useVisitadores(visitadores);
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

    // --- TOGGLE ESTADO (inline desde la tabla) ---
    const handleToggleEstado = (id) => {
        router.patch(route('Gvisitadores.toggleEstado', id), {}, { preserveScroll: true });
    };

    // --- ABRIR MODAL CREAR ---
    const openCreateModal = () => {
        form.clearErrors();
        form.reset();
        ui.setUserName('');
        ui.setIsEditing(false);
        ui.setIsFormModalOpen(true);
    };

    // --- ABRIR MODAL EDITAR ---
    const openEditModal = (v) => {
        form.clearErrors();
        ui.setIsEditing(true);
        form.setData({
            id: v.id,
            usuario_id: v.usuario_id || '',
            nombre: v.nombre || '',
            apellido: v.apellido || '',
            documento: v.documento || '',
            tipo_documento_id: v.tipo_documento_id || '',
            zona_id: v.zona_id || '',
            estado: v.estado || 'Habilitado',
        });
        ui.setUserName(v.user ? `@${v.user.username || v.user.nombre} (actual)` : '');
        ui.setIsFormModalOpen(true);
    };

    // Usuarios libres para el select del modal + el usuario actual del visitador que se edita
    const usuariosParaSelect = () => {
        if (!ui.isEditing) return usuariosLibres;
        // Al editar, excluimos el usuario ya mostrado en la opción "actual"
        return usuariosLibres.filter(u => u.id !== Number(form.data.usuario_id));
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Visitadores" />

            {toast && (
                <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold transition-all ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="w-full min-h-screen flex flex-col bg-white">

                <VisitadorToolbar
                    searchTerm={ui.searchTerm}
                    onSearchChange={(val) => {
                        ui.setSearchTerm(val);
                        ui.setCurrentPage(1);
                    }}
                    onAddClick={openCreateModal}
                    currentPage={ui.currentPage}
                    totalPages={ui.totalPages}
                    onPageChange={ui.setCurrentPage}
                    itemsPerPage={ui.itemsPerPage}
                    onItemsPerPageChange={ui.setItemsPerPage}
                />

                <div className="flex-grow p-4 overflow-hidden">
                    <VisitadorTable
                        currentItems={filteredVisitadores}
                        onEdit={openEditModal}
                        onToggleEstado={handleToggleEstado}
                    />
                </div>
            </div>

            <VisitadorFormModal
                isOpen={ui.isFormModalOpen}
                onClose={() => ui.setIsFormModalOpen(false)}
                isEditing={ui.isEditing}
                form={form}
                ui={ui}
                tiposDocumento={tiposDocumento}
                usuariosLibres={usuariosParaSelect()}
                zonas={zonas}
            />
        </PanelAdmin>
    );
};

export default Gvisitadores;
