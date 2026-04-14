import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameDay, getDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks
} from 'date-fns';
import { es } from 'date-fns/locale';
import BarraNave from './barranave';

const CalendarioVisitas = () => {
    // --- ESTADOS ---
    const [mesActual, setMesActual] = useState(new Date());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [vistaSemanal, setVistaSemanal] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);

    const [nuevoEvento, setNuevoEvento] = useState({
        tipo: 'VISITA',
        detalles: ''
    });

    // --- DATOS SIMULADOS ---
    const [visitas, setVisitas] = useState([
        { id: 1, fecha: new Date(2026, 3, 10), doctor: "Dr. Amit Kumar", estado: 'completada', tipo: 'VISITA' },
        { id: 2, fecha: new Date(2026, 3, 14), doctor: "Dra. Maria Lopez", estado: 'pendiente', tipo: 'VISITA' },
        { id: 3, fecha: new Date(2026, 3, 16), doctor: "Dr. Carlos Ruiz", estado: 'pendiente', tipo: 'VISITA' },
    ]);

    // --- LÓGICA DE NAVEGACIÓN ---
    const navegarSiguiente = () => {
        vistaSemanal ? setMesActual(addWeeks(mesActual, 1)) : setMesActual(addMonths(mesActual, 1));
    };

    const navegarAnterior = () => {
        vistaSemanal ? setMesActual(subWeeks(mesActual, 1)) : setMesActual(subMonths(mesActual, 1));
    };

    const diasAMostrar = useMemo(() => {
        if (vistaSemanal) {
            const inicio = startOfWeek(mesActual, { weekStartsOn: 1 });
            const fin = endOfWeek(mesActual, { weekStartsOn: 1 });
            return eachDayOfInterval({ start: inicio, end: fin });
        } else {
            const inicio = startOfMonth(mesActual);
            const fin = endOfMonth(mesActual);
            return eachDayOfInterval({ start: inicio, end: fin });
        }
    }, [mesActual, vistaSemanal]);

    const diaInicioSemana = getDay(startOfMonth(mesActual));
    const visitasDelDia = visitas.filter(v => isSameDay(v.fecha, fechaSeleccionada));

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-32 font-sans text-gray-800 relative overflow-x-hidden">
            <Head title="Mi Agenda - LFH" />

            {/* BOTÓN FLOTANTE (FAB) */}
            {!modalAbierto && (
                <button
                    onClick={() => setModalAbierto(true)}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-[#5D8BF4] text-white rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center z-40 hover:scale-110 active:scale-95 transition-all duration-300 animate-in fade-in zoom-in"
                >
                    <i className="fa-solid fa-plus text-xl"></i>
                </button>
            )}

            {/* MODAL CENTRADO CON FECHA DINÁMICA */}
            {modalAbierto && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Nuevo Evento</h2>
                                <button
                                    onClick={() => setModalAbierto(false)}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>

                            <div className="space-y-5">
                                {/* INDICADOR DE FECHA SELECCIONADA */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fecha del Evento</label>
                                    <div className="mt-2 bg-blue-50 text-[#5D8BF4] rounded-2xl p-4 flex items-center gap-3 border border-blue-100">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-500">
                                            <i className="fa-solid fa-calendar-day text-sm"></i>
                                        </div>
                                        <span className="text-xs font-bold capitalize">
                                            {format(fechaSeleccionada, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                        </span>
                                    </div>
                                </div>

                                {/* TIPO DE EVENTO */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                                    <select
                                        className="w-full mt-2 bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                                        value={nuevoEvento.tipo}
                                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value })}
                                    >
                                        <option value="VISITA">VISITA MÉDICA</option>
                                        <option value="REUNION">REUNIÓN</option>
                                        <option value="OTRO">OTRO</option>
                                    </select>
                                </div>

                                {/* DETALLES */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detalles / Notas</label>
                                    <textarea
                                        rows="3"
                                        className="w-full mt-2 bg-gray-50 border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300 outline-none resize-none"
                                        placeholder="Escribe notas importantes aquí..."
                                        value={nuevoEvento.detalles}
                                        onChange={(e) => setNuevoEvento({ ...nuevoEvento, detalles: e.target.value })}
                                    ></textarea>
                                </div>

                                {/* BOTÓN GUARDAR */}
                                <button
                                    className="w-full bg-[#5D8BF4] text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest shadow-md shadow-blue-100 hover:bg-blue-600 transition-all active:scale-95"
                                    onClick={() => {
                                        console.log("Guardando en:", format(fechaSeleccionada, 'yyyy-MM-dd'), nuevoEvento);
                                        setModalAbierto(false);
                                    }}
                                >
                                    Confirmar y Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className="p-6 bg-white rounded-b-[40px] shadow-sm border-b border-blue-50">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/GestionVisita" className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full">
                            <i className="fa-solid fa-arrow-left text-sm text-blue-500"></i>
                        </Link>
                        <h1 className="text-sm font-black text-[#5D8BF4] uppercase tracking-[0.2em]">Mi Agenda</h1>
                    </div>

                    <button
                        onClick={() => setVistaSemanal(!vistaSemanal)}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-bold uppercase transition-all border ${vistaSemanal ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'
                            }`}
                    >
                        {vistaSemanal ? 'Vista Mes' : 'Vista Semana'}
                    </button>
                </div>
            </header>

            <main className="px-6 mt-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LADO IZQUIERDO: LISTADO DE ACTIVIDADES */}
                <section className="lg:col-span-5 space-y-4 order-2 lg:order-1">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                        {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
                    </h3>
                    <div className="space-y-3">
                        {visitasDelDia.length > 0 ? (
                            visitasDelDia.map(v => (
                                <div key={v.id} className="bg-white p-4 rounded-[24px] flex items-center justify-between shadow-sm border border-gray-50 hover:border-amber-200 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
                                            <i className={`fa-solid ${v.tipo === 'REUNION' ? 'fa-users' : 'fa-user-doctor'} text-sm`}></i>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold">{v.doctor || 'Evento General'}</h4>
                                            <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">{v.tipo || 'Visita'}</p>
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-[10px] text-gray-300"></i>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white/40 border-2 border-dashed border-gray-100 rounded-[28px] py-12 text-center">
                                <p className="text-[11px] text-gray-400 italic">No hay actividades programadas.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* LADO DERECHO: CALENDARIO */}
                <section className={`lg:col-span-7 bg-white shadow-sm border border-gray-50 transition-all duration-300 ${vistaSemanal ? 'rounded-[24px] p-4' : 'rounded-[32px] p-8'
                    } order-1 lg:order-2`}>

                    <div className="flex justify-between items-center mb-8 px-2">
                        <button onClick={navegarAnterior} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-blue-500 transition-colors">
                            <i className="fa-solid fa-chevron-left text-xs"></i>
                        </button>
                        <h2 className="font-extrabold capitalize tracking-tight text-gray-800 text-center">
                            {format(mesActual, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <button onClick={navegarSiguiente} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:text-blue-500 transition-colors">
                            <i className="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-3 text-center">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                            <span key={d} className="text-[10px] font-bold text-gray-300 mb-4 uppercase">{d}</span>
                        ))}

                        {!vistaSemanal && [...Array(diaInicioSemana === 0 ? 6 : diaInicioSemana - 1)].map((_, i) => (
                            <div key={`empty-${i}`} className="h-10 sm:h-12" />
                        ))}

                        {diasAMostrar.map((dia, idx) => {
                            const visitaDia = visitas.find(v => isSameDay(v.fecha, dia));
                            const seleccionado = isSameDay(dia, fechaSeleccionada);
                            const hoy = isSameDay(dia, new Date());

                            let estiloCuadro = 'bg-gray-50 text-gray-400';
                            if (visitaDia) estiloCuadro = 'bg-amber-400 text-white shadow-md shadow-amber-100';
                            if (seleccionado && !visitaDia) estiloCuadro = 'bg-blue-500 text-white shadow-md shadow-blue-100';

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setFechaSeleccionada(dia);
                                        if (vistaSemanal) setMesActual(dia);
                                    }}
                                    className={`relative transition-all duration-300 ${vistaSemanal ? 'h-16 rounded-2xl' : 'h-12 rounded-xl'
                                        } flex flex-col items-center justify-center ${estiloCuadro} 
                                    ${seleccionado ? 'scale-105 z-10' : 'hover:bg-amber-50'}`}
                                >
                                    <span className="text-xs font-black">{format(dia, 'd')}</span>
                                    {vistaSemanal && (
                                        <span className="text-[8px] uppercase font-bold mt-1 opacity-60">
                                            {format(dia, 'EEE', { locale: es })}
                                        </span>
                                    )}
                                    {hoy && !seleccionado && (
                                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

            </main>

            {/* BARRA DE NAVEGACIÓN: Desaparece si el modal está abierto */}
            {!modalAbierto && <BarraNave />}
        </div>
    );
};

export default CalendarioVisitas;