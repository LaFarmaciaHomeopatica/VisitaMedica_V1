import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaMagnifyingGlass } from 'react-icons/fa6';

import BarraNave from '../barranave';
import HeroSection        from './ComponentsPe/HeroSection';
import PendientesTab      from './ComponentsPe/PendientesTab';
import MedicosCoincidentes from './ComponentsPe/MedicosCoincidentes';

import { useDashboardMetrics } from './HooksPe/useDashboardMetrics';

// ---------------------------------------------------------------------------
// Helpers de filtrado
// ---------------------------------------------------------------------------
const cumpleFiltroBusqueda = (medico, termino) => {
    if (!termino) return true;
    if (!medico) {
        return 'médico desconocido'.includes(termino) || 'general'.includes(termino);
    }
    const nombre       = (medico.nombre       || '').toLowerCase();
    const apellido     = (medico.apellido     || '').toLowerCase();
    const specialty    = (medico.especialidad || '').toLowerCase();
    const documento    = (medico.documento    || '').toLowerCase();

    return nombre.includes(termino) || apellido.includes(termino) || specialty.includes(termino) || documento.includes(termino);
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const DashboardLFH = ({
    visitador         = {},
    medicos           = [],
    visitasData       = [],
    visitasPendientes = [],
    ventasActuales    = 0,
}) => {
    const [search, setSearch] = useState('');

    const metaActual      = visitador?.metas || null;
    const metaValorGlobal = metaActual?.meta_visitas || 0;
    const metaDinero      = Number(metaActual?.meta_dinero) || 0;

    const { porcentaje, porcentajeVentas, meta, fueVisitado } = useDashboardMetrics(
        visitasData,
        metaValorGlobal,
        metaDinero,
        ventasActuales,
    );

    const visitasEfectivasCount = visitasData.filter(v => v.estado === 'efectiva').length;
    const termino = search.toLowerCase().trim();

    const visitasPendientesFiltradas = visitasPendientes.filter(visita => {
        // ✅ CORRECCIÓN: Forzar conversión a String para evitar fallas si un ID viene como número y el otro como texto
        const medicoData = medicos.find(m => String(m.id) === String(visita.medico_id)) || visita.medico;
        return cumpleFiltroBusqueda(medicoData, termino);
    });

    // El placeholder dice "Buscar médicos asignados", así que la búsqueda no puede
    // limitarse a las visitas pendientes: cuando hay término, también se buscan
    // médicos asignados que no tengan una pendiente ya listada arriba.
    const medicoIdsConPendiente = new Set(visitasPendientesFiltradas.map(v => String(v.medico_id)));
    const medicosSinPendienteFiltrados = termino
        ? medicos.filter(m => cumpleFiltroBusqueda(m, termino) && !medicoIdsConPendiente.has(String(m.id)))
        : [];

    const irAEjecutarVisita = (medicoId, visitaId) =>
        router.get('/MisVisitas', { medico_id: medicoId, visita_id: visitaId });

    return (
        <div className="bg-[#E5F4FF] min-h-screen pb-20 font-sans text-gray-800">
            <Head title="Dashboard - LFH" />

            {/* ── Header con buscador ── */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-white/20">
                <div className="max-w-[1440px] mx-auto py-2.5 px-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden md:flex flex-col min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1C85E8]/70 leading-none mb-0.5">
                                LFH Portal
                            </p>
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
                                placeholder="Buscar médicos asignados..."
                                className="w-full bg-blue-50/50 border-none rounded-full py-2 md:py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Hero ── */}
            <HeroSection
                porcentaje={porcentaje}
                porcentajeVentas={porcentajeVentas}
                visitasEfectivasCount={visitasEfectivasCount}
                meta={meta}
                ventasActuales={ventasActuales}
                metaDinero={metaDinero}
            />

            {/* ── Contenido dinámico ── */}
            <main className="max-w-5xl mx-auto px-4 mt-3 md:mt-6 space-y-3">
                <PendientesTab
                    visitasPendientesFiltradas={visitasPendientesFiltradas}
                    medicos={medicos}
                    irAEjecutarVisita={irAEjecutarVisita}
                />
                <MedicosCoincidentes medicos={medicosSinPendienteFiltrados} />
            </main>

            <BarraNave />
        </div>
    );
};

export default DashboardLFH;