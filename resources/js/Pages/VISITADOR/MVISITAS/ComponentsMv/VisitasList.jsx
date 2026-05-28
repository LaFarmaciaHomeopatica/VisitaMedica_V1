import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaUserDoctor, FaVideo, FaChevronRight } from 'react-icons/fa6';

const VisitasList = ({ logic }) => {
    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'efectiva':      return 'bg-emerald-50/80 border-emerald-100 text-emerald-600';
            case 'programada':    return 'bg-amber-50/80 border-amber-100 text-amber-600';
            case 'no_contactado': return 'bg-rose-50/80 border-rose-100 text-rose-600';
            case 'reprogramada':  return 'bg-blue-50/80 border-blue-100 text-[#1C85E8]';
            default:              return 'bg-gray-50/80 border-gray-100 text-gray-600';
        }
    };

    const obtenerIconoEstado = (estado) => {
        switch (estado) {
            case 'efectiva':      return 'from-emerald-400 to-emerald-500';
            case 'programada':    return 'from-amber-400 to-amber-500';
            case 'no_contactado': return 'from-rose-400 to-rose-500';
            case 'reprogramada':  return 'from-[#1C85E8] to-[#02CFE3]';
            default:              return 'from-gray-300 to-gray-400';
        }
    };

    return (
        <section className="lg:col-span-5 space-y-4">
            {/* Fecha seleccionada — estilo etiqueta del panel */}
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                {format(logic.fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
            </h3>

            <div className="space-y-3">
                {logic.visitasDelDia.length > 0 ? (
                    logic.visitasDelDia.map(v => (
                        <button
                            key={v.id}
                            onClick={() => logic.abrirGestion(v)}
                            className={`w-full p-4 rounded-[24px] border-2 flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-md backdrop-blur-sm ${obtenerColorEstado(v.estado)}`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar con gradiente según estado */}
                                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${obtenerIconoEstado(v.estado)} flex items-center justify-center shadow-sm relative`}>
                                    <FaUserDoctor className="text-white text-base" />
                                    {v.modalidad === 'VIRTUAL' && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#1C85E8] text-[8px] rounded-full flex items-center justify-center border-2 border-current shadow-sm">
                                            <FaVideo />
                                        </div>
                                    )}
                                </div>

                                <div className="text-left">
                                    <h4 className="text-[13px] font-black uppercase leading-tight">{v.doctor}</h4>
                                    <p className="text-[9px] font-bold uppercase opacity-60 tracking-wider mt-0.5">{v.estado}</p>
                                </div>
                            </div>

                            <div className="w-7 h-7 flex items-center justify-center bg-white/60 rounded-xl">
                                <FaChevronRight className="opacity-40 text-[10px]" />
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="bg-white/40 backdrop-blur-sm border-2 border-dashed border-gray-100 rounded-[28px] py-12 text-center text-gray-400 text-[11px] italic">
                        Sin actividades para este día.
                    </div>
                )}
            </div>
        </section>
    );
};

export default VisitasList;