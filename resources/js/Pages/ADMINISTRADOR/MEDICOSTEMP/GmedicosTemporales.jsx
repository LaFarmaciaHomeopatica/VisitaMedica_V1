import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

import { useMedicosTempFilter }    from './HooksM/useMedicosTempFilter';
import { useMedicoTempForm }       from './HooksM/useMedicoTempForm';
import { useMedicosTempSelection } from './HooksM/useMedicosTempSelection';
import ImportTempConfirmModal from './ComponentsM/ImportTempConfirmModal';

import MedicosTempToolbar    from './ComponentsM/MedicosTempToolbar';
import MedicosTempTable      from './ComponentsM/MedicosTempTable';
import MedicoTempPromoteModal from './ComponentsM/MedicoTempPromoteModal';
import MedicoTempStatsPanel  from './ComponentsM/MedicoTempStatsPanel';
import ExportTempConfirmModal from './ComponentsM/ExportTempConfirmModal';

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
    const [statsmedico, setStatsmedico] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
const [importando, setImportando] = useState(false);

    const handleDeleteOne = (id) => {
        if (!confirm('¿Eliminar este médico temporal?')) return;
        router.delete(route('GmedicosTemporales.destroy', id));
    };

    const handleDeleteSelected = () => {
        if (selection.selectedIds.length === 0) return;
        if (!confirm(`¿Eliminar ${selection.selectedIds.length} registros seleccionados?`)) return;
        router.delete(route('GmedicosTemporales.destroyMultiple'), {
            data: { ids: selection.selectedIds },
            onSuccess: () => selection.clearSelection(),
        });
    };

    // ✅ Ahora solo dispara la descarga real; la validación y confirmación las maneja el modal
    const handleExport = (ids = []) => {
        const base = route('GmedicosTemporales.exportar');
        const params = ids.length > 0
            ? '?ids[]=' + ids.join('&ids[]=')
            : '';
        window.location.href = base + params;
    };

   const handleFileSelected = (file) => {
    setArchivoSeleccionado(file);
    setIsImportModalOpen(true);
};

// Se llama cuando el usuario confirma dentro del modal — ahí sí sube el archivo
const handleConfirmImport = () => {
    if (!archivoSeleccionado) return;

    setImportando(true);
    router.post(route('GmedicosTemporales.importar'), {
        file: archivoSeleccionado
    }, {
        forceFormData: true,
        onSuccess: () => {
            alert('¡Médicos temporales importados/actualizados correctamente!');
        },
        onError: (errors) => {
            alert('Hubo un error al importar: ' + (errors.file || 'Verifica el contenido de tu archivo.'));
        },
        onFinish: () => {
            setImportando(false);
            setIsImportModalOpen(false);
            setArchivoSeleccionado(null);
        },
    });
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
                    onExport={() => setIsExportModalOpen(true)}
                    onNew={() => console.log('Nueva Gestión')}
                    onImport={handleFileSelected}
                    onTemplate={() => window.location.href = route('GmedicosTemporales.plantilla')}
                />

                <MedicosTempTable
                    currentItems={filter.currentItems}
                    selectedIds={selection.selectedIds}
                    onSelectOne={selection.toggleSelectOne}
                    onPromote={form.openPromoteModal}
                    onDelete={handleDeleteOne}
                    onStats={setStatsmedico}
                />
            </div>

            <MedicoTempStatsPanel
                medico={statsmedico}
                onClose={() => setStatsmedico(null)}
            />

            <MedicoTempPromoteModal
                isOpen={form.isModalOpen}
                onClose={form.closeModal}
                onSubmit={form.handlePromote}
                data={form.data}
                setData={form.setData}
                processing={form.processing}
                errors={form.errors}
                categorias={categorias}
                visitadores={visitadores}
                tiposDocumento={tiposDocumento}
            />

            <ExportTempConfirmModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={() => handleExport(selection.selectedIds)}
                selectedIds={selection.selectedIds}
            />

            <ImportTempConfirmModal
    isOpen={isImportModalOpen}
    onClose={() => {
        if (!importando) {
            setIsImportModalOpen(false);
            setArchivoSeleccionado(null);
        }
    }}
    onConfirm={handleConfirmImport}
    file={archivoSeleccionado}
    importando={importando}
/>
        </PanelAdmin>
    );
};

export default GmedicosTemporales;