import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

// Hooks
import { useEventoForm } from './HooksE/useEventoForm';

// Componentes
import EventosCalendario from './ComponentsE/EventosCalendario';
import ModalEventoVisita from './ComponentsE/ModalEventoVisita';
import EventoDetalleModal from './ComponentsE/EventoDetalleModal';
import VisitaDetalleModal from './ComponentsE/VisitaDetalleModal';

const EventosIndex = ({ auth = {}, eventos = [], visitas = [], visitadores = [], productos = [], etiquetas = [] }) => {
    const form = useEventoForm();

    // Normaliza la lista de eventos soportando paginación de Inertia/Laravel o arrays simples
    const listaEventos = useMemo(() => {
        if (Array.isArray(eventos)) return eventos;
        if (eventos && Array.isArray(eventos.data)) return eventos.data;
        return [];
    }, [eventos]);

    // Normaliza la lista de visitas
    const listaVisitas = useMemo(() => {
        if (Array.isArray(visitas)) return visitas;
        if (visitas && Array.isArray(visitas.data)) return visitas.data;
        return [];
    }, [visitas]);

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Gestión de Eventos y Visitas" />

            {/* Notification Alert / Toast */}
            {form.aviso && (
                <div
                    role="alert"
                    aria-live="polite"
                    className={`fixed top-5 right-5 z-[70] flex items-center justify-between gap-3 max-w-sm px-4 py-3 rounded-xl shadow-2xl text-xs font-bold text-white transition-all duration-300 ease-in-out ${
                        form.aviso.tipo === 'ok' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                >
                    <span>{form.aviso.texto}</span>
                    {form.setAviso && (
                        <button
                            type="button"
                            onClick={() => form.setAviso(null)}
                            className="text-white/80 hover:text-white font-bold text-base leading-none"
                        >
                            ×
                        </button>
                    )}
                </div>
            )}

            {/* Contenedor Principal con Calendario */}
            <div className="w-full min-h-screen flex flex-col bg-white">
                <EventosCalendario
                    eventos={listaEventos}
                    visitas={listaVisitas}
                    visitadores={visitadores}
                    onNew={form.openCreate}
                    onDayClick={form.openCreate}
                    onEventClick={form.openEventoDetalle}
                    onVisitaClick={form.openVisitaDetalle}
                    onItemMove={form.handleItemMove}
                />
            </div>

            {/* Modal Unificado (Crear / Editar) con selector de Visita Médica vs Actividades */}
            <ModalEventoVisita
                key={
                    form.isEditing
                        ? `edit-${form.tipoModal}-${form.selectedVisita?.id || form.selectedEvento?.id}`
                        : `create-${form.tipoModal}`
                }
                isOpen={form.isModalOpen}
                onClose={() => form.setIsModalOpen(false)}
                tipoModal={form.tipoModal}
                setTipoModal={form.setTipoModal}
                isEditing={form.isEditing}
                visitadores={visitadores}
                productos={productos}
                etiquetas={etiquetas}
                // Visita
                visitaData={form.visitaData}
                setVisitaData={form.setVisitaData}
                visitaErrors={form.visitaErrors}
                visitaProcessing={form.visitaProcessing}
                onVisitaSubmit={form.onVisitaSubmit}
                medicosFiltradosPorVisitador={form.medicosFiltradosPorVisitador}
                onVisitaMedicoChange={form.onVisitaMedicoChange}
                onVisitaFechaChange={form.onVisitaFechaChange}
                // Actividad / Evento
                eventoData={form.eventoData}
                setEventoData={form.setEventoData}
                eventoErrors={form.eventoErrors}
                eventoProcessing={form.eventoProcessing}
                onEventoSubmit={form.onEventoSubmit}
            />

            {/* Modal Detalle de Visita Médica */}
            <VisitaDetalleModal
                isOpen={form.isVisitaDetalleOpen}
                onClose={() => form.setIsVisitaDetalleOpen(false)}
                visita={form.selectedVisita}
                visitadores={visitadores}
                onEdit={form.openEditVisita}
                onDelete={form.handleDeleteVisita}
                deleting={form.deleting}
            />

            {/* Modal Detalle de Actividad / Evento */}
            <EventoDetalleModal
                isOpen={form.isEventoDetalleOpen}
                onClose={() => form.setIsEventoDetalleOpen(false)}
                evento={form.selectedEvento}
                onEdit={form.openEditEvento}
                onDelete={form.handleDeleteEvento}
                deleting={form.deleting}
            />
        </PanelAdmin>
    );
};

export default EventosIndex;