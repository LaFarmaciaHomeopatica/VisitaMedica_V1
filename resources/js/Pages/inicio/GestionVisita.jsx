import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import BarraNave from './barranave';

const GestionVisita = () => {
    const [estado, setEstado] = useState('');
    const [comentario, setComentario] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);

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
        <div className="bg-[#F4F7FF] min-h-screen font-sans relative overflow-hidden">
            <Head title="Reportar Visita - LFH" />

            {/* CONTENIDO PRINCIPAL */}
            <div className={`transition-all duration-500 ${modalAbierto ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : 'blur-0 scale-100 opacity-100'}`}>

                {/* Header Compacto */}
                <div className="p-5 flex items-center justify-between text-[#5D8BF4] bg-white rounded-b-[25px] shadow-sm">
                    <Link href="/panel" className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full">
                        <i className="fa-solid fa-arrow-left text-sm"></i>
                    </Link>
                    <h1 className="text-sm font-black text-[#5D8BF4] uppercase tracking-[0.2em]">
                        Gestion Visitas
                    </h1>
                    <div className="w-9"></div>
                </div>

                <main className="px-5 mt-4 space-y-4 pb-32">

                    {/* Calendario Ajustado */}
                    <section className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <button onClick={() => cambiarSemana(-1)} className="text-[#5D8BF4] p-1">
                                    <i className="fa-solid fa-chevron-left text-xs"></i>
                                </button>
                                <h3 className="text-xs font-black text-gray-700 uppercase tracking-tighter w-28 text-center">
                                    {fechaActual.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </h3>
                                <button onClick={() => cambiarSemana(1)} className="text-[#5D8BF4] p-1">
                                    <i className="fa-solid fa-chevron-right text-xs"></i>
                                </button>
                            </div>
                            <Link href="/CalendarioVisitas" className="text-[#5D8BF4]">
                                <i className="fa-solid fa-calendar-days text-base"></i>
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

                    {/* Card del Médico */}
                    <section
                        onClick={() => setModalAbierto(true)}
                        className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex items-center justify-between active:scale-95 transition-transform cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500">
                                <i className="fa-solid fa-user-doctor text-lg"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 leading-tight">{medico.nombre}</h4>
                                <p className="text-[10px] text-gray-400">{medico.especialidad} • {medico.consultorio}</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-[#5D8BF4] bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">Gestionar</span>
                    </section>
                </main>
            </div>

            {/* Barra navegación */}
            <div className={`${modalAbierto ? 'opacity-20' : 'opacity-100'} transition-opacity duration-300`}>
                <BarraNave />
            </div>

            {/* MODAL */}
            {modalAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalAbierto(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[35px] p-7 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto no-scrollbar">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 leading-none">Gestionar Visita</h2>
                                <p className="text-[11px] text-blue-500 font-medium mt-1">{medico.nombre}</p>
                            </div>
                            <button onClick={() => setModalAbierto(false)} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">
                                <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>

                        <div className="space-y-5">
                            <section className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: 'efectiva', label: 'Efectiva', icon: 'fa-check-circle', color: 'text-green-500' },
                                        { id: 'no_contactado', label: 'No contactado', icon: 'fa-times-circle', color: 'text-orange-500' },
                                        { id: 'reprogramada', label: 'Reprogramada', icon: 'fa-clock', color: 'text-blue-500' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setEstado(opt.id)}
                                            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all
                                                ${estado === opt.id ? 'bg-blue-50/50 border-blue-500' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                        >
                                            <i className={`fa-solid ${opt.icon} text-lg ${estado === opt.id ? opt.color : 'text-gray-300'}`}></i>
                                            <span className={`text-xs font-bold ${estado === opt.id ? 'text-gray-900' : 'text-gray-400'}`}>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas</label>
                                <textarea
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    placeholder="Breve resumen..."
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs text-gray-800 shadow-inner focus:ring-1 focus:ring-blue-200 min-h-[90px] outline-none"
                                ></textarea>
                            </section>

                            <button
                                onClick={() => setModalAbierto(false)}
                                disabled={!estado}
                                className={`w-full py-3.5 rounded-2xl font-black text-[10px] tracking-widest transition-all
                                    ${estado ? 'bg-[#5D8BF4] text-white shadow-lg shadow-blue-100' : 'bg-gray-200 text-gray-400'}`}
                            >
                                FINALIZAR REPORTE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionVisita;