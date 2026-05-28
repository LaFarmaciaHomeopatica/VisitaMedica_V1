import React, { useState, useMemo } from 'react';
import { Link, usePage, Head, router } from '@inertiajs/react';
import BarraNave from './barranave';
import {
    FaMagnifyingGlass,
    FaPowerOff,
    FaCheckDouble,
    FaStethoscope,
    FaLocationDot,
    FaChevronRight,
    FaCalendarCheck
} from 'react-icons/fa6';

const DashboardLFH = ({ visitador = {}, medicos = [], visitasData = [], ventasActuales = 0 }) => {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');

    const visitadorInfo = visitador || {};

    // ✅ metas llega como objeto directo desde el backend
    const metaActual      = visitadorInfo?.metas || null;
    const metaValorGlobal = metaActual?.meta_visitas || 0;
    const metaDinero      = Number(metaActual?.meta_dinero) || 0;

    // 📊 Cálculos métricos
    const { visitadosHoy, pendientesHoy, porcentaje, idsVisitadosHoy, meta } = useMemo(() => {
        const hoy = new Date();
        const de = hoy.getDate().toString().padStart(2, '0');
        const ma = (hoy.getMonth() + 1).toString().padStart(2, '0');
        const ye = hoy.getFullYear();
        const hoyStr = `${ye}-${ma}-${de}`;

        const visitasEfectivasMes = visitasData.filter(v => v.estado === 'efectiva');

        const idsHoy = visitasData
            .filter(v => v.fecha_programada && v.fecha_programada.startsWith(hoyStr) && v.estado === 'efectiva')
            .map(v => v.medico_id);

        const visitadosHoyCount = medicos.filter(m => idsHoy.includes(m.id)).length;
        const pendientesCount   = medicos.length - visitadosHoyCount;

        const calculoPorcentaje = metaValorGlobal > 0
            ? Math.round((visitasEfectivasMes.length / metaValorGlobal) * 100)
            : 0;

        return {
            visitadosHoy:    visitadosHoyCount,
            pendientesHoy:   pendientesCount,
            porcentaje:      calculoPorcentaje,
            idsVisitadosHoy: idsHoy,
            meta:            metaValorGlobal,
        };
    }, [visitasData, medicos, metaValorGlobal]);

    // ✅ Porcentaje de ventas
    const porcentajeVentas = metaDinero > 0
        ? Math.round((ventasActuales / metaDinero) * 100)
        : 0;

    const fueVisitado = (medicoId) => idsVisitadosHoy.includes(medicoId);

    // 🔍 Filtrado reactivo
    const medicosFiltrados = medicos.filter(m => {
        const nombre      = m.nombre      ? m.nombre.toLowerCase()      : '';
        const apellido    = m.apellido    ? m.apellido.toLowerCase()    : '';
        const especialidad = m.especialidad ? m.especialidad.toLowerCase() : '';
        const termino     = search.toLowerCase();
        return nombre.includes(termino) || apellido.includes(termino) || especialidad.includes(termino);
    });

    const irAAgendarVisita = (medicoId) => {
        router.get('/MisVisitas', { medico_id: medicoId });
    };

    return (
        <div className="bg-[#E5F4FF] min-h-screen pb-24 font-sans text-gray-800">
            <Head title="Dashboard - LFH" />

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20">
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden md:flex flex-col min-w-0">
                            <h1 className="text-xs md:text-sm font-black text-[#1C85E8] uppercase tracking-wider whitespace-nowrap">
                                Panel de Control
                            </h1>
                        </div>

                        {/* Barra de Búsqueda */}
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

            {/* Hero Section - Gradient Background matching reference */}
            <section className="bg-gradient-to-br from-[#1C85E8] via-[#02CFE3] to-[#24C765] p-8 rounded-b-[40px] max-w-5xl mx-auto shadow-lg relative text-white border-none">
                <div className="flex items-center gap-4 mb-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80 leading-none mb-1">LFH Portal</p>
                        <h1 className="text-2xl font-bold text-white leading-tight">
                            Bienvenido, <br />
                            <span className="text-white font-extrabold capitalize drop-shadow-sm">
                                {auth?.user?.nombre} {auth?.user?.apellido}
                            </span>
                        </h1>
                    </div>
                </div>

                {/* Cumplimiento Mensual - Frosted Glassmorphism Card */}
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50 mt-4 text-slate-800">

                    {/* — Barra de visitas — */}
                    <div className="flex justify-between items-end mb-1.5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                            Cumplimiento de visitas
                        </p>
                        <span className="text-[#1C85E8] font-black text-sm">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-gray-100/70 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] h-3 rounded-full transition-all duration-700 ease-out shadow-inner"
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] mt-1.5 text-gray-500 font-semibold mb-5">
                        <span>{visitasData.filter(v => v.estado === 'efectiva').length} de {meta} visitas</span>
                        <span className="uppercase text-[9px] tracking-wider text-gray-400">Meta mes</span>
                    </div>

                    {/* — Barra de ventas — */}
                    <div className="border-t border-gray-100/80 pt-4">
                        <div className="flex justify-between items-end mb-1.5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                                Cumplimiento de ventas
                            </p>
                            <span className="text-[#24C765] font-black text-sm">{porcentajeVentas}%</span>
                        </div>
                        <div className="w-full bg-gray-100/70 h-3 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-[#02CFE3] to-[#24C765] h-3 rounded-full transition-all duration-700 ease-out shadow-inner"
                                style={{ width: `${Math.min(porcentajeVentas, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] mt-1.5 text-gray-500 font-semibold">
                            <span>${new Intl.NumberFormat('es-CO').format(ventasActuales)} vendidos</span>
                            <span>Meta: ${new Intl.NumberFormat('es-CO').format(metaDinero)}</span>
                        </div>
                    </div>

                </div>

                {/* Frosted glass action buttons inside hero */}
                <div className="flex gap-3 overflow-x-auto pb-2 mt-6">
                    <Link
                        href="/MisVisitas"
                        className="bg-white/20 hover:bg-white/35 backdrop-blur-md text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 whitespace-nowrap shadow-lg border border-white/20 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                    >
                        <FaCalendarCheck /> Agenda y Visitas
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white px-6 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2 whitespace-nowrap shadow-md text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                    >
                        <FaPowerOff /> Salir
                    </Link>
                </div>
            </section>

            {/* Listado de Médicos */}
            <main className="max-w-5xl mx-auto px-4 mt-6 space-y-4">
                <h3 className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest">
                    Médicos en mi Agenda ({medicosFiltrados.length})
                </h3>

                {medicosFiltrados.map((medico) => {
                    const visitado = fueVisitado(medico.id);
                    return (
                        <div key={medico.id} className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] flex gap-4 items-center shadow-sm border border-white/40 hover:shadow-md transition-shadow duration-300">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors
                                ${visitado ? 'bg-[#24C765]/10 text-[#24C765]' : 'bg-[#1C85E8]/10 text-[#1C85E8]'}`}>
                                {visitado ? <FaCheckDouble size={18} /> : <FaStethoscope size={18} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                                    {medico.nombre} {medico.apellido}
                                </h4>
                                <p className="text-xs text-[#1C85E8] font-bold uppercase tracking-tight mt-0.5">
                                    {medico.especialidad || 'General'}
                                </p>
                                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                                    <FaLocationDot className="text-slate-300 shrink-0" />
                                    {medico.direccion_detalles || medico.direccion || 'Dirección no registrada'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {!visitado ? (
                                    <button
                                        onClick={() => irAAgendarVisita(medico.id)}
                                        className="bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] hover:from-[#156DBF] hover:to-[#02B2C4] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-blue-100 hover:scale-105 active:scale-95"
                                    >
                                        Gestionar
                                    </button>
                                ) : (
                                    <span className="text-[9px] font-black text-[#24C765] uppercase bg-[#24C765]/10 px-2.5 py-1.5 rounded-lg border border-[#24C765]/20">
                                        Visitado
                                    </span>
                                )}

                                <Link
                                    href={`/MedicoDetalle/${medico.id}`}
                                    className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all active:scale-90"
                                >
                                    <FaChevronRight className="text-xs" />
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {medicosFiltrados.length === 0 && (
                    <div className="text-center py-16 bg-white/50 rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                        No se encontraron médicos asignados.
                    </div>
                )}
            </main>

            <BarraNave />
        </div>
    );
};

export default DashboardLFH;