import React, { useState, useMemo } from 'react';
import { Link, usePage, Head, router } from '@inertiajs/react';
import BarraNave from './barranave';
import {
    FaMagnifyingGlass,
    FaUserTie,
    FaPowerOff,
    FaCheckDouble,
    FaStethoscope,
    FaLocationDot,
    FaChevronRight,
    FaCalendarCheck
} from 'react-icons/fa6';

const DashboardLFH = ({ visitador = {}, medicos = [], visitasData = [] }) => {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');

    const visitadorInfo = visitador || {};
    const rolActual = auth?.user?.rol_nombre || 'Visitador';

    // 📊 Cálculos métricos usando los datos inyectados por Inertia
    const { visitadosHoy, pendientesHoy, porcentaje, idsVisitadosHoy, meta } = useMemo(() => {
        // Formato YYYY-MM-DD local
        const hoy = new Date();
        const de = hoy.getDate().toString().padStart(2, '0');
        const ma = (hoy.getMonth() + 1).toString().padStart(2, '0');
        const ye = hoy.getFullYear();
        const hoyStr = `${ye}-${ma}-${de}`;

        const visitasEfectivasMes = visitasData.filter(v => v.estado === 'efectiva');

        // Filtrar las visitas efectivas de hoy
        const idsHoy = visitasData
            .filter(v => v.fecha_programada && v.fecha_programada.startsWith(hoyStr) && v.estado === 'efectiva')
            .map(v => v.medico_id);

        const visitadosHoyCount = medicos.filter(m => idsHoy.includes(m.id)).length;
        const pendientesCount = medicos.length - visitadosHoyCount;

        const metaValor = visitadorInfo?.meta_visitas_mensual || 0;
        const calculoPorcentaje = metaValor > 0 ? Math.round((visitasEfectivasMes.length / metaValor) * 100) : 0;

        return {
            visitadosHoy: visitadosHoyCount,
            pendientesHoy: pendientesCount,
            porcentaje: calculoPorcentaje,
            idsVisitadosHoy: idsHoy, // 👈 Se mantiene consistente en español
            meta: metaValor
        };
    }, [visitasData, medicos, visitadorInfo]);

    // 🔥 CORREGIDO: Ahora usa 'idsVisitadosHoy' de forma correcta
    const fueVisitado = (medicoId) => idsVisitadosHoy.includes(medicoId);

    // 🔍 Filtrado reactivo controlando posibles valores nulos en la DB
    const medicosFiltrados = medicos.filter(m => {
        const nombre = m.nombre ? m.nombre.toLowerCase() : '';
        const apellido = m.apellido ? m.apellido.toLowerCase() : '';
        const especialidad = m.especialidad ? m.especialidad.toLowerCase() : '';
        const termino = search.toLowerCase();

        return nombre.includes(termino) || apellido.includes(termino) || especialidad.includes(termino);
    });

    // Redirección inteligente al módulo de gestión de visitas
    const irAAgendarVisita = (medicoId) => {
        router.get('/MisVisitas', { medico_id: medicoId });
    };

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-24 font-sans text-gray-800">
            <Head title="Dashboard - LFH" />

            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[30px] md:rounded-b-[40px]">
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">
                        <div className="hidden md:flex flex-col min-w-0">
                            <h1 className="text-xs md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
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
                                className="w-full bg-blue-50 border-none rounded-full py-3 pl-12 pr-12 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-[#EBF2FF] p-8 rounded-b-[40px] max-w-5xl mx-auto shadow-inner border-x border-b border-blue-100 relative">
                {pendientesHoy > 0 && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-2xl text-xs font-bold shadow-md">
                        Pendientes: {pendientesHoy}
                    </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-blue-100">
                            <FaUserTie className="text-[#5D8BF4] text-2xl" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-[#5D8BF4] text-white text-[8px] font-bold px-2 py-1 rounded-full border border-white uppercase">
                            {rolActual}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 leading-tight">
                            Bienvenido, <br />
                            <span className="text-[#5D8BF4] capitalize">
                                {auth?.user?.nombre} {auth?.user?.apellido}
                            </span>
                        </h1>
                    </div>
                </div>

                {/* Cumplimiento Mensual */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 mt-4">
                    <div className="flex justify-between items-end mb-1.5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                            Cumplimiento Mensual
                        </p>
                        <span className="text-blue-600 font-bold text-sm">{porcentaje}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-[11px] mt-2 text-gray-500 font-medium">
                        <span>{visitasData.filter(v => v.estado === 'efectiva').length} de {meta} visitas</span>
                        <span>Meta Ventas: ${new Intl.NumberFormat().format(visitadorInfo?.meta_ventas_mensual || 0)}</span>
                    </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 mt-6">
                    <Link
                        href="/MisVisitas"
                        className="bg-[#5D8BF4] text-white px-6 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-200/50 text-xs font-bold uppercase tracking-wide"
                    >
                        <FaCalendarCheck /> Agenda y Visitas
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="bg-white text-red-500 px-6 py-2 rounded-2xl border border-red-100 flex items-center gap-2 whitespace-nowrap shadow-sm text-xs font-bold uppercase tracking-wide"
                    >
                        <FaPowerOff /> Salir
                    </Link>
                </div>
            </section>

            {/* Listado de Médicos */}
            <main className="max-w-5xl mx-auto px-4 mt-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-500 px-1 uppercase tracking-wider">
                    Médicos en mi Agenda ({medicosFiltrados.length})
                </h3>
                
                {medicosFiltrados.map((medico) => {
                    const visitado = fueVisitado(medico.id);
                    return (
                        <div key={medico.id} className="bg-white p-4 rounded-2xl flex gap-4 items-center shadow-sm border border-gray-50">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-xl 
                                ${visitado ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                                {visitado ? <FaCheckDouble size={20} /> : <FaStethoscope size={20} />}
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm leading-tight">{medico.nombre} {medico.apellido}</h4>
                                <p className="text-xs text-blue-500 font-medium mb-1">{medico.especialidad || 'General'}</p>
                                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                    <FaLocationDot />
                                    {medico.direccion || 'Dirección no especificada'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {!visitado ? (
                                    <button
                                        onClick={() => irAAgendarVisita(medico.id)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                                    >
                                        Gestionar
                                    </button>
                                ) : (
                                    <span className="text-[10px] font-bold text-green-500 uppercase bg-green-50 px-2 py-1 rounded-md">Visitado</span>
                                )}

                                <Link
                                    href={`/MedicoDetalle/${medico.id}`}
                                    className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-blue-500 transition-colors"
                                >
                                    <FaChevronRight />
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {medicosFiltrados.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm italic">
                        No se encontraron médicos asignados.
                    </div>
                )}
            </main>

            <BarraNave />
        </div>
    );
};

export default DashboardLFH;