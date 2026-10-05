import React from 'react';
import { FaBullseye, FaMapPin, FaClock } from 'react-icons/fa6';

const ESTADO_ESTILO = {
    programado: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    realizado:  'bg-teal-500/10 text-teal-600 border-teal-500/20',
    completado: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    cancelado:  'bg-gray-300/30 text-gray-400 border-gray-300/40 line-through',
};

const ESTADO_LABEL = {
    programado: 'Programado',
    realizado:  'Realizado',
    completado: 'Completado',
    cancelado:  'Cancelado',
};

const formatFecha = (fechaStr) => {
    if (!fechaStr) return 'Sin fecha';
    const d = new Date(String(fechaStr).replace(' ', 'T'));
    if (isNaN(d.getTime())) return fechaStr;
    return (
        d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' · ' +
        d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
    );
};

/**
 * Pestaña "Actividades / Eventos próximos" del panel del visitador.
 */
const ActividadesTab = ({ actividades = [], irAEjecutarActividad }) => {
    // Filtrar solo las actividades pendientes / programadas
    const actividadesPendientes = actividades.filter((evento) => {
        const estado = (evento.estado || 'programado').toLowerCase();
        return estado !== 'realizado' && estado !== 'completado' && estado !== 'cancelado';
    });

    const handleEjecutar = (e, evento) => {
        e.stopPropagation();
        if (typeof irAEjecutarActividad === 'function') {
            irAEjecutarActividad(evento.id);
        }
    };

    return (
        <>
            <h3 className="text-xs font-black text-indigo-500 px-1 uppercase tracking-widest mb-3">
                Actividades / Eventos Pendientes ({actividadesPendientes.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {actividadesPendientes.map((evento) => {
                    const etiquetas = Array.isArray(evento.etiquetas) ? evento.etiquetas : [];
                    const estadoKey = (evento.estado || 'programado').toLowerCase();
                    const estiloEstado = ESTADO_ESTILO[estadoKey] || ESTADO_ESTILO.programado;
                    const labelEstado  = ESTADO_LABEL[estadoKey]  || evento.estado;

                    const fechaInicio = evento.fecha_programada || evento.fecha_inicio;
                    const fechaFin = evento.fecha_fin_programada || evento.fecha_fin;

                    return (
                        <div
                            key={evento.id}
                            onClick={(e) => handleEjecutar(e, evento)}
                            className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm border border-white/40 overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                        >
                            <div className="p-3.5 flex gap-3 items-center justify-between w-full">
                                {/* Sección Izquierda: Ícono e Información */}
                                <div className="flex gap-3 items-start min-w-0 flex-1">
                                    {/* Ícono */}
                                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                                        <FaBullseye size={16} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                                                {evento.nombre_evento || evento.titulo || evento.nombre || 'Actividad'}
                                            </h4>
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border ${estiloEstado}`}>
                                                {labelEstado}
                                            </span>
                                        </div>

                                        {/* Etiquetas */}
                                        {etiquetas.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {etiquetas.slice(0, 3).map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[9px] bg-indigo-50 text-indigo-500 font-bold px-1.5 py-0.5 rounded-full border border-indigo-100"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Fechas */}
                                        <div className="flex flex-col gap-0.5 mt-1.5">
                                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                                <FaClock className="text-indigo-300 shrink-0" size={10} />
                                                <span className="font-semibold">Inicio:</span>&nbsp;{formatFecha(fechaInicio)}
                                            </p>
                                            {fechaFin && (
                                                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                                    <FaClock className="text-slate-300 shrink-0" size={10} />
                                                    <span className="font-semibold">Fin:</span>&nbsp;{formatFecha(fechaFin)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Ubicación */}
                                        {evento.ubicacion && (
                                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                                <FaMapPin className="text-slate-300 shrink-0" size={10} />
                                                {evento.ubicacion}
                                            </p>
                                        )}

                                        {/* Comentario */}
                                        {evento.comentario && (
                                            <p className="text-[10px] text-gray-400 italic mt-1 line-clamp-2">
                                                "{evento.comentario}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 🔘 Botón Fijo para Ejecutar Actividad */}
                                <div className="pl-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={(e) => handleEjecutar(e, evento)}
                                        className="bg-[#1C85E8] hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                                    >
                                        Ejecutar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {actividadesPendientes.length === 0 && (
                <div className="text-center py-12 bg-white/50 rounded-[24px] border border-dashed border-gray-200 text-gray-400 text-xs italic">
                    No tienes actividades o eventos pendientes.
                </div>
            )}
        </>
    );
};

export default ActividadesTab;