// resources/js/Pages/ADMINISTRADOR/VISITADORES/Gvisitadores.jsx
import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import { useVisitadores } from './HooksVD/useVisitadores';
import VisitadorTable from './ComponentsVD/VisitadorTable';
import VisitadorFormModal from './ComponentsVD/VisitadorFormModal';
import VisitadorToolbar from './ComponentsVD/VisitadorToolbar';

const Gvisitadores = ({ visitadores = [], tiposDocumento = [] }) => {
    const { form, ui, filteredVisitadores } = useVisitadores(visitadores);

    // --- ESTADO LOCAL PARA SELECCIÓN MÚLTIPLE ---
    const [selectedIds, setSelectedIds] = useState([]);

    // --- MANEJADORES DE SELECCIÓN ---
    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e, items) => {
        if (e.target.checked) {
            const allIds = items.map(v => v.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    // --- MANEJADORES DE MODALES ---
    const openCreateModal = () => {
        form.clearErrors();
        form.reset();
        ui.setUserName('');
        ui.setIsEditing(false);
        ui.setIsFormModalOpen(true);
    };

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
            estado: v.estado || 'habilitado'
        });
        ui.setUserName(v.user ? `Vinculado a: ${v.user.username || v.user.nombre}` : 'Usuario vinculado');
        ui.setIsFormModalOpen(true);
    };

    const openDeleteModal = (v) => {
        form.setData('id', v.id);
        ui.setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        form.delete(route('Gvisitadores.destroy', form.data.id), {
            onSuccess: () => {
                ui.setIsDeleteModalOpen(false);
                setSelectedIds([]); // Limpiar selección tras borrar
                form.reset();
            }
        });
    };

    const handleDeleteSelected = () => {
        if (confirm(`¿Estás seguro de eliminar ${selectedIds.length} registros?`)) {
            // Aquí iría tu lógica de borrado masivo si tienes la ruta lista
            console.log("Eliminando IDs:", selectedIds);
        }
    };

    return (
        <PanelAdmin>
            <Head title="Gestión de Visitadores" />

            <div className="w-full min-h-screen flex flex-col bg-white">

                {/* 1. TOOLBAR INTEGRADO */}
                <VisitadorToolbar
                    searchTerm={ui.searchTerm}
                    onSearchChange={(val) => {
                        ui.setSearchTerm(val);
                        ui.setCurrentPage(1);
                    }}
                    onAddClick={openCreateModal}
                    // Paginación
                    currentPage={ui.currentPage}
                    totalPages={ui.totalPages}
                    onPageChange={ui.setCurrentPage}
                    itemsPerPage={ui.itemsPerPage}
                    onItemsPerPageChange={ui.setItemsPerPage}
                    // Selección
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    currentItems={filteredVisitadores}
                    onDeleteSelected={handleDeleteSelected}
                />

                {/* 2. TABLA DE RESULTADOS */}
                <div className="flex-grow p-4 overflow-hidden">
                    <VisitadorTable
                        currentItems={filteredVisitadores} // CORREGIDO: Se cambió 'items' por 'currentItems'
                        selectedIds={selectedIds}
                        onSelectOne={handleSelectOne}
                        onEdit={openEditModal}
                        onDelete={openDeleteModal}
                    />
                </div>
            </div>

            {/* Modal de Formulario */}
            <VisitadorFormModal
                isOpen={ui.isFormModalOpen}
                onClose={() => ui.setIsFormModalOpen(false)}
                isEditing={ui.isEditing}
                form={form}
                ui={ui}
                tiposDocumento={tiposDocumento}
            />

            {/* Modal de Confirmación de Eliminación Individual */}
            {ui.isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl border border-slate-100">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black italic">!</div>
                        <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">¿Eliminar Registro?</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase mb-6 px-4">Esta acción no se puede deshacer.</p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={confirmDelete}
                                disabled={form.processing}
                                className="bg-rose-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase hover:bg-rose-700 transition-all disabled:bg-slate-200"
                            >
                                {form.processing ? 'Eliminando...' : 'Eliminar Ahora'}
                            </button>
                            <button
                                onClick={() => ui.setIsDeleteModalOpen(false)}
                                className="text-slate-400 py-2 text-[10px] font-black uppercase hover:text-slate-600"
                            >
                                Regresar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default Gvisitadores;