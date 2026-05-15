import React from 'react';
import { format, isSameDay, getDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

const CalendarSection = ({ logic }) => {
    const diaInicioSemana = getDay(startOfMonth(logic.mesActual));

    return (
        <section className="lg:col-span-7 bg-white shadow-sm p-8 rounded-[32px]">
            <div className="flex justify-between items-center mb-8 px-2">
                <button onClick={logic.navegarAnterior} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400"><FaChevronLeft /></button>
                <h2 className="font-extrabold capitalize text-gray-800">{format(logic.mesActual, 'MMMM yyyy', { locale: es })}</h2>
                <button onClick={logic.navegarSiguiente} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400"><FaChevronRight /></button>
            </div>

            <div className="grid grid-cols-7 gap-3 text-center">
                {['L', 'M', 'MI', 'J', 'V', 'S', 'D'].map(d => (
                    <span key={d} className="text-[10px] font-bold text-gray-300 mb-4 uppercase">{d}</span>
                ))}
                {!logic.vistaSemanal && [...Array(diaInicioSemana === 0 ? 6 : diaInicioSemana - 1)].map((_, i) => <div key={i} />)}
                {logic.diasAMostrar.map((dia, idx) => {
                    const tieneVisita = logic.visitas.some(v => isSameDay(v.fecha, dia));
                    const seleccionado = isSameDay(dia, logic.fechaSeleccionada);

                    let claseDia = 'bg-gray-50 text-gray-400';
                    if (tieneVisita) claseDia = 'bg-blue-100 text-[#5D8BF4] font-bold';
                    if (seleccionado) claseDia = 'bg-[#5D8BF4] text-white shadow-md scale-110 z-10';

                    return (
                        <button key={idx} onClick={() => logic.handleSeleccionarFecha(dia)} className={`aspect-square flex items-center justify-center rounded-xl text-[11px] transition-all ${claseDia}`}>
                            {format(dia, 'd')}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default CalendarSection;