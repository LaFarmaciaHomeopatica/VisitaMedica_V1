import React from 'react';
import { Link } from '@inertiajs/react';
import { FaCalendarDays, FaLocationDot, FaChevronRight } from 'react-icons/fa6';

/**
 * Pestaña "Visitas Pendientes": muestra las visitas programadas sin ejecutar.
 */
const PendientesTab = ({ visitasPendientesFiltradas, medicos, irAEjecutarVisita }) => (
    <>
        <h3 className="text-xs font-black text-[#02CFE3] px-1 uppercase tracking-widest">
            Visitas Pendientes / Programadas ({visitasPendientesFiltradas.length})
        </h3>

        {visitasPendientesFiltradas.map((visita) => {
            const medicoData = medicos.find(m => m.id === visita.medico_id);
            return (
                <div
                    key={visita.id}
                    className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] flex gap-4 items-center shadow-sm border border-white/40 hover:shadow-md transition-shadow duration-300"
                >
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#02CFE3]/10 text-[#02CFE3] shrink-0">
                        <FaCalendarDays size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                            {medicoData
                                ? `${medicoData.nombre} ${medicoData.apellido}`
                                : 'Médico Desconocido'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <p className="text-xs text-[#02CFE3] font-bold uppercase tracking-tight">
                                {medicoData?.especialidad || 'General'}
                            </p>
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                                Prog: {visita.fecha_programada
                                    ? visita.fecha_programada.split(' ')[0]
                                    : 'Sin fecha'}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                            <FaLocationDot className="text-slate-300 shrink-0" />
                            {medicoData?.direccion_detalles || medicoData?.direccion || 'Dirección no registrada'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => irAEjecutarVisita(visita.medico_id, visita.id)}
                            className="bg-gradient-to-r from-[#02CFE3] to-[#1C85E8] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm hover:scale-105 active:scale-95"
                        >
                            Ejecutar
                        </button>

                        {medicoData && (
                            <Link
                                href={`/MedicoDetalle/${medicoData.id}`}
                                className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all active:scale-90"
                            >
                                <FaChevronRight className="text-xs" />
                            </Link>
                        )}
                    </div>
                </div>
            );
        })}

        {visitasPendientesFiltradas.length === 0 && (
            <div className="text-center py-16 bg-white/50 rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                No tienes visitas programadas pendientes.
            </div>
        )}
    </>
);

export default PendientesTab;