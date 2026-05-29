import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { FaCrown, FaDollarSign, FaChevronRight } from 'react-icons/fa6';

/**
 * Devuelve las clases de color según el puesto en el ranking.
 */
const colorPuesto = (index) => {
    if (index === 0) return 'bg-amber-400/20 text-amber-600 border border-amber-400/30';
    if (index === 1) return 'bg-slate-300/30 text-slate-600';
    if (index === 2) return 'bg-orange-300/20 text-orange-700';
    return 'bg-gray-100 text-gray-500';
};

/**
 * Pestaña "Top N Médicos": ranking de médicos con mayor compra/formulación.
 * El usuario elige cuántos mostrar mediante un input numérico.
 */
const TopMedicosTab = ({ topMedicos, medicos }) => {
    const [limite, setLimite] = useState(5);

  const handleLimite = (e) => {
    const valor = parseInt(e.target.value, 10);
    if (isNaN(valor) || valor < 1) return setLimite('');
    setLimite(valor); // ← sin Math.min
 setLimite(valor); // ← sin Math.min, deja escribir cualquier número
    };
    // Muestra como máximo los que existen en el array
    const listaMostrada = topMedicos.slice(0, limite || 0);

    return (
    <>
        {/* Encabezado + selector */}
        <div className="flex items-center justify-between px-1 mb-1">
            <h3 className="text-xs font-black text-[#24C765] uppercase tracking-widest">
                Top {limite || '?'} Médicos con Mayor Compra
            </h3>

            <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Mostrar
                </label>
                <input
                    type="number"
                    min={1}
                    max={topMedicos.length}
                    value={limite}
                    onChange={handleLimite}
                    className="w-14 text-center text-sm font-black text-[#24C765] bg-[#24C765]/10 border border-[#24C765]/30 rounded-xl py-1.5 px-2 outline-none focus:ring-2 focus:ring-[#24C765]/40 transition-all"
                />
               
            </div>
        </div>

        {listaMostrada.map((medicoTop, index) => {
            const medicoLocal = medicos.find(m => m.documento === medicoTop.documento);
            return (
                <div
                    key={medicoTop.documento}
                    className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] flex gap-4 items-center shadow-md border-2 border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300"
                >
                    <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-2xl shrink-0 font-black text-sm ${colorPuesto(index)}`}>
                        {index === 0 && <FaCrown size={14} className="mb-0.5" />}
                        #{index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                            {medicoTop.nombre}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-tight mt-0.5">
                            {medicoTop.especialidad || 'General'}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            Cédula/Doc: {medicoTop.documento}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="bg-[#24C765]/10 text-[#24C765] px-3 py-1.5 rounded-xl border border-[#24C765]/20 flex items-center gap-0.5 font-black text-xs">
                            <FaDollarSign className="text-[10px]" />
                            {new Intl.NumberFormat('es-CO').format(medicoTop.total_comprado)}
                        </div>

                        {medicoLocal && (
                            <Link
                                href={`/MedicoDetalle/${medicoLocal.id}`}
                                className="text-[10px] text-[#1C85E8] hover:underline font-bold tracking-tight px-1 flex items-center gap-0.5"
                            >
                                Ver Historial <FaChevronRight className="text-[8px]" />
                            </Link>
                        )}
                    </div>
                </div>
            );
        })}

        {topMedicos.length === 0 && (
            <div className="text-center py-16 bg-white/50 rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                Sin datos de transacciones registrados este mes.
            </div>
        )}
    </>
    );
};

export default TopMedicosTab;