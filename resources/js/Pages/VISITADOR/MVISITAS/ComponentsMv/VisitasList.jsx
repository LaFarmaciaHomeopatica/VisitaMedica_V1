import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaUserDoctor, FaVideo, FaChevronRight, FaCalendarDays } from 'react-icons/fa6';
import { normalizarEtiquetas } from '../HooksMv/useMisVisitas';

const VisitasList = ({ logic }) => {
    const obtenerColorEstado = (item) => {
        const estado = item.estado || '';
        if (item.tipo === 'visita') {
            switch (estado) {
                case 'efectiva':
                    return 'bg-emerald-50/80 border-emerald-200 text-emerald-700';
                case 'programada':
                    return 'bg-amber-50/80 border-amber-200 text-amber-700';
                case 'No contactado':
                    return 'bg-rose-50/80 border-rose-200 text-rose-700';
                case 'reprogramada':
                    return 'bg-blue-50/80 border-blue-200 text-[#1C85E8]';
                case 'cancelada':
                    return 'bg-gray-100 border-gray-200 text-gray-400 line-through';
                default:
                    return 'bg-gray-50/80 border-gray-200 text-gray-600';
            }
        } else {
            // Actividad / Evento
            switch (estado) {
                case 'realizado':
                    return 'bg-teal-50/80 border-teal-200 text-teal-700';
                case 'programado':
                    return 'bg-indigo-50/80 border-indigo-200 text-indigo-700';
                case 'reprogramada':
                    return 'bg-blue-50/80 border-blue-200 text-blue-700';
                case 'cancelado':
                    return 'bg-gray-100 border-gray-200 text-gray-400 line-through';
                default:
                    return 'bg-indigo-50/80 border-indigo-200 text-indigo-600';
            }
        }
    };

    const obtenerIconoGradiente = (item) => {
        const estado = item.estado || '';
        if (item.tipo === 'visita') {
            switch (estado) {
                case 'efectiva':
                    return 'from-emerald-400 to-emerald-500';
                case 'programada':
                    return 'from-amber-400 to-amber-500';
                case 'No contactado':
                    return 'from-rose-400 to-rose-500';
                case 'reprogramada':
                    return 'from-[#1C85E8] to-[#02CFE3]';
                default:
                    return 'from-gray-400 to-gray-500';
            }
        } else {
            switch (estado) {
                case 'realizado':
                    return 'from-teal-400 to-teal-600';
                case 'programado':
                    return 'from-indigo-500 to-indigo-700';
                case 'cancelado':
                    return 'from-gray-400 to-gray-500';
                default:
                    return 'from-indigo-400 to-indigo-600';
            }
        }
    };

    return (
        <section className="lg:col-span-5 space-y-4">
            {/* Fecha seleccionada */}
            <div className="flex items-center justify-between ml-2 mr-1">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {format(logic.fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                    {logic.itemsDelDia.length} {logic.itemsDelDia.length === 1 ? 'actividad' : 'actividades'}
                </span>
            </div>

            <div className="space-y-3">
                {logic.itemsDelDia.length > 0 ? (
                    logic.itemsDelDia.map((item) => {
                        const esVisita = item.tipo === 'visita';

                        return (
                            <button
                                key={`${item.tipo}-${item.id}`}
                                onClick={() =>
                                    esVisita
                                        ? logic.abrirGestionVisita(item)
                                        : logic.abrirGestionEvento(item)
                                }
                                className={`w-full p-4 rounded-[24px] border-2 flex items-center justify-between transition-all hover:scale-[1.01] hover:shadow-md backdrop-blur-sm ${obtenerColorEstado(
                                    item
                                )}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Icono con gradiente */}
                                    <div
                                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${obtenerIconoGradiente(
                                            item
                                        )} flex items-center justify-center shadow-sm relative shrink-0 text-white`}
                                    >
                                        {esVisita ? (
                                            <FaUserDoctor className="text-base" />
                                        ) : (
                                            <FaCalendarDays className="text-base" />
                                        )}
                                        {esVisita && item.modalidad === 'VIRTUAL' && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#1C85E8] text-[8px] rounded-full flex items-center justify-center border-2 border-current shadow-sm">
                                                <FaVideo />
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-left min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/70 shadow-xs">
                                                {esVisita ? '🩺 Visita' : '🎯 Actividad'}
                                            </span>
                                            <span className="text-[10px] font-bold opacity-75">
                                                {item.hora_12h || (item.fecha_programada ? item.fecha_programada.slice(11, 16) : '')}
                                            </span>
                                        </div>

                                        <h4 className="text-[13px] font-black uppercase leading-tight mt-1 truncate">
                                            {esVisita ? item.doctor : item.titulo}
                                        </h4>

                                        <p className="text-[9px] font-bold uppercase opacity-70 tracking-wider mt-0.5">
                                            Estado: {item.estado}
                                        </p>

                                        {!esVisita && normalizarEtiquetas(item.etiquetas).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {normalizarEtiquetas(item.etiquetas).map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-indigo-100/90 text-indigo-800 text-[9px] px-2 py-0.5 rounded-full font-bold shadow-2xs"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="w-7 h-7 flex items-center justify-center bg-white/60 rounded-xl shrink-0 ml-2">
                                    <FaChevronRight className="opacity-40 text-[10px]" />
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="bg-white/40 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-[28px] py-12 text-center text-gray-400 text-[11px] italic">
                        Sin actividades ni visitas para este día.
                    </div>
                )}
            </div>
        </section>
    );
};

export default VisitasList;