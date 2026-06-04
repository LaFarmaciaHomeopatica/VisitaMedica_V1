import React from 'react';
import { Link } from '@inertiajs/react';
import { FaCalendarDays, FaLocationDot, FaPlay } from 'react-icons/fa6';

/**
 * Pestaña "Visitas Pendientes": muestra las visitas programadas sin ejecutar.
 */
const PendientesTab = ({ visitasPendientesFiltradas, medicos, irAEjecutarVisita }) => (
    <>
        <h3 className="text-xs font-black text-[#02CFE3] px-1 uppercase tracking-widest mb-3">
            Visitas Pendientes / Programadas ({visitasPendientesFiltradas.length})
        </h3>

        <div className="space-y-3">
            {visitasPendientesFiltradas.map((visita) => {
                const medicoData = medicos.find(m => m.id === visita.medico_id);
                
                // Definimos el contenido interno de la card
                const CardContent = (
                    <div className="p-3.5 flex gap-3 items-center w-full text-left">
                        {/* Ícono de Calendario Izquierdo */}
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#02CFE3]/10 text-[#02CFE3] shrink-0">
                            <FaCalendarDays size={16} />
                        </div>

                        {/* Información del Médico */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                                {medicoData
                                    ? `${medicoData.nombre} ${medicoData.apellido}`
                                    : 'Médico Desconocido'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                <p className="text-[11px] text-[#02CFE3] font-bold uppercase tracking-tight">
                                    {medicoData?.especialidad || 'General'}
                                </p>
                                <span className="text-[9px] bg-amber-500/10 text-amber-600 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/20">
                                    Prog: {visita.fecha_programada
                                        ? visita.fecha_programada.split(' ')[0]
                                        : 'Sin fecha'}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                <FaLocationDot className="text-slate-300 shrink-0" />
                                {medicoData?.direccion_detalles || medicoData?.direccion || 'Dirección no registrada'}
                            </p>
                        </div>

                        {/* Botón de Acción Rápida: Ejecutar/Realizar Visita */}
                        <button
                            type="button"
                            onClick={(e) => {
                                // IMPORTANTE: Evita que al pulsar este botón se active el link hacia MedicoDetalle
                                e.preventDefault(); 
                                e.stopPropagation();
                                irAEjecutarVisita(visita.medico_id, visita.id);
                            }}
                            title="Realizar visita"
                            className="w-9 h-9 bg-gradient-to-r from-[#02CFE3] to-[#1C85E8] text-white rounded-xl flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-90 shrink-0"
                        >
                            {/* Ícono de 'Play/Acción' moderno que representa Realizar/Ejecutar */}
                            <FaPlay className="text-xs ml-0.5" />
                        </button>
                    </div>
                );

                // Si tenemos la data del médico, toda la Card es un Link interactivo
                if (medicoData) {
                    return (
                        <Link
                            key={visita.id}
                            href={`/visitador/top-medicos/${medicoData.documento}?origen=panel`}
                            className="block bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm border border-white/40 hover:bg-white transition-all duration-200 active:scale-[0.99] overflow-hidden"
                        >
                            {CardContent}
                        </Link>
                    );
                }

                // Fallback por si la data del médico no existe
                return (
                    <div
                        key={visita.id}
                        className="bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm border border-white/40 overflow-hidden"
                    >
                        {CardContent}
                    </div>
                );
            })}
        </div>

        {visitasPendientesFiltradas.length === 0 && (
            <div className="text-center py-12 bg-white/50 rounded-[24px] border border-dashed border-gray-200 text-gray-400 text-xs italic">
                No tienes visitas programadas pendientes.
            </div>
        )}
    </>
);

export default PendientesTab;