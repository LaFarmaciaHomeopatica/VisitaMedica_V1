import React from 'react';
import { format, isSameDay, getDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

const CalendarSection = ({ logic }) => {
    const diaInicioSemana = getDay(startOfMonth(logic.mesActual));

    return (
        <section className="lg:col-span-7 bg-white/80 backdrop-blur-md shadow-sm border border-white/40 p-6 rounded-[32px]">
            {/* Navegación mes */}
            <div className="flex justify-between items-center mb-6 px-1">
                <button
                    onClick={logic.navegarAnterior}
                    className="w-9 h-9 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-xl text-[#1C85E8] transition-all active:scale-90"
                >
                    <FaChevronLeft className="text-xs" />
                </button>

                <h2 className="font-extrabold capitalize text-gray-800 text-sm tracking-wide">
                    {format(logic.mesActual, 'MMMM yyyy', { locale: es })}
                </h2>

                <button
                    onClick={logic.navegarSiguiente}
                    className="w-9 h-9 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-xl text-[#1C85E8] transition-all active:scale-90"
                >
                    <FaChevronRight className="text-xs" />
                </button>
            </div>

            {/* Grid días */}
            <div className="grid grid-cols-7 gap-2 text-center">
                {['L', 'M', 'MI', 'J', 'V', 'S', 'D'].map(d => (
                    <span key={d} className="text-[9px] font-black text-gray-300 mb-3 uppercase tracking-widest">
                        {d}
                    </span>
                ))}

                {!logic.vistaSemanal && [...Array(diaInicioSemana === 0 ? 6 : diaInicioSemana - 1)].map((_, i) => (
                    <div key={i} />
                ))}

                {logic.diasAMostrar.map((dia, idx) => {
                    const tieneVisita = logic.visitas.some(v => isSameDay(v.fecha, dia));
                    const seleccionado = isSameDay(dia, logic.fechaSeleccionada);

                    let claseDia = 'bg-gray-50/80 text-gray-400 hover:bg-blue-50 hover:text-[#1C85E8]';
                    if (tieneVisita) claseDia = 'bg-gradient-to-br from-[#1C85E8]/10 to-[#02CFE3]/10 text-[#1C85E8] font-bold';
                    if (seleccionado) claseDia = 'bg-gradient-to-br from-[#1C85E8] to-[#02CFE3] text-white shadow-md shadow-blue-200 scale-110 z-10';

                    return (
                        <button
                            key={idx}
                            onClick={() => logic.handleSeleccionarFecha(dia)}
                            className={`aspect-square flex items-center justify-center rounded-xl text-[11px] transition-all ${claseDia}`}
                        >
                            {format(dia, 'd')}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default CalendarSection;