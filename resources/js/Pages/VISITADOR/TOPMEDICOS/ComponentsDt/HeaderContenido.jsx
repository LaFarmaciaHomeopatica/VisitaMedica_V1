import React from 'react';
import { Link } from '@inertiajs/react';
import { FaArrowLeft, FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { MODOS } from '../helpers.jsx';
import Paginador from './Paginador';

// ─── Contenido del header flotante: volver + buscador + tabs de modo + paginador ──
const HeaderContenido = ({
    backUrl,
    busqueda,
    onBusquedaChange,
    onLimpiarBusqueda,
    busquedaDeshabilitada,
    cfg,
    modo,
    onModo,
    totalFiltrados,
    porPagina,
    pagina,
    onPagina,
    onPorPagina,
}) => (
    <>
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 pt-4 pb-3 flex items-center gap-3">
            <Link
                href={backUrl}
                className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
            >
                <FaArrowLeft size={13} />
            </Link>

            <div className="relative flex-grow max-w-4xl">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                    <FaMagnifyingGlass className="text-xs md:text-sm" />
                </span>
                <input
                    type="text"
                    placeholder="Buscar producto, código, laboratorio..."
                    value={busqueda}
                    disabled={busquedaDeshabilitada}
                    onChange={onBusquedaChange}
                    className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700 disabled:opacity-50"
                />
                {busqueda && (
                    <button
                        type="button"
                        onClick={onLimpiarBusqueda}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <FaXmark size={12} />
                    </button>
                )}
            </div>
        </div>

        <div className={`bg-gradient-to-r ${cfg.gradiente} rounded-b-[30px] md:rounded-b-[40px] px-4 md:px-6 py-3 space-y-3`}>
            <div className="max-w-[1440px] mx-auto space-y-2.5">
                <div className="bg-white/10 p-1 rounded-2xl flex gap-1 border border-white/10">
                    {Object.entries(MODOS).map(([key, m]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onModo(key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200
                                ${modo === key ? m.activeBtn : 'text-white hover:bg-white/10'}`}
                        >
                            {m.icon} {m.label}
                        </button>
                    ))}
                </div>

                <Paginador
                    total={totalFiltrados}
                    porPagina={porPagina}
                    pagina={pagina}
                    onPagina={onPagina}
                    onPorPagina={onPorPagina}
                />
            </div>
        </div>
    </>
);

export default HeaderContenido;
