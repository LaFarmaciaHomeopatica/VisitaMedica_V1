import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameDay, getDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks
} from 'date-fns';
import { es } from 'date-fns/locale';
import BarraNave from './barranave';

import {
    FaPlus,
    FaXmark,
    FaCircleCheck,
    FaCircleXmark,
    FaClock,
    FaArrowLeft,
    FaVideo,
    FaUserDoctor,
    FaUsers,
    FaChevronRight,
    FaChevronLeft,
    FaMagnifyingGlass // Icono para la búsqueda
} from 'react-icons/fa6';

const CalendarioVisitas = () => {
    // --- ESTADOS EXISTENTES ---
    const [mesActual, setMesActual] = useState(new Date());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [vistaSemanal, setVistaSemanal] = useState(false);
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [modalGestionAbierto, setModalGestionAbierto] = useState(false);
    const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);
    const [estadoReporte, setEstadoReporte] = useState('');
    const [horaInicio, setHoraInicio] = useState('08:00');
    const [horaFin, setHoraFin] = useState('09:00');

    // --- NUEVO ESTADO PARA BÚSQUEDA ---
    const [busqueda, setBusqueda] = useState('');

    const [nuevoEvento, setNuevoEvento] = useState({
        tipo: 'VISITA',
        modalidad: 'PRESENCIAL',
        detalles: '',
        doctor_id: '',
        nombre_otro: '',
        hora_inicio: '08:00',
        hora_fin: '09:00'
    });

    const [doctores] = useState([
        { id: 1, nombre: "Dr. Amit Kumar" },
        { id: 2, nombre: "Dra. Maria Lopez" },
        { id: 3, nombre: "Dr. Carlos Ruiz" },
        { id: 4, nombre: "Dra. Elena Gomez" }
    ]);

    const [visitas] = useState([
        { id: 1, fecha: new Date(2026, 3, 10), doctor: "Dr. Amit Kumar", estado: 'completada', tipo: 'VISITA', modalidad: 'PRESENCIAL' },
        { id: 2, fecha: new Date(2026, 3, 14), doctor: "Dra. Maria Lopez", estado: 'pendiente', tipo: 'VISITA', modalidad: 'VIRTUAL' },
        { id: 3, fecha: new Date(2026, 3, 14), doctor: "Reunión de Ventas", estado: 'cancelada', tipo: 'REUNION', modalidad: 'PRESENCIAL' },
        { id: 4, fecha: new Date(2026, 3, 16), doctor: "Dr. Carlos Ruiz", estado: 'pendiente', tipo: 'VISITA', modalidad: 'PRESENCIAL' },
    ]);

    const abrirGestion = (visita) => {
        setVisitaSeleccionada(visita);
        setEstadoReporte(visita.estado === 'completada' ? 'efectiva' : '');
        setModalGestionAbierto(true);
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
    const visitasDelDia = visitas.filter(v => isSameDay(v.fecha, fechaSeleccionada));

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'completada': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
            case 'pendiente': return 'bg-amber-50 border-amber-100 text-amber-600';
            case 'cancelada': return 'bg-rose-50 border-rose-100 text-rose-600';
            default: return 'bg-gray-50 border-gray-100 text-gray-600';
        }
    };

    const overlayVisible = modalNuevoAbierto || modalGestionAbierto;

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-32 font-sans text-gray-800 relative overflow-x-hidden">
            <Head title="Mi Agenda - LFH" />

            {!overlayVisible && (
                <button
                    onClick={() => setModalNuevoAbierto(true)}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-[#5D8BF4] text-white rounded-2xl shadow-lg z-40 flex items-center justify-center hover:scale-110 transition-all"
                >
                    <FaPlus className="text-xl" />
                </button>
            )}

            {/* MODAL GESTIONAR VISITA (Se mantiene igual) */}
            {modalGestionAbierto && visitaSeleccionada && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalGestionAbierto(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[35px] p-7 pr-4 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto blue-dot-scroll">
                        <div className="pr-3">
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-none uppercase">Gestionar Actividad</h2>
                                    <p className="text-[11px] text-blue-500 font-bold mt-1 uppercase tracking-wider">
                                        {visitaSeleccionada.doctor} • <span className="text-gray-400">{visitaSeleccionada.modalidad}</span>
                                    </p>
                                </div>
                                <button onClick={() => setModalGestionAbierto(false)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">
                                    <FaXmark className="text-sm" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <section className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Horario de Atención</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-2xl p-3 border border-transparent">
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Inicio</p>
                                            <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-full bg-transparent text-xs font-bold text-gray-800 outline-none" />
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-3 border border-transparent">
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Fin</p>
                                            <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="w-full bg-transparent text-xs font-bold text-gray-800 outline-none" />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cambiar Estado</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'efectiva', label: 'Efectiva / Completada', icon: FaCircleCheck, color: 'text-green-500' },
                                            { id: 'no_contactado', label: 'No contactado / Ausente', icon: FaCircleXmark, color: 'text-orange-500' },
                                            { id: 'reprogramada', label: 'Reprogramada', icon: FaClock, color: 'text-blue-500' }
                                        ].map((opt) => (
                                            <button key={opt.id} onClick={() => setEstadoReporte(opt.id)} className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${estadoReporte === opt.id ? 'bg-blue-50/50 border-blue-500' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                                                <opt.icon className={`text-lg ${estadoReporte === opt.id ? opt.color : 'text-gray-300'}`} />
                                                <span className={`text-xs font-bold ${estadoReporte === opt.id ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <button onClick={() => setModalGestionAbierto(false)} disabled={!estadoReporte} className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all ${estadoReporte ? 'bg-[#5D8BF4] text-white shadow-lg shadow-blue-200' : 'bg-gray-200 text-gray-400'}`}>FINALIZAR REPORTE</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CREAR NUEVO (Se mantiene igual) */}
            {modalNuevoAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalNuevoAbierto(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[35px] p-7 pr-4 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto blue-dot-scroll">
                        <div className="pr-3">
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-none uppercase">Programar Evento</h2>
                                    <p className="text-[11px] text-blue-500 font-bold mt-1 uppercase tracking-wider">{format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}</p>
                                </div>
                                <button onClick={() => setModalNuevoAbierto(false)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">
                                    <FaXmark className="text-sm" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <section className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                                        <select
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-[11px] font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-200"
                                            value={nuevoEvento.tipo}
                                            onChange={(e) => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value })}
                                        >
                                            <option value="VISITA">VISITA</option>
                                            <option value="OTRO">OTRO</option>
                                        </select>
                                    </section>
                                    <section className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Modalidad</label>
                                        <select
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-[11px] font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-200"
                                            value={nuevoEvento.modalidad}
                                            onChange={(e) => setNuevoEvento({ ...nuevoEvento, modalidad: e.target.value })}
                                        >
                                            <option value="PRESENCIAL">PRESENCIAL</option>
                                            <option value="VIRTUAL">VIRTUAL</option>
                                        </select>
                                    </section>
                                </div>

                                {nuevoEvento.tipo === 'VISITA' && (
                                    <section className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Seleccionar Doctor</label>
                                        <select className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-200" value={nuevoEvento.doctor_id} onChange={(e) => setNuevoEvento({ ...nuevoEvento, doctor_id: e.target.value })}>
                                            <option value="">-- Elige un doctor --</option>
                                            {doctores.map(doc => <option key={doc.id} value={doc.id}>{doc.nombre}</option>)}
                                        </select>
                                    </section>
                                )}

                                {nuevoEvento.tipo === 'OTRO' && (
                                    <section className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">¿Qué tipo de evento es?</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Capacitación..."
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-200 shadow-inner"
                                            value={nuevoEvento.nombre_otro}
                                            onChange={(e) => setNuevoEvento({ ...nuevoEvento, nombre_otro: e.target.value })}
                                        />
                                    </section>
                                )}

                                <section className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Horario del Evento</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Inicio</p>
                                            <input type="time" value={nuevoEvento.hora_inicio} onChange={(e) => setNuevoEvento({ ...nuevoEvento, hora_inicio: e.target.value })} className="w-full bg-transparent text-xs font-bold text-gray-800 outline-none" />
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-3">
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Fin</p>
                                            <input type="time" value={nuevoEvento.hora_fin} onChange={(e) => setNuevoEvento({ ...nuevoEvento, hora_fin: e.target.value })} className="w-full bg-transparent text-xs font-bold text-gray-800 outline-none" />
                                        </div>
                                    </div>
                                </section>

                                <button className="w-full bg-[#5D8BF4] text-white rounded-2xl py-4 text-[10px] font-black tracking-widest shadow-lg transition-all active:scale-95 shadow-blue-200" onClick={() => setModalNuevoAbierto(false)}>GUARDAR EN AGENDA</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`${overlayVisible ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : 'blur-0 scale-100 opacity-100'} transition-all duration-500`}>

                {/* --- HEADER REPLICADO --- */}
                <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px] md:rounded-b-[35px]">
                    <div className="max-w-[1440px] mx-auto p-3 md:p-4">
                        <div className="flex items-center gap-3 md:gap-6">

                            {/* Botón Regresar */}
                            <Link
                                href="/GestionVisita"
                                className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                            >
                                <FaArrowLeft className="text-xs" />
                            </Link>

                            {/* Título */}
                            <h1 className="hidden sm:block text-[10px] md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
                                Mi Agenda
                            </h1>

                            {/* Barra de Búsqueda Flexible */}
                            <div className="relative flex-grow max-w-4xl">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                    <FaMagnifyingGlass className="text-[10px] md:text-xs" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar actividad o doctor..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full bg-blue-50 border-none rounded-full py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner font-medium text-gray-700 placeholder:text-gray-300"
                                />
                            </div>

                            {/* Botón Cambiar Vista (Mes/Semana) */}
                            <button
                                onClick={() => setVistaSemanal(!vistaSemanal)}
                                className={`px-4 py-2.5 rounded-full text-[9px] md:text-[10px] font-black uppercase transition-all border shrink-0 shadow-sm active:scale-95 ${vistaSemanal ? 'bg-[#5D8BF4] text-white border-[#5D8BF4]' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
                            >
                                {vistaSemanal ? 'Vista Mes' : 'Vista Semana'}
                            </button>

                        </div>
                    </div>
                </header>

                <main className="px-6 mt-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <section className="lg:col-span-5 space-y-4 order-2 lg:order-1">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Actividades del día</h3>
                        <div className="space-y-3">
                            {visitasDelDia.length > 0 ? (
                                visitasDelDia.map(v => (
                                    <button key={v.id} onClick={() => abrirGestion(v)} className={`w-full p-5 rounded-[28px] border-2 flex items-center justify-between transition-all hover:scale-[1.02] text-left ${obtenerColorEstado(v.estado)}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm relative text-blue-500">
                                                {v.tipo === 'REUNION' ? <FaUsers className="text-lg" /> : <FaUserDoctor className="text-lg" />}
                                                {v.modalidad === 'VIRTUAL' && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                        <FaVideo />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-black uppercase tracking-tight">{v.doctor}</h4>
                                                <p className="text-[9px] font-bold uppercase opacity-60 mt-0.5">{v.estado} • {v.modalidad}</p>
                                            </div>
                                        </div>
                                        <FaChevronRight className="opacity-30 text-xs" />
                                    </button>
                                ))
                            ) : (
                                <div className="bg-white/40 border-2 border-dashed border-gray-100 rounded-[28px] py-12 text-center text-gray-400 text-[11px] italic">Sin actividades.</div>
                            )}
                        </div>
                    </section>

                    <section className={`lg:col-span-7 bg-white shadow-sm border border-gray-50 p-8 ${vistaSemanal ? 'rounded-[24px]' : 'rounded-[32px]'} order-1 lg:order-2`}>
                        <div className="flex justify-between items-center mb-8 px-2">
                            <button onClick={navegarAnterior} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-blue-500 transition-colors">
                                <FaChevronLeft />
                            </button>
                            <h2 className="font-extrabold capitalize text-gray-800">{format(mesActual, 'MMMM yyyy', { locale: es })}</h2>
                            <button onClick={navegarSiguiente} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-blue-500 transition-colors">
                                <FaChevronRight />
                            </button>
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
                                if (tieneVisita) claseDia = 'bg-slate-200 text-slate-600 font-bold';
                                if (seleccionado) claseDia = 'bg-[#5D8BF4] text-white shadow-md scale-110 z-10';

                                return (
                                    <button key={idx} onClick={() => { setFechaSeleccionada(dia); if (vistaSemanal) setMesActual(dia); }} className={`relative aspect-square flex items-center justify-center rounded-xl text-[11px] transition-all hover:ring-2 hover:ring-blue-100 ${claseDia}`}>
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