import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

// ─── Paginador ────────────────────────────────────────────────────────────────
const Paginador = ({ total, porPagina, pagina, onPagina, onPorPagina }) => {
    const totalPaginas = Math.max(1, Math.ceil(total / (porPagina || 1)));

    // Estado local del texto del input, independiente de porPagina,
    // para poder borrar libremente sin que React lo "regrese" al valor anterior.
    const [inputValue, setInputValue] = useState(String(porPagina));

    // Si porPagina cambia desde afuera (ej: al cambiar de página), sincronizamos.
    useEffect(() => {
        setInputValue(String(porPagina));
    }, [porPagina]);

    const handleChange = (e) => {
        const raw = e.target.value;
        setInputValue(raw); // permite dejarlo vacío mientras se escribe

        const v = parseInt(raw, 10);
        if (!isNaN(v) && v >= 1) {
            onPorPagina(v);
        }
    };

    const handleBlur = () => {
        // Si al salir del campo quedó vacío o inválido, regresamos al último valor válido
        const v = parseInt(inputValue, 10);
        if (isNaN(v) || v < 1) {
            setInputValue(String(porPagina));
        }
    };

    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <div className="bg-[#1C85E8] text-white text-xs font-black px-3 py-1.5 rounded-2xl shadow-sm">
                    {total}
                </div>
                <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                        Mostrar
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={total}
                        value={inputValue}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-14 text-center text-xs font-black text-white bg-white/20 border border-white/30 rounded-xl py-1.5 px-2 outline-none focus:ring-2 focus:ring-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onPagina(pagina - 1)}
                    disabled={pagina <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/20 border border-white/30 text-white disabled:opacity-30 hover:bg-white/30 transition-colors"
                >
                    <FaChevronLeft size={9} />
                </button>

                <div className="bg-white/20 border border-white/30 text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1">
                    PÁG. <span>{pagina}</span>
                    <span className="opacity-60">/ {totalPaginas}</span>
                </div>

                <button
                    type="button"
                    onClick={() => onPagina(pagina + 1)}
                    disabled={pagina >= totalPaginas}
                    className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/20 border border-white/30 text-white disabled:opacity-30 hover:bg-white/30 transition-colors"
                >
                    <FaChevronRight size={9} />
                </button>
            </div>
        </div>
    );
};

export default Paginador;
