import React from 'react';
import { Link } from '@inertiajs/react';
import { FaUserDoctor, FaLocationDot } from 'react-icons/fa6';

/**
 * Resultados de búsqueda: médicos asignados que coinciden con el término
 * pero no tienen una visita pendiente (por eso no aparecen en "Pendientes").
 * Solo se renderiza mientras hay una búsqueda activa con coincidencias.
 */
const MedicosCoincidentes = ({ medicos }) => {
    if (!medicos || medicos.length === 0) return null;

    return (
        <>
            <h3 className="text-xs font-black text-[#1C85E8] px-1 uppercase tracking-widest mb-3 mt-1">
                Otros médicos que coinciden ({medicos.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {medicos.map((medico) => (
                    <Link
                        key={medico.id}
                        href={`/visitador/top-medicos/${medico.documento}?origen=panel`}
                        className="block bg-white/80 backdrop-blur-md rounded-[20px] shadow-sm border border-white/40 hover:bg-white transition-all duration-200 active:scale-[0.99] overflow-hidden"
                    >
                        <div className="p-3.5 flex gap-3 items-center w-full text-left">
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1C85E8]/10 text-[#1C85E8] shrink-0">
                                <FaUserDoctor size={16} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                                    {medico.nombre || 'Médico sin nombre'}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                    <p className="text-[11px] text-[#1C85E8] font-bold uppercase tracking-tight">
                                        {medico.especialidad || 'General'}
                                    </p>
                                    <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-full">
                                        Sin visita pendiente
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                    <FaLocationDot className="text-slate-300 shrink-0" />
                                    {medico.direccion_detalles || 'Dirección no registrada'}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    );
};

export default MedicosCoincidentes;
