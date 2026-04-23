import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import BarraNave from './barranave';
import {
    FaArrowLeft,
    FaChevronLeft,
    FaChevronRight,
    FaCalendarDays,
    FaUserDoctor,
    FaXmark,
    FaCircleCheck,
    FaCircleXmark,
    FaClock,
    FaMagnifyingGlass
} from 'react-icons/fa6';

const CalendarioVisitas = ({ visitas = [], estadosDisponibles = [] }) => {
    // 1. Estados de UI
    const [modalAbierto, setModalAbierto] = useState(false);
    const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);
    const [search, setSearch] = useState('');

    // 2. Configuración Visual para los estados
    const configVisual = {
        'efectiva': { label: 'Efectiva', icon: <FaCircleCheck />, color: 'text-green-500' },
        'reprogramada': { label: 'Reprogramada', icon: <FaClock />, color: 'text-blue-500' },
        'cancelada': { label: 'Cancelada', icon: <FaCircleXmark />, color: 'text-red-500' },
        'No contactado': { label: 'No Contactado', icon: <FaXmark />, color: 'text-orange-500' },
        'programada': { label: 'Programada', icon: <FaClock />, color: 'text-gray-400' },
        'sin programar': { label: 'Sin Programar', icon: <FaClock />, color: 'text-gray-300' }
    };

    // 3. Formulario de Inertia
    const { data, setData, post, processing, reset } = useForm({
        estado: '',
        comentarios: '',
    });

    // 4. Lógica de Calendario
    const [fechaActual, setFechaActual] = useState(new Date());
    const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().getDate());

    const obtenerInicioSemana = (fecha) => {
        const d = new Date(fecha);
        const dia = d.getDay();
        const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const generarSemana = () => {
        const inicio = obtenerInicioSemana(fechaActual);
        return Array.from({ length: 7 }).map((_, i) => {
            const fecha = new Date(inicio);
            fecha.setDate(inicio.getDate() + i);
            return {
                nombre: fecha.toLocaleDateString('es-ES', { weekday: 'short' }),
                num: fecha.getDate(),
                fechaCompleta: fecha
            };
        });
    };

    const diasSemana = generarSemana();

    // 5. Funciones de Acción
    const abrirGestion = (visita) => {
        setVisitaSeleccionada(visita);
        setData({
            estado: visita.estado || '',
            comentarios: visita.comentarios || '',
        });
        setModalAbierto(true);
    };

    const enviarReporte = () => {
        post(route('visitas.marcarEfectiva', visitaSeleccionada.id), {
            preserveScroll: true,
            onSuccess: () => {
                setModalAbierto(false);
                reset();
            }
        });
    };

    // 6. Filtros
    const visitasFiltradas = visitas.filter(v => {
        const nombreMedico = `${v.medico.nombre} ${v.medico.apellido}`.toLowerCase();
        const coincideBusqueda = nombreMedico.includes(search.toLowerCase()) ||
            v.medico.especialidad.toLowerCase().includes(search.toLowerCase());

        const fechaVisita = new Date(v.fecha_programada);
        return coincideBusqueda &&
            fechaVisita.getDate() === diaSeleccionado &&
            fechaVisita.getMonth() === fechaActual.getMonth();
    });

    return (
        <div className="bg-[#F4F7FF] min-h-screen font-sans relative overflow-x-hidden text-gray-800">
            <Head title="Gestión de Visitas - LFH" />

            <div className={`transition-all duration-500 ${modalAbierto ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}>

                <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px] md:rounded-b-[35px]">
                    <div className="max-w-[1440px] mx-auto p-3 md:p-4">
                        <div className="flex items-center gap-3 md:gap-6">
                            <Link href={route('panel')} className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500 shrink-0 shadow-sm active:scale-90">
                                <FaArrowLeft className="text-xs" />
                            </Link>
                            <div className="relative flex-grow max-w-4xl">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                    <FaMagnifyingGlass className="text-[10px]" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar médico o especialidad..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-blue-50 border-none rounded-full py-2.5 pl-10 text-xs focus:ring-2 focus:ring-blue-300 outline-none font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="px-5 mt-4 space-y-4 pb-32">
                    {/* Calendario Semanal */}
                    <section className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setFechaActual(new Date(fechaActual.setDate(fechaActual.getDate() - 7)))} className="text-[#5D8BF4] p-1"><FaChevronLeft className="text-xs" /></button>
                                <h3 className="text-xs font-black text-gray-700 uppercase tracking-tighter w-28 text-center">
                                    {fechaActual.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </h3>
                                <button onClick={() => setFechaActual(new Date(fechaActual.setDate(fechaActual.getDate() + 7)))} className="text-[#5D8BF4] p-1"><FaChevronRight className="text-xs" /></button>
                            </div>

                            {/* CORRECCIÓN AQUÍ: Ahora el ícono tiene Link y acción */}
                            <Link
                                href={route('visitas.calendario')}
                                className="text-[#5D8BF4] text-lg p-1 active:scale-90 transition-transform"
                            >
                                <FaCalendarDays />
                            </Link>
                        </div>

                        <div className="flex justify-between gap-1">
                            {diasSemana.map((dia) => (
                                <button
                                    key={dia.fechaCompleta.toISOString()}
                                    onClick={() => setDiaSeleccionado(dia.num)}
                                    className={`flex flex-col items-center justify-center min-w-[42px] py-2 rounded-xl transition-all ${diaSeleccionado === dia.num ? 'bg-[#5D8BF4] text-white shadow-md' : 'bg-transparent text-gray-400'}`}
                                >
                                    <span className="text-[9px] font-bold uppercase mb-0.5">{dia.nombre.slice(0, 3)}</span>
                                    <span className="text-xs font-black">{dia.num}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Listado de Visitas */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Visitas del día</p>
                        {visitasFiltradas.length > 0 ? (
                            visitasFiltradas.map((visita) => (
                                <section
                                    key={visita.id}
                                    onClick={() => abrirGestion(visita)}
                                    className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex items-center justify-between active:scale-95 transition-transform cursor-pointer group hover:bg-blue-50/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 shadow-inner group-hover:bg-white transition-colors">
                                            <FaUserDoctor className="text-lg" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-800 leading-tight">{visita.medico.nombre} {visita.medico.apellido}</h4>
                                            <p className="text-[10px] text-gray-400 uppercase">
                                                {visita.medico.especialidad} • {new Date(visita.fecha_programada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm ${visita.estado === 'efectiva' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-[#5D8BF4]'}`}>
                                        {visita.estado || 'pendiente'}
                                    </span>
                                </section>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-[24px] border border-dashed border-gray-200">
                                <p className="text-xs text-gray-400 font-medium">No hay visitas para este día</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <BarraNave />

            {/* MODAL DE GESTIÓN */}
            {modalAbierto && visitaSeleccionada && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAbierto(false)} />

                    <div className="relative bg-white w-full max-w-md rounded-[35px] p-7 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 leading-none uppercase">Reportar Visita</h2>
                                <p className="text-[11px] text-blue-500 font-bold mt-1 uppercase">
                                    {visitaSeleccionada.medico.nombre} {visitaSeleccionada.medico.apellido}
                                </p>
                            </div>
                            <button onClick={() => setModalAbierto(false)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-400 active:rotate-90 transition-transform">
                                <FaXmark className="text-sm" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <section className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de la Visita</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {estadosDisponibles.map((estadoDb) => {
                                        const estilo = configVisual[estadoDb] || { label: estadoDb, icon: <FaCircleCheck />, color: 'text-gray-400' };
                                        return (
                                            <button
                                                key={estadoDb}
                                                type="button"
                                                onClick={() => setData('estado', estadoDb)}
                                                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all active:scale-[0.97] ${data.estado === estadoDb ? 'bg-blue-50/50 border-blue-500' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                            >
                                                <div className={`text-lg ${data.estado === estadoDb ? estilo.color : 'text-gray-300'}`}>
                                                    {estilo.icon}
                                                </div>
                                                <span className={`text-xs font-bold uppercase ${data.estado === estadoDb ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {estilo.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas y Observaciones</label>
                                <textarea
                                    value={data.comentarios}
                                    onChange={e => setData('comentarios', e.target.value)}
                                    placeholder="Escribe aquí los resultados de la visita..."
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs text-gray-800 shadow-inner focus:ring-1 focus:ring-blue-200 min-h-[110px] outline-none resize-none"
                                />
                            </section>

                            <button
                                onClick={enviarReporte}
                                disabled={!data.estado || processing}
                                className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all ${data.estado && !processing
                                    ? 'bg-[#5D8BF4] text-white shadow-lg active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {processing ? 'GUARDANDO REPORTE...' : 'FINALIZAR Y GUARDAR'}
                            </button>

                            <p className="text-[8px] text-center text-gray-400 uppercase font-bold tracking-tighter">
                                ID Visita: {visitaSeleccionada.id} • Programada: {new Date(visitaSeleccionada.fecha_programada).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarioVisitas;