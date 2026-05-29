import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaMagnifyingGlass } from 'react-icons/fa6';

import BarraNave from '../barranave';
import HeroSection    from './ComponentsPe/HeroSection';
import AgendaTab      from './ComponentsPe/AgendaTab';
import PendientesTab  from './ComponentsPe/PendientesTab';
import TopMedicosTab  from './ComponentsPe/TopMedicosTab';
import { useDashboardMetrics } from './HooksPe/useDashboardMetrics';

// ---------------------------------------------------------------------------
// Helpers de filtrado (fuera del componente para evitar recreaciones)
// ---------------------------------------------------------------------------

/**
 * Determina si un médico (o sus datos de fallback) coincide con el término buscado.
 */
const cumpleFiltroBusqueda = (medico, termino) => {
    if (!termino) return true;

    if (!medico) {
        return 'médico desconocido'.includes(termino) || 'general'.includes(termino);
    }

    const nombre       = (medico.nombre       || '').toLowerCase();
    const apellido     = (medico.apellido     || '').toLowerCase();
    const especialidad = (medico.especialidad || '').toLowerCase();

    return nombre.includes(termino) || apellido.includes(termino) || especialidad.includes(termino);
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

const DashboardLFH = ({
    visitador       = {},
    medicos         = [],
    visitasData     = [],
    visitasPendientes = [],
    topMedicos      = [],
    ventasActuales  = 0,
}) => {
    const [search,    setSearch]    = useState('');
    const [tabActiva, setTabActiva] = useState('agenda');

    // Datos del visitador
    const metaActual      = visitador?.metas || null;
    const metaValorGlobal = metaActual?.meta_visitas || 0;
    const metaDinero      = Number(metaActual?.meta_dinero) || 0;

    // Métricas calculadas via hook
    const { porcentaje, porcentajeVentas, meta, fueVisitado } = useDashboardMetrics(
        visitasData,
        metaValorGlobal,
        metaDinero,
        ventasActuales,
    );

    const visitasEfectivasCount = visitasData.filter(v => v.estado === 'efectiva').length;

    // Filtrado reactivo
    const termino = search.toLowerCase().trim();

    const medicosFiltrados = medicos.filter(m => cumpleFiltroBusqueda(m, termino));

    const visitasPendientesFiltradas = visitasPendientes.filter(visita => {
        const medicoData = medicos.find(m => m.id === visita.medico_id) || visita.medico;
        return cumpleFiltroBusqueda(medicoData, termino);
    });

    // Navegación
    const irAAgendarVisita = (medicoId) => router.get('/MisVisitas', { medico_id: medicoId });

    const irAEjecutarVisita = (medicoId, visitaId) =>
        router.get('/MisVisitas', { medico_id: medicoId, visita_id: visitaId });

    // -------------------------------------------------------------------------
    return (
        <div className="bg-[#E5F4FF] min-h-screen pb-24 font-sans text-gray-800">
            <Head title="Dashboard - LFH" />

            {/* ── Header con buscador ── */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20">
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden md:flex flex-col min-w-0">
                            <h1 className="text-xs md:text-sm font-black text-[#1C85E8] uppercase tracking-wider whitespace-nowrap">
                                Panel de Control
                            </h1>
                        </div>

                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs md:text-sm" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar médicos asignados o especialidad..."
                                className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-12 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Hero: saludo + métricas + pestañas ── */}
            <HeroSection
                porcentaje={porcentaje}
                porcentajeVentas={porcentajeVentas}
                visitasEfectivasCount={visitasEfectivasCount}
                meta={meta}
                ventasActuales={ventasActuales}
                metaDinero={metaDinero}
                tabActiva={tabActiva}
                setTabActiva={setTabActiva}
                totalMedicos={medicos.length}
                totalPendientes={visitasPendientes.length}
            />

            {/* ── Contenido dinámico según pestaña ── */}
            <main className="max-w-5xl mx-auto px-4 mt-6 space-y-4">
                {tabActiva === 'agenda' && (
                    <AgendaTab
                        medicosFiltrados={medicosFiltrados}
                        fueVisitado={fueVisitado}
                        irAAgendarVisita={irAAgendarVisita}
                    />
                )}

                {tabActiva === 'pendientes' && (
                    <PendientesTab
                        visitasPendientesFiltradas={visitasPendientesFiltradas}
                        medicos={medicos}
                        irAEjecutarVisita={irAEjecutarVisita}
                    />
                )}

                {tabActiva === 'top' && (
                    <TopMedicosTab
                        topMedicos={topMedicos}
                        medicos={medicos}
                    />
                )}
            </main>

            <BarraNave />
        </div>
    );
};

export default DashboardLFH;