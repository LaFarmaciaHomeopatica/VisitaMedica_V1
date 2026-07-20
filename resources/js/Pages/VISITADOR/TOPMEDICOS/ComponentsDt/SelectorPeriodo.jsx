import React, { useState } from 'react';
import { FaCalendarDays, FaXmark } from 'react-icons/fa6';

const PERIODOS = [
    { key: 'mes_actual', label: 'Mes Actual' },
    { key: 'all',        label: 'Todo' },
];

// ─── Selector de período ───────────────────────────────────────────────────
const SelectorPeriodo = ({ periodoActivo, fechaDesdeActiva, fechaHastaActiva, onCambiarPeriodo, onPeriodoPersonalizado }) => {
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [fechaDesdeInput, setFechaDesdeInput] = useState(fechaDesdeActiva || '');
    const [fechaHastaInput, setFechaHastaInput] = useState(fechaHastaActiva || '');

    const handleAplicar = () => {
        if (!fechaDesdeInput || !fechaHastaInput) return;
        onPeriodoPersonalizado(fechaDesdeInput, fechaHastaInput, () => setMostrarCalendario(false));
    };

    return (
        <div className="flex flex-wrap items-center gap-2 px-1 relative">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-1">Período:</p>
            {PERIODOS.map(p => (
                <button
                    key={p.key}
                    onClick={() => onCambiarPeriodo(p.key)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border active:scale-95 ${
                        periodoActivo === p.key
                            ? 'bg-[#1C85E8] text-white border-transparent shadow-sm shadow-blue-100'
                            : 'bg-white/80 backdrop-blur-md text-gray-400 border-white/40 hover:text-[#1C85E8] hover:border-[#1C85E8]/30'
                    }`}
                >
                    {p.label}
                </button>
            ))}

            <button
                onClick={() => setMostrarCalendario(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border active:scale-95 ${
                    periodoActivo === 'custom'
                        ? 'bg-[#1C85E8] text-white border-transparent shadow-sm shadow-blue-100'
                        : 'bg-white/80 backdrop-blur-md text-gray-400 border-white/40 hover:text-[#1C85E8] hover:border-[#1C85E8]/30'
                }`}
            >
                <FaCalendarDays className="h-3 w-3" />
                {periodoActivo === 'custom' && fechaDesdeActiva && fechaHastaActiva
                    ? `${fechaDesdeActiva} → ${fechaHastaActiva}`
                    : 'Personalizado'}
            </button>

            {mostrarCalendario && (
                <div className="absolute top-full left-0 mt-2 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex flex-col gap-3 w-full max-w-xs">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Rango personalizado</p>
                        <button onClick={() => setMostrarCalendario(false)} className="text-gray-300 hover:text-gray-500">
                            <FaXmark size={12} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black uppercase text-gray-400">
                            Desde
                            <input
                                type="date"
                                value={fechaDesdeInput}
                                max={fechaHastaInput || undefined}
                                onChange={e => setFechaDesdeInput(e.target.value)}
                                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </label>
                        <label className="text-[9px] font-black uppercase text-gray-400">
                            Hasta
                            <input
                                type="date"
                                value={fechaHastaInput}
                                min={fechaDesdeInput || undefined}
                                onChange={e => setFechaHastaInput(e.target.value)}
                                className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-300"
                            />
                        </label>
                    </div>
                    <button
                        onClick={handleAplicar}
                        disabled={!fechaDesdeInput || !fechaHastaInput}
                        className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-[#1C85E8] text-white disabled:opacity-40 transition-all active:scale-95"
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
    );
};

export default SelectorPeriodo;
