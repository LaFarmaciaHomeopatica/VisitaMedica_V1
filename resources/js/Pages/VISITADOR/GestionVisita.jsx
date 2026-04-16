import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
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

const GestionVisita = () => {
    const [estado, setEstado] = useState('');
    const [comentario, setComentario] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [search, setSearch] = useState('');

    const [horaInicio, setHoraInicio] = useState('08:00');
    const [horaFin, setHoraFin] = useState('09:00');

    const [fechaActual, setFechaActual] = useState(new Date());
    const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().getDate());

    const medico = {
        nombre: "Dr. Amit Kumar",
        especialidad: "Cardiólogo",
        consultorio: "Portoazul - 402"
    };

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

    const cambiarSemana = (direccion) => {
        const nuevaFecha = new Date(fechaActual);
        nuevaFecha.setDate(fechaActual.getDate() + direccion * 7);
        setFechaActual(nuevaFecha);
    };

    return (
        <div className="bg-[#F4F7FF] min-h-screen font-sans relative overflow-x-hidden text-gray-800">
            <Head title="Reportar Visita - LFH" />

            <style>
                {`
                .blue-dot-scroll::-webkit-scrollbar { width: 6px; }
                .blue-dot-scroll::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; margin: 15px 0; }
                .blue-dot-scroll::-webkit-scrollbar-thumb { background: #5D8BF4; border-radius: 50px; border: 1px solid white; }
                .blue-dot-scroll::-webkit-scrollbar-thumb:hover { background: #4A76D9; }
                `}
            </style>

            <div className={`transition-all duration-500 ${modalAbierto ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}>

                {/* Header Replicado Exactamente */}
                <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px] md:rounded-b-[35px]">
                    <div className="max-w-[1440px] mx-auto p-3 md:p-4">
                        <div className="flex items-center gap-3 md:gap-6">

                            {/* Botón Regresar */}
                            <Link
                                href="/panel"
                                className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                            >
                                <FaArrowLeft className="text-xs" />
                            </Link>

                            {/* Título */}
                            <h1 className="hidden sm:block text-[10px] md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
                                Gestión
                            </h1>

                            {/* Barra de Búsqueda Flexible */}
                            <div className="relative flex-grow max-w-4xl">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                    <FaMagnifyingGlass className="text-[10px] md:text-xs" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-blue-50 border-none rounded-full py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner font-medium text-gray-700 placeholder:text-gray-300"
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
                                <button onClick={() => cambiarSemana(-1)} className="text-[#5D8BF4] p-1">
                                    <FaChevronLeft className="text-xs" />
                                </button>
                                <h3 className="text-xs font-black text-gray-700 uppercase tracking-tighter w-28 text-center">
                                    {fechaActual.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </h3>
                                <button onClick={() => cambiarSemana(1)} className="text-[#5D8BF4] p-1">
                                    <FaChevronRight className="text-xs" />
                                </button>
                            </div>
                            <Link href="/CalendarioVisitas" className="text-[#5D8BF4]">
                                <FaCalendarDays className="text-base" />
                            </Link>
                        </div>

                        <div className="flex justify-between gap-1 overflow-x-auto no-scrollbar">
                            {diasSemana.map((dia) => (
                                <button
                                    key={dia.fechaCompleta.toISOString()}
                                    onClick={() => setDiaSeleccionado(dia.num)}
                                    className={`flex flex-col items-center justify-center min-w-[42px] py-2 rounded-xl transition-all
                                        ${diaSeleccionado === dia.num
                                            ? 'bg-[#5D8BF4] text-white shadow-md shadow-blue-100'
                                            : 'bg-transparent text-gray-400'}`}
                                >
                                    <span className="text-[9px] font-bold uppercase mb-0.5">
                                        {dia.nombre.slice(0, 3)}
                                    </span>
                                    <span className="text-xs font-black">{dia.num}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Tarjeta de Gestión */}
                    <section
                        onClick={() => setModalAbierto(true)}
                        className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex items-center justify-between active:scale-95 transition-transform cursor-pointer group hover:bg-blue-50/30"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 shadow-inner group-hover:bg-white transition-colors">
                                <FaUserDoctor className="text-lg" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 leading-tight">{medico.nombre}</h4>
                                <p className="text-[10px] text-gray-400">{medico.especialidad} • {medico.consultorio}</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-[#5D8BF4] bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">
                            Gestionar
                        </span>
                    </section>
                </main>
            </div>

            <div className={`${modalAbierto ? 'opacity-20 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
                <BarraNave />
            </div>

            {/* MODAL */}
            {modalAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAbierto(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[35px] p-7 pr-4 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto blue-dot-scroll scroll-smooth">
                        <div className="pr-3">
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-none uppercase">Gestionar Visita</h2>
                                    <p className="text-[11px] text-blue-500 font-bold mt-1 uppercase tracking-wider">{medico.nombre}</p>
                                </div>
                                <button onClick={() => setModalAbierto(false)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">
                                    <FaXmark className="text-sm" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <section className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Horario</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-2xl p-3 shadow-inner">
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Inicio</p>
                                            <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-full bg-transparent text-xs font-bold text-gray-800 outline-none" />
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-3 shadow-inner">
                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Fin</p>
                                            <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="w-full bg-transparent text-xs font-bold text-gray-800 outline-none" />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cambiar Estado</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'efectiva', label: 'Efectiva / Completada', icon: <FaCircleCheck />, color: 'text-green-500' },
                                            { id: 'no_contactado', label: 'No contactado / Ausente', icon: <FaCircleXmark />, color: 'text-orange-500' },
                                            { id: 'reprogramada', label: 'Reprogramada', icon: <FaClock />, color: 'text-blue-500' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setEstado(opt.id)}
                                                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all active:scale-95 ${estado === opt.id ? 'bg-blue-50/50 border-blue-500' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                            >
                                                <div className={`text-lg ${estado === opt.id ? opt.color : 'text-gray-300'}`}>{opt.icon}</div>
                                                <span className={`text-xs font-bold ${estado === opt.id ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas</label>
                                    <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Resultado de la visita..." className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs text-gray-800 shadow-inner focus:ring-1 focus:ring-blue-200 min-h-[90px] outline-none resize-none"></textarea>
                                </section>

                                <button
                                    onClick={() => setModalAbierto(false)}
                                    disabled={!estado}
                                    className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all ${estado ? 'bg-[#5D8BF4] text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}
                                >
                                    FINALIZAR REPORTE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionVisita;