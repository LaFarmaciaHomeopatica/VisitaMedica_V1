import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react'; // <-- Usamos el router que ya tienes importado
import PanelAdmin from '../PanelAdmin';

import { useMedicosTempFilter }    from './HooksM/useMedicosTempFilter';
import { useMedicoTempForm }       from './HooksM/useMedicoTempForm';
import { useMedicosTempSelection } from './HooksM/useMedicosTempSelection';

import MedicosTempToolbar    from './ComponentsM/MedicosTempToolbar';
import MedicosTempTable      from './ComponentsM/MedicosTempTable';
import MedicoTempPromoteModal from './ComponentsM/MedicoTempPromoteModal';
import MedicoTempStatsPanel  from './ComponentsM/MedicoTempStatsPanel';

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

    const handleExport = (ids = []) => {
        console.log('ids recibidos en handleExport:', ids);
        const base = route('GmedicosTemporales.exportar');
        const params = ids.length > 0
            ? '?ids[]=' + ids.join('&ids[]=')
            : '';
        console.log('URL final:', base + params);
        window.location.href = base + params;
    };

    /**
     * ACCIÓN NUEVA: Maneja la subida del archivo Excel/CSV hacia Laravel
     */
    const handleImport = (file) => {
        // Ejecutamos el post usando la ruta que apunta a tu controlador modificado
        router.post(route('GmedicosTemporales.importar'), {
            file: file
        }, {
            forceFormData: true, // Forzar Multipart para que viaje el archivo binario
            onSuccess: () => {
                // Puedes cambiar este alert por tu sistema de notificaciones preferido
                alert('¡Médicos temporales importados/actualizados correctamente!');
            },
            onError: (errors) => {
                alert('Hubo un error al importar: ' + (errors.file || 'Verifica el contenido de tu archivo.'));
            }
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
                    onExport={handleExport}
                    onNew={() => console.log('Nueva Gestión')}
                    onImport={handleImport} // <-- Pasamos la función al Toolbar
                
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
        </PanelAdmin>
    );
};

export default GmedicosTemporales;