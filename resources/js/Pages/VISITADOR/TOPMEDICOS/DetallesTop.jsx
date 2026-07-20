import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { FaSpinner } from 'react-icons/fa6';

import BarraNave from '../barranave';
import { MODOS } from './helpers.jsx';

import { useHeaderHeight } from './HooksDt/useHeaderHeight';
import { useOdooDetalle } from './HooksDt/useOdooDetalle';
import { useProductosPaginados } from './HooksDt/useProductosPaginados';

import HeaderContenido from './ComponentsDt/HeaderContenido';
import HeroMedico from './ComponentsDt/HeroMedico';
import HistorialVisitas from './ComponentsDt/HistorialVisitas';
import SelectorPeriodo from './ComponentsDt/SelectorPeriodo';
import ResumenFinanciero from './ComponentsDt/ResumenFinanciero';
import LaboratoriosAcordeon from './ComponentsDt/LaboratoriosAcordeon';
import ListaProductos from './ComponentsDt/ListaProductos';

// ─── Page Principal ───────────────────────────────────────────────────────────
const DetallesTop = ({
    medico,
    mesActual,
    periodoActivo = 'mes_actual',
    fechaDesdeActiva = null,
    fechaHastaActiva = null,
    vistaAnterior = 'general',
    limitAnterior = 10,
    searchAnterior = '',
    historialVisitas = [],
    odooDatosPesados = null, // 💡 Recibimos el objeto perezoso (Inertia::lazy)
}) => {
    const [modo, setModo] = useState(vistaAnterior || 'general');
    const [busqueda, setBusqueda] = useState('');

    const { headerRef, headerHeight } = useHeaderHeight();

    const {
        totales,
        productosComprados,
        productosFormulados,
        laboratoriosComprados,
        laboratoriosFormulados,
        puestoReal,
    } = useOdooDetalle(odooDatosPesados, { periodoActivo, fechaDesdeActiva, fechaHastaActiva });

    const {
        pagina,
        porPagina,
        setPagina,
        handlePorPagina,
        handlePagina,
        listaFiltrada,
        listaVisible,
    } = useProductosPaginados({ modo, busqueda, productosComprados, productosFormulados });

    const cfg = MODOS[modo] || MODOS.general;
    const cargandoOdoo = !odooDatosPesados;

    const queryParams = new URLSearchParams(window.location.search);
    const origen = queryParams.get('origen') || '';

    let backUrl = `/visitador/top-medicos?mes=${mesActual}&search=${searchAnterior}&vista=${vistaAnterior}&limit=${limitAnterior}`;
    if (origen === 'listado') backUrl = '/ListadoMedicos';
    else if (origen === 'panel') backUrl = '/panel';

    const googleMapsUrl = medico.geolocalizacion
        ? `https://www.google.com/maps/search/?api=1&query=${medico.geolocalizacion}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(medico.direccion_detalles || '')}`;

    const handleModo = (m) => { setModo(m); setPagina(1); };

    const handleBusquedaChange = (e) => { setBusqueda(e.target.value); setPagina(1); };
    const handleLimpiarBusqueda = () => { setBusqueda(''); setPagina(1); };

    const handlePeriodoChange = (key) => {
        router.get(
            `/visitador/top-medicos/${medico.documento}`,
            { mes: mesActual, periodo: key, vista: modo, limit: limitAnterior, search: searchAnterior, origen },
            { preserveScroll: true, preserveState: true }
        );
    };

    const handlePeriodoPersonalizado = (fechaDesde, fechaHasta, onCerrarCalendario) => {
        router.get(
            `/visitador/top-medicos/${medico.documento}`,
            {
                mes: mesActual,
                periodo: 'custom',
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
                vista: modo,
                limit: limitAnterior,
                search: searchAnterior,
                origen,
            },
            { preserveScroll: true, preserveState: true, onSuccess: onCerrarCalendario }
        );
    };

    return (
        <>
            <Head title={`Detalle - ${medico?.nombre} - LFH`} />

            {/* ── Header Flotante ── */}
            <header
                ref={headerRef}
                className="fixed top-0 left-0 right-0 z-30 bg-white/85 backdrop-blur-md shadow-sm rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20"
            >
                <HeaderContenido
                    backUrl={backUrl}
                    busqueda={busqueda}
                    onBusquedaChange={handleBusquedaChange}
                    onLimpiarBusqueda={handleLimpiarBusqueda}
                    busquedaDeshabilitada={cargandoOdoo}
                    cfg={cfg}
                    modo={modo}
                    onModo={handleModo}
                    totalFiltrados={listaFiltrada.length}
                    porPagina={porPagina}
                    pagina={pagina}
                    onPagina={handlePagina}
                    onPorPagina={handlePorPagina}
                />
            </header>

            {/* ── Contenido ── */}
            <div
                className="bg-[#E5F4FF] min-h-screen pb-28 font-sans text-gray-800 transition-[padding-top] duration-200"
                style={{ paddingTop: `${headerHeight}px` }}
            >
                <main className="max-w-[1440px] mx-auto px-4 md:px-6 space-y-4 mt-4">

                    <HeroMedico
                        medico={medico}
                        mesActual={mesActual}
                        puestoReal={puestoReal}
                        cargandoOdoo={cargandoOdoo}
                        googleMapsUrl={googleMapsUrl}
                    />

                    <HistorialVisitas visitas={historialVisitas} />

                    <SelectorPeriodo
                        periodoActivo={periodoActivo}
                        fechaDesdeActiva={fechaDesdeActiva}
                        fechaHastaActiva={fechaHastaActiva}
                        onCambiarPeriodo={handlePeriodoChange}
                        onPeriodoPersonalizado={handlePeriodoPersonalizado}
                    />

                    {/* ── VALIDACIÓN DE CARGA DIFERIDA DE ODOO ── */}
                    {cargandoOdoo ? (
                        /* INDICADOR DE CARGA SUTIL Y CORPORATIVO */
                        <div className="bg-white/80 backdrop-blur-md border border-blue-100 rounded-[28px] py-16 text-center shadow-sm flex flex-col items-center justify-center gap-3">
                            <FaSpinner className="text-2xl text-[#1C85E8] animate-spin" />
                            <div className="text-center">
                                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                    Sincronizando Odoo...
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    Trayendo montos financieros, laboratorios y listado de productos.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* VISTA COMPLETA CUANDO LLEGAN LOS DATOS */
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <ResumenFinanciero modo={modo} totales={totales} />

                            <LaboratoriosAcordeon
                                laboratoriosComprados={laboratoriosComprados}
                                laboratoriosFormulados={laboratoriosFormulados}
                                modo={modo}
                            />

                            <ListaProductos
                                cfg={cfg}
                                modo={modo}
                                listaVisible={listaVisible}
                                totalFiltrados={listaFiltrada.length}
                                busqueda={busqueda}
                                pagina={pagina}
                                porPagina={porPagina}
                            />
                        </div>
                    )}

                </main>

                <BarraNave />
            </div>
        </>
    );
};

export default DetallesTop;
