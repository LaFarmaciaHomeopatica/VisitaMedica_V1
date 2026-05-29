import React from 'react';
import { Link } from '@inertiajs/react';
import {
    FaCheckDouble,
    FaStethoscope,
    FaLocationDot,
    FaChevronRight,
} from 'react-icons/fa6';

/**
 * Pestaña "Mi Agenda": lista de médicos asignados al visitador.
 */
const AgendaTab = ({ medicosFiltrados, fueVisitado, irAAgendarVisita }) => (
    <>
        <h3 className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest">
            Médicos en mi Agenda ({medicosFiltrados.length})
        </h3>

        {medicosFiltrados.map((medico) => {
            const visitado = fueVisitado(medico.id);
            return (
                <div
                    key={medico.id}
                    className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] flex gap-4 items-center shadow-sm border border-white/40 hover:shadow-md transition-shadow duration-300"
                >
                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors shrink-0
                        ${visitado ? 'bg-[#24C765]/10 text-[#24C765]' : 'bg-[#1C85E8]/10 text-[#1C85E8]'}`}>
                        {visitado ? <FaCheckDouble size={18} /> : <FaStethoscope size={18} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                            {medico.nombre} {medico.apellido}
                        </h4>
                        <p className="text-xs text-[#1C85E8] font-bold uppercase tracking-tight mt-0.5">
                            {medico.especialidad || 'General'}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                            <FaLocationDot className="text-slate-300 shrink-0" />
                            {medico.direccion_detalles || medico.direccion || 'Dirección no registrada'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {!visitado ? (
                            <button
                                onClick={() => irAAgendarVisita(medico.id)}
                                className="bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] hover:from-[#156DBF] hover:to-[#02B2C4] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-blue-100 hover:scale-105 active:scale-95"
                            >
                                Gestionar
                            </button>
                        ) : (
                            <span className="text-[9px] font-black text-[#24C765] uppercase bg-[#24C765]/10 px-2.5 py-1.5 rounded-lg border border-[#24C765]/20">
                                Visitado
                            </span>
                        )}

                        <Link
                            href={`/MedicoDetalle/${medico.id}`}
                            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-500 transition-all active:scale-90"
                        >
                            <FaChevronRight className="text-xs" />
                        </Link>
                    </div>
                </div>
            );
        })}

        {medicosFiltrados.length === 0 && (
            <div className="text-center py-16 bg-white/50 rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                No se encontraron médicos asignados.
            </div>
        )}
    </>
);

export default AgendaTab;