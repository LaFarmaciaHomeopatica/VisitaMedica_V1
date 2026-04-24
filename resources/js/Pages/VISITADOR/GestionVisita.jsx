import React, { useState, useMemo } from 'react';
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
    FaMagnifyingGlass,
    FaPlus
} from 'react-icons/fa6';

const CalendarioVisitas = ({ visitas = [], estadosDisponibles = [], medicosDisponibles = [] }) => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);
    const [search, setSearch] = useState('');
    const [fechaActual, setFechaActual] = useState(new Date());

    const configVisual = {
        'efectiva': { label: 'Efectiva', icon: <FaCircleCheck />, color: 'text-green-500' },
        'reprogramada': { label: 'Reprogramada', icon: <FaClock />, color: 'text-blue-500' },
        'cancelada': { label: 'Cancelada', icon: <FaCircleXmark />, color: 'text-red-500' },
        'No contactado': { label: 'No Contactado', icon: <FaXmark />, color: 'text-orange-500' },
        'programada': { label: 'Programada', icon: <FaClock />, color: 'text-gray-400' },
        'sin programar': { label: 'Sin Programar', icon: <FaClock />, color: 'text-gray-300' }
    };

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        medico_id: '',
        fecha_programada: '',
        fecha_realizada: '',
        estado: '',
        comentarios: '',
    });

    const cambiarDia = (offset) => {
        const nuevaFecha = new Date(fechaActual);
        nuevaFecha.setDate(nuevaFecha.getDate() + offset);
        setFechaActual(nuevaFecha);
    };

    const diasSemana = useMemo(() => {
        const d = new Date(fechaActual);
        const diaSem = d.getDay();
        const diff = d.getDate() - diaSem + (diaSem === 0 ? -6 : 1);
        const inicio = new Date(d.setDate(diff));

        return Array.from({ length: 7 }).map((_, i) => {
            const f = new Date(inicio);
            f.setDate(inicio.getDate() + i);
            return {
                nombre: f.toLocaleDateString('es-ES', { weekday: 'short' }),
                num: f.getDate(),
                fechaCompleta: f
            };
        });
    }, [fechaActual]);

    const visitasFiltradas = visitas.filter(v => {
        const nombreMedico = v.medico ? `${v.medico.nombre} ${v.medico.apellido}`.toLowerCase() : '';
        const especialidad = v.medico?.especialidad?.toLowerCase() || '';
        const coincideBusqueda = nombreMedico.includes(search.toLowerCase()) || especialidad.includes(search.toLowerCase());

        if (!v.fecha_programada) return false;

        const fechaV = new Date(v.fecha_programada.replace(/-/g, '/'));
        return coincideBusqueda &&
            fechaV.getDate() === fechaActual.getDate() &&
            fechaV.getMonth() === fechaActual.getMonth() &&
            fechaV.getFullYear() === fechaActual.getFullYear();
    });

    const abrirGestion = (visita) => {
        setVisitaSeleccionada(visita);
        clearErrors();
        setData({
            estado: visita.estado || '',
            comentarios: visita.comentarios || '',
            medico_id: visita.medico_id || '',
            fecha_programada: visita.fecha_programada || '',
            fecha_realizada: visita.fecha_realizada || ''
        });
        setModalAbierto(true);
    };

    const abrirNuevo = () => {
        setVisitaSeleccionada(null);
        clearErrors();
        reset();
        setModalAbierto(true);
    };

    const enviarReporte = () => {
        const url = visitaSeleccionada
            ? route('visitas.marcarEfectiva', visitaSeleccionada.id)
            : route('visitas.store');

        post(url, {
            preserveScroll: true,
            onSuccess: () => {
                setModalAbierto(false);
                reset();
            }
        });
    };

    return (
        <div className="bg-[#F4F7FF] min-h-screen font-sans relative overflow-x-hidden text-gray-800">
            <Head title="Gestión de Visitas - LFH" />

            <div className={`transition-all duration-500 ${modalAbierto ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : ''}`}>
                <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px]">
                    <div className="max-w-[1440px] mx-auto p-3 md:p-4">
                        <div className="flex items-center gap-3">
                            <Link href={route('panel')} className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500 active:scale-90">
                                <FaArrowLeft className="text-xs" />
                            </Link>
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                    <FaMagnifyingGlass className="text-[10px]" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar médico o especialidad..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-blue-50 border-none rounded-full py-2.5 pl-10 text-xs focus:ring-2 focus:ring-blue-300 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="px-5 mt-4 space-y-4 pb-32">
                    <section className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                <button onClick={() => cambiarDia(-7)} className="text-[#5D8BF4] p-1.5 active:scale-75"><FaChevronLeft className="text-[10px]" /></button>
                                <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-tighter w-24 text-center">
                                    {fechaActual.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </h3>
                                <button onClick={() => cambiarDia(7)} className="text-[#5D8BF4] p-1.5 active:scale-75"><FaChevronRight className="text-[10px]" /></button>
                            </div>

                            <div className="flex items-center bg-blue-50 rounded-full p-1 gap-1">
                                <button onClick={() => cambiarDia(-1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-full text-[#5D8BF4] shadow-sm active:scale-90">
                                    <FaChevronLeft className="text-[9px]" />
                                </button>
                                <Link
                                    href={route('visitas.calendario')}
                                    className="w-8 h-8 flex items-center justify-center text-[#5D8BF4] active:scale-90"
                                >
                                    <FaCalendarDays className="text-sm" />
                                </Link>
                                <button onClick={() => cambiarDia(1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-full text-[#5D8BF4] shadow-sm active:scale-90">
                                    <FaChevronRight className="text-[9px]" />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between gap-1">
                            {diasSemana.map((dia) => {
                                const esActivo = dia.num === fechaActual.getDate() && dia.fechaCompleta.getMonth() === fechaActual.getMonth();
                                return (
                                    <button
                                        key={dia.fechaCompleta.toISOString()}
                                        onClick={() => setFechaActual(dia.fechaCompleta)}
                                        className={`flex flex-col items-center justify-center min-w-[42px] py-2 rounded-xl transition-all ${esActivo ? 'bg-[#5D8BF4] text-white shadow-md scale-105' : 'bg-transparent text-gray-400'}`}
                                    >
                                        <span className="text-[9px] font-bold uppercase mb-0.5">{dia.nombre.slice(0, 3)}</span>
                                        <span className="text-xs font-black">{dia.num}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Visitas del día</p>
                        {visitasFiltradas.length > 0 ? (
                            visitasFiltradas.map((visita) => (
                                <section
                                    key={visita.id}
                                    onClick={() => abrirGestion(visita)}
                                    className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex items-center justify-between active:scale-95 transition-transform cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 shadow-inner group-hover:bg-white transition-colors">
                                            <FaUserDoctor className="text-lg" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-800 leading-tight">
                                                {visita.medico?.nombre} {visita.medico?.apellido}
                                            </h4>
                                            <p className="text-[10px] text-gray-400 uppercase">
                                                {visita.medico?.especialidad} • {visita.fecha_programada.split(' ')[1].substring(0, 5)}
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

            <button
                onClick={abrirNuevo}
                className="fixed bottom-24 right-6 w-14 h-14 bg-[#5D8BF4] text-white rounded-full shadow-2xl flex items-center justify-center text-xl active:scale-90 transition-transform z-50 border-4 border-white"
            >
                <FaPlus />
            </button>

            <BarraNave />

            {modalAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAbierto(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[35px] p-7 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 leading-none uppercase">
                                    {visitaSeleccionada ? 'Reportar Visita' : 'Nueva Visita'}
                                </h2>
                                {visitaSeleccionada && (
                                    <p className="text-[11px] text-blue-500 font-bold mt-1 uppercase">
                                        {visitaSeleccionada.medico?.nombre} {visitaSeleccionada.medico?.apellido}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setModalAbierto(false)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">
                                <FaXmark className="text-sm" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            {!visitaSeleccionada && (
                                <>
                                    <section className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Médico</label>
                                        <select
                                            value={data.medico_id}
                                            onChange={e => setData('medico_id', e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-200"
                                        >
                                            <option value="">Seleccionar Médico</option>
                                            {medicosDisponibles.map(m => (
                                                <option key={m.id} value={m.id}>{m.nombre} {m.apellido} - {m.especialidad}</option>
                                            ))}
                                        </select>
                                        {errors.medico_id && <p className="text-red-500 text-[10px] ml-1">{errors.medico_id}</p>}
                                    </section>

                                    <section className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha y Hora Programada</label>
                                        <input
                                            type="datetime-local"
                                            value={data.fecha_programada}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setData(prev => ({
                                                    ...prev,
                                                    fecha_programada: val,
                                                    fecha_realizada: val
                                                }));
                                            }}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-3 text-xs text-gray-800 outline-none"
                                        />
                                        {errors.fecha_programada && <p className="text-red-500 text-[10px] ml-1">{errors.fecha_programada}</p>}
                                    </section>
                                </>
                            )}

                            <section className="space-y-2">
                                <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1">
                                    Fecha y Hora de la Gestión
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.fecha_realizada}
                                    onChange={e => setData('fecha_realizada', e.target.value)}
                                    className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-3 text-xs text-gray-800 outline-none focus:border-blue-300"
                                />
                                {errors.fecha_realizada && <p className="text-red-500 text-[10px] ml-1">{errors.fecha_realizada}</p>}
                                <p className="text-[9px] text-gray-400 italic ml-1">* Obligatorio para el reporte de efectividad.</p>
                            </section>

                            <section className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de la Visita</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {estadosDisponibles.map((estadoDb) => {
                                        const estilo = configVisual[estadoDb] || { label: estadoDb, icon: <FaCircleCheck />, color: 'text-gray-400' };
                                        return (
                                            <button
                                                key={estadoDb}
                                                type="button"
                                                onClick={() => setData('estado', estadoDb)}
                                                className={`flex items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${data.estado === estadoDb ? 'bg-blue-50/50 border-blue-500' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                            >
                                                <div className={`text-sm ${data.estado === estadoDb ? estilo.color : 'text-gray-300'}`}>
                                                    {estilo.icon}
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase ${data.estado === estadoDb ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {estilo.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.estado && <p className="text-red-500 text-[10px] ml-1">{errors.estado}</p>}
                            </section>

                            <section className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas y Observaciones</label>
                                <textarea
                                    value={data.comentarios}
                                    onChange={e => setData('comentarios', e.target.value)}
                                    placeholder="Escribe aquí los resultados..."
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs text-gray-800 shadow-inner focus:ring-1 focus:ring-blue-200 min-h-[90px] outline-none resize-none"
                                />
                                {errors.comentarios && <p className="text-red-500 text-[10px] ml-1">{errors.comentarios}</p>}
                            </section>

                            <button
                                onClick={enviarReporte}
                                disabled={processing}
                                className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all ${!processing
                                    ? 'bg-[#5D8BF4] text-white shadow-lg active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {processing ? 'GUARDANDO...' : 'FINALIZAR Y GUARDAR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarioVisitas;