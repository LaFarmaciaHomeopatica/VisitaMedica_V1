import React, { useState, useMemo } from 'react';
import { FaBuilding, FaChevronDown, FaHashtag } from 'react-icons/fa6';
import { formatNum } from '../helpers.jsx';

// ─── Acordeón Laboratorios ────────────────────────────────────────────────────
const LaboratoriosAcordeon = ({ laboratoriosComprados = [], laboratoriosFormulados = [], modo }) => {
    const [abierto, setAbierto] = useState(false);
    const [limite, setLimite] = useState(5);

    const lista = useMemo(() => {
        if (modo === 'compradores') return laboratoriosComprados;
        if (modo === 'formuladores') return laboratoriosFormulados;
        const mapa = new Map();
        laboratoriosComprados.forEach((l) => {
            mapa.set(l.laboratorio, { ...l, cantidad_comprada: l.cantidad ?? l.cantidad_comprada ?? 0, valor_comprado: l.valor ?? l.valor_comprado ?? 0, cantidad_formulada: 0, valor_formulado: 0 });
        });
        laboratoriosFormulados.forEach((l) => {
            if (mapa.has(l.laboratorio)) {
                const ex = mapa.get(l.laboratorio);
                mapa.set(l.laboratorio, {
                    ...ex,
                    cantidad_formulada: l.cantidad ?? l.cantidad_formulada ?? 0,
                    valor_formulado: l.valor ?? l.valor_formulado ?? 0,
                });
            } else {
                mapa.set(l.laboratorio, {
                    ...l,
                    cantidad_comprada: 0,
                    valor_comprado: 0,
                    cantidad_formulada: l.cantidad ?? l.cantidad_formulada ?? 0,
                    valor_formulado: l.valor ?? l.valor_formulado ?? 0,
                });
            }
        });
        // Por valor (comprado + formulado), igual que porLaboratorio en el
        // admin (Medico2Controller) — antes ordenaba por cantidad de
        // unidades, lo que podía dar un "top laboratorio" distinto al que
        // ve el admin para el mismo médico.
        return [...mapa.values()].sort(
            (a, b) =>
                ((b.valor_comprado ?? 0) + (b.valor_formulado ?? 0)) -
                ((a.valor_comprado ?? 0) + (a.valor_formulado ?? 0))
        );
    }, [modo, laboratoriosComprados, laboratoriosFormulados]);

    const listaVisible = lista.slice(0, limite);

    const isCompra  = modo === 'compradores';
    const isFormula = modo === 'formuladores';
    const isGeneral = modo === 'general';

    const accentBar  = isCompra ? 'bg-[#24C765]' : isFormula ? 'bg-[#1C85E8]' : 'bg-gradient-to-r from-[#1C85E8] via-[#02CFE3] to-[#24C765]';
    const headerBg   = isCompra ? 'bg-emerald-50 border-emerald-100' : isFormula ? 'bg-blue-50 border-blue-100' : 'bg-sky-50 border-sky-100';
    const headerText = isCompra ? 'text-[#24C765]' : isFormula ? 'text-[#1C85E8]' : 'text-sky-600';
    const rankColor  = () => 'text-slate-400';

    return (
        <div className="bg-white/90 rounded-[22px] border border-white/50 shadow-sm overflow-hidden">
            <button
                type="button"
                onClick={() => setAbierto((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 border ${headerBg} transition-colors`}
            >
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${headerText} bg-white border border-current/20`}>
                        <FaBuilding size={14} />
                    </div>
                    <div className="text-left">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${headerText}`}>
                            Top laboratorios
                        </p>
                        <p className="text-xs font-black text-gray-700">
                            {lista.length} laboratorio{lista.length !== 1 ? 's' : ''} registrados
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div
                        className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden text-[10px] font-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {[5, 10].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLimite(n); }}
                                className={`px-2.5 py-1.5 transition-colors ${
                                    limite === n
                                        ? isCompra
                                            ? 'bg-[#24C765] text-white'
                                            : isFormula
                                            ? 'bg-[#1C85E8] text-white'
                                            : 'bg-sky-500 text-white'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>

                    <FaChevronDown
                        size={12}
                        className={`text-gray-400 transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            <div className={`transition-all duration-300 overflow-hidden ${abierto ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {listaVisible.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-gray-400 italic">
                        Sin laboratorios registrados en este modo.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100/80">
                        {listaVisible.map((lab, i) => {
                            const cantTotal = (lab.cantidad_comprada ?? 0) + (lab.cantidad_formulada ?? 0);
                            const maxCant = listaVisible.reduce(
                                (acc, l) => Math.max(acc, (l.cantidad_comprada ?? 0) + (l.cantidad_formulada ?? 0)),
                                1
                            );
                            const pct = (cantTotal / maxCant) * 100;

                            return (
                                <div key={lab.laboratorio || i} className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center shrink-0 min-w-[32px]">
                                            <span className="text-[8px] font-black text-gray-300 uppercase leading-none">TOP</span>
                                            <span className={`text-sm font-black leading-none ${rankColor(i)}`}>#{i + 1}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-800 truncate">
                                                {lab.laboratorio || 'Sin dato'}
                                            </p>
                                            {lab.productos !== undefined && (
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                                                    <FaHashtag size={8} /> {lab.productos} producto{lab.productos !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-right shrink-0 space-y-0.5">
                                            {(isCompra || isGeneral) && (
                                                <p className="text-[10px] font-black text-[#24C765]">
                                                    {formatNum(lab.cantidad_comprada ?? lab.cantidad ?? 0)}
                                                    <span className="text-[9px] font-bold text-gray-300 ml-0.5">compra</span>
                                                </p>
                                            )}
                                            {(isFormula || isGeneral) && (
                                                <p className="text-[10px] font-black text-[#1C85E8]">
                                                    {formatNum(lab.cantidad_formulada ?? lab.cantidad ?? 0)}
                                                    <span className="text-[9px] font-bold text-gray-300 ml-0.5">fórmula</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${accentBar}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LaboratoriosAcordeon;
