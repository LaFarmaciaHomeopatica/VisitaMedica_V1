import React, { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameDay, getDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import BarraNave from './barranave';

import {
    FaPlus, FaXmark, FaCircleCheck, FaCircleXmark, FaClock,
    FaArrowLeft, FaVideo, FaUserDoctor, FaUsers,
    FaChevronRight, FaChevronLeft, FaMagnifyingGlass
} from 'react-icons/fa6';

const CalendarioVisitas = ({ visitas: visitasDB, doctores }) => {
    // --- ESTADOS DE NAVEGACIÓN ---
    const [mesActual, setMesActual] = useState(new Date());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [vistaSemanal, setVistaSemanal] = useState(false);
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [modalGestionAbierto, setModalGestionAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    // --- FORMULARIO PARA CREAR VISITA ---
    const { data, setData, post, processing, reset } = useForm({
        medico_id: '',
        fecha_programada: format(new Date(), 'yyyy-MM-dd'),
        hora: '08:00',
        modalidad: 'PRESENCIAL',
        tipo: 'VISITA'
    });

    // --- FORMULARIO PARA ACTUALIZAR ESTADO (Reporte) ---
    const formReporte = useForm({
        estado: '',
        comentarios: '',
    });

    const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);

    // --- PROCESAMIENTO DE VISITAS DE LA DB ---
    const visitas = useMemo(() => {
        return (visitasDB || []).map(v => ({
            ...v,
            // Convertimos el string de la DB a objeto Date de JS
            fecha: parseISO(v.fecha_programada),
            doctor: v.medico?.nombre || 'Médico no asignado'
        }));
    }, [visitasDB]);

    // --- FILTRADO POR BÚSQUEDA Y FECHA ---
    const visitasFiltradas = useMemo(() => {
        const query = busqueda.toLowerCase();
        return visitas.filter(v =>
            v.doctor.toLowerCase().includes(query) ||
            v.estado.toLowerCase().includes(query)
        );
    }, [busqueda, visitas]);

    const visitasDelDia = visitasFiltradas.filter(v => isSameDay(v.fecha, fechaSeleccionada));

    // --- ACCIONES ---
    const abrirGestion = (visita) => {
        setVisitaSeleccionada(visita);
        formReporte.setData('estado', visita.estado);
        setModalGestionAbierto(true);
    };

    const enviarNuevaVisita = (e) => {
        e.preventDefault();
        // Combinamos fecha y hora para la DB
        post(route('visitas.store'), {
            onSuccess: () => {
                setModalNuevoAbierto(false);
                reset();
            }
        });
    };

    const actualizarEstado = (id) => {
        formReporte.post(route('visitas.marcarEfectiva', id), {
            onSuccess: () => setModalGestionAbierto(false)
        });
    };

    const navegarSiguiente = () => vistaSemanal ? setMesActual(addWeeks(mesActual, 1)) : setMesActual(addMonths(mesActual, 1));
    const navegarAnterior = () => vistaSemanal ? setMesActual(subWeeks(mesActual, 1)) : setMesActual(subMonths(mesActual, 1));

    const diasAMostrar = useMemo(() => {
        const opciones = { weekStartsOn: 1 };
        const inicio = vistaSemanal ? startOfWeek(mesActual, opciones) : startOfMonth(mesActual);
        const fin = vistaSemanal ? endOfWeek(mesActual, opciones) : endOfMonth(mesActual);
        return eachDayOfInterval({ start: inicio, end: fin });
    }, [mesActual, vistaSemanal]);

    const diaInicioSemana = getDay(startOfMonth(mesActual));

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'efectiva': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
            case 'programada': return 'bg-amber-50 border-amber-100 text-amber-600';
            case 'no_contactado': return 'bg-rose-50 border-rose-100 text-rose-600';
            case 'reprogramada': return 'bg-blue-50 border-blue-100 text-blue-600';
            default: return 'bg-gray-50 border-gray-100 text-gray-600';
        }
    };

    const overlayVisible = modalNuevoAbierto || modalGestionAbierto;

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-32 font-sans text-gray-800 relative overflow-x-hidden">
            <Head title="Mi Agenda - LFH" />

            {/* BOTÓN FLOTANTE NUEVA VISITA */}
            {!overlayVisible && (
                <button
                    onClick={() => setModalNuevoAbierto(true)}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-[#5D8BF4] text-white rounded-2xl shadow-lg z-40 flex items-center justify-center hover:scale-110 transition-all"
                >
                    <FaPlus className="text-xl" />
                </button>
            )}

            {/* MODAL GESTIONAR VISITA (REPORTE) */}
            {modalGestionAbierto && visitaSeleccionada && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalGestionAbierto(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[35px] p-7 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-lg font-black uppercase text-gray-900">Gestionar Visita</h2>
                        <p className="text-xs text-blue-500 font-bold mb-6">{visitaSeleccionada.doctor}</p>

                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resultado de la visita</label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'efectiva', label: 'Efectiva', icon: FaCircleCheck, color: 'text-green-500' },
                                    { id: 'no_contactado', label: 'No contactado', icon: FaCircleXmark, color: 'text-orange-500' },
                                    { id: 'reprogramada', label: 'Reprogramar', icon: FaClock, color: 'text-blue-500' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => formReporte.setData('estado', opt.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${formReporte.data.estado === opt.id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                    >
                                        <opt.icon className={`text-lg ${formReporte.data.estado === opt.id ? opt.color : 'text-gray-300'}`} />
                                        <span className="text-xs font-bold">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => actualizarEstado(visitaSeleccionada.id)}
                                disabled={formReporte.processing}
                                className="w-full py-4 bg-[#5D8BF4] text-white rounded-2xl font-black text-[10px] tracking-widest mt-4"
                            >
                                {formReporte.processing ? 'GUARDANDO...' : 'FINALIZAR REPORTE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CREAR NUEVA VISITA */}
            {modalNuevoAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalNuevoAbierto(false)} />
                    <form onSubmit={enviarNuevaVisita} className="relative bg-white w-full max-w-md rounded-[35px] p-7 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-lg font-black uppercase mb-4">Programar Visita</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar Doctor</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1"
                                    value={data.medico_id}
                                    onChange={e => setData('medico_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Elige un médico --</option>
                                    {doctores.map(doc => <option key={doc.id} value={doc.id}>{doc.nombre}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fecha</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold"
                                        value={data.fecha_programada}
                                        onChange={e => setData('fecha_programada', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Modalidad</label>
                                    <select
                                        className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold"
                                        value={data.modalidad}
                                        onChange={e => setData('modalidad', e.target.value)}
                                    >
                                        <option value="PRESENCIAL">Presencial</option>
                                        <option value="VIRTUAL">Virtual</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-[#5D8BF4] text-white rounded-2xl py-4 text-[10px] font-black tracking-widest shadow-lg"
                            >
                                {processing ? 'PROCESANDO...' : 'GUARDAR EN AGENDA'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className={`${overlayVisible ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : 'blur-0'} transition-all duration-500`}>

                <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px]">
                    <div className="max-w-[1440px] mx-auto p-4 flex items-center gap-4">
                        <Link href={route('visitas.index')} className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500">
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        <div className="relative flex-grow">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar en mi agenda..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-blue-50 border-none rounded-full py-2.5 pl-12 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                        </div>

                        <button
                            onClick={() => setVistaSemanal(!vistaSemanal)}
                            className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase transition-all border ${vistaSemanal ? 'bg-[#5D8BF4] text-white' : 'bg-white text-gray-400'}`}
                        >
                            {vistaSemanal ? 'Mes' : 'Semana'}
                        </button>
                    </div>
                </header>

                <main className="px-6 mt-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LISTA DE ACTIVIDADES DEL DÍA SELECCIONADO */}
                    <section className="lg:col-span-5 space-y-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                            {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
                        </h3>
                        <div className="space-y-3">
                            {visitasDelDia.length > 0 ? (
                                visitasDelDia.map(v => (
                                    <button key={v.id} onClick={() => abrirGestion(v)} className={`w-full p-5 rounded-[28px] border-2 flex items-center justify-between transition-all hover:scale-[1.02] ${obtenerColorEstado(v.estado)}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm relative text-blue-500">
                                                <FaUserDoctor className="text-lg" />
                                                {v.modalidad === 'VIRTUAL' && <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-white"><FaVideo /></div>}
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-black uppercase">{v.doctor}</h4>
                                                <p className="text-[9px] font-bold uppercase opacity-60">{v.estado} • {v.modalidad}</p>
                                            </div>
                                        </div>
                                        <FaChevronRight className="opacity-30 text-xs" />
                                    </button>
                                ))
                            ) : (
                                <div className="bg-white/40 border-2 border-dashed border-gray-100 rounded-[28px] py-12 text-center text-gray-400 text-[11px] italic">Sin actividades para este día.</div>
                            )}
                        </div>
                    </section>

                    {/* CALENDARIO VISUAL */}
                    <section className="lg:col-span-7 bg-white shadow-sm p-8 rounded-[32px]">
                        <div className="flex justify-between items-center mb-8 px-2">
                            <button onClick={navegarAnterior} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400"><FaChevronLeft /></button>
                            <h2 className="font-extrabold capitalize text-gray-800">{format(mesActual, 'MMMM yyyy', { locale: es })}</h2>
                            <button onClick={navegarSiguiente} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400"><FaChevronRight /></button>
                        </div>

                        <div className="grid grid-cols-7 gap-3 text-center">
                            {['L', 'M', 'MI', 'J', 'V', 'S', 'D'].map(d => (
                                <span key={d} className="text-[10px] font-bold text-gray-300 mb-4 uppercase">{d}</span>
                            ))}
                            {!vistaSemanal && [...Array(diaInicioSemana === 0 ? 6 : diaInicioSemana - 1)].map((_, i) => <div key={i} />)}
                            {diasAMostrar.map((dia, idx) => {
                                const tieneVisita = visitas.some(v => isSameDay(v.fecha, dia));
                                const seleccionado = isSameDay(dia, fechaSeleccionada);

                                let claseDia = 'bg-gray-50 text-gray-400';
                                if (tieneVisita) claseDia = 'bg-blue-100 text-[#5D8BF4] font-bold';
                                if (seleccionado) claseDia = 'bg-[#5D8BF4] text-white shadow-md scale-110 z-10';

                                return (
                                    <button key={idx} onClick={() => setFechaSeleccionada(dia)} className={`aspect-square flex items-center justify-center rounded-xl text-[11px] transition-all ${claseDia}`}>
                                        {format(dia, 'd')}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </main>
            </div>

            <BarraNave />
        </div>
    );
};

export default CalendarioVisitas;