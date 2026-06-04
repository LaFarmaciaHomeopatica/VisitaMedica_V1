import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import BarraNave from '../barranave'; 
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaFileMedical,
    FaArrowUp,
    FaArrowDown,
    FaMinus,
    FaUserDoctor
} from 'react-icons/fa6';

const ProductosAlerta = ({ medico = {}, productosAlertas = [], mesActual = '' }) => {
    // ── Estados Locales ──
    const [search, setSearch] = useState('');

    // Estado para controlar la altura exacta del header flotante
    const [headerHeight, setHeaderHeight] = useState(180);
    const headerRef = useRef(null);

    // ── Efecto para medir el Header dinámicamente ──
    useEffect(() => {
        if (!headerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setHeaderHeight(entry.contentBoxSize[0].blockSize + 16);
            }
        });

        resizeObserver.observe(headerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Filters products based on search query
    const productosFiltrados = productosAlertas.filter(prod => 
        prod.nombre.toLowerCase().includes(search.toLowerCase()) ||
        prod.laboratorio.toLowerCase().includes(search.toLowerCase()) ||
        prod.codigo.includes(search)
    );

    const handleSearch = (e) => setSearch(e.target.value);

    // Helper component to render trend indicator badge/icon
    const RendimientoIndicador = ({ tendencia, diferencia }) => {
        const isUp = tendencia === 'subio';
        const isDown = tendencia === 'bajo';

        let colorClass = 'text-gray-400 bg-gray-50';
        let Icon = FaMinus;
        let sign = '';

        if (isUp) {
            colorClass = 'text-green-600 bg-green-50 border border-green-200';
            Icon = FaArrowUp;
            sign = '+';
        } else if (isDown) {
            colorClass = 'text-red-600 bg-red-50 border border-red-200';
            Icon = FaArrowDown;
        }

        return (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${colorClass}`}>
                <Icon className="text-[7px]" />
                {sign}{diferencia}
            </span>
        );
    };

    return (
        <>
            <Head title={`Productos Alerta - ${medico.nombre} - LFH`} />

            {/* ── Header Flotante (Con referencia de medición) ── */}
            <header 
                ref={headerRef}
                className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md shadow-sm rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20"
            >
                {/* Fila 1: Regresar + Título + Búsqueda */}
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">
                        <Link
                            href={`/visitador/alertas?mes=${mesActual}`}
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                        >
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        <div className="hidden md:flex flex-col min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1C85E8]/70 leading-none mb-0.5">
                                Médico Asignado
                            </p>
                            <h1 className="text-xs md:text-sm font-black text-[#1C85E8] uppercase tracking-wider whitespace-nowrap">
                                Productos del Médico
                            </h1>
                        </div>

                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs md:text-sm" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Buscar producto por nombre, laboratorio o código..."
                                className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Fila 2: Gradiente Corporativo con Información del Médico */}
                <div className="bg-gradient-to-r from-[#1C85E8] via-[#02CFE3] to-[#24C765] rounded-b-[30px] md:rounded-b-[40px] px-5 py-3.5 text-white">
                    <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-full border border-white/20 flex items-center justify-center">
                                <FaUserDoctor className="text-lg" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-wider leading-tight">
                                    {medico.nombre}
                                </h2>
                                <p className="text-[10px] font-bold text-white/80 uppercase tracking-tight">
                                    Doc: {medico.documento} • {medico.especialidad}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/95 text-[10px] font-black uppercase tracking-wider bg-white/15 px-3 py-1.5 rounded-full border border-white/10 self-start sm:self-auto">
                            <span>Período: {mesActual}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Contenido Principal (Inyecta la altura exacta calculada) ── */}
            <div 
                className="bg-[#E5F4FF] min-h-screen pb-28 font-sans text-gray-800 transition-[padding-top] duration-200"
                style={{ paddingTop: `${headerHeight}px` }}
            >
                <main className="max-w-[1440px] mx-auto px-4 md:px-6 space-y-4">
                    
                    <h3 className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        <FaFileMedical className="text-sm text-[#02CFE3]" /> 
                        Mostrando {productosFiltrados.length} productos ordenados por alertas críticas
                    </h3>

                    {/* ── Listado de Tarjetas en Sistema de Grilla (1 o 2 Columnas) ── */}
                    {productosFiltrados.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {productosFiltrados.map((prod) => {
                                return (
                                    <div
                                        key={prod.codigo}
                                        className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-white/40 hover:shadow-md transition-all duration-200 overflow-hidden flex text-left w-full items-stretch"
                                    >
                                        <div className="flex flex-col md:flex-row items-stretch w-full relative">
                                            {/* Acento lateral degradado */}
                                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#1C85E8] to-[#24C765]" />
                                            
                                            {/* Left Section: Product Details */}
                                            <div className="flex-1 p-4 pl-5 flex flex-col justify-center bg-white/30 border-r border-gray-150">
                                                <h4 className="font-bold text-gray-800 text-xs md:text-sm leading-tight mb-1 truncate">
                                                    {prod.nombre}
                                                </h4>
                                                <div className="flex flex-wrap gap-2 items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                                    <span>Cod: {prod.codigo}</span>
                                                    <span>•</span>
                                                    <span className="text-[#1C85E8] bg-blue-50/60 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                                                        {prod.laboratorio}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right Section: Table columns */}
                                            <div className="w-full md:w-[60%] shrink-0 grid grid-cols-2 text-center bg-gray-50/20">
                                                {/* Formulado Sub-Table */}
                                                <div className="border-r border-gray-150 flex flex-col">
                                                    <div className="py-1 px-2 text-[8px] font-black text-[#1C85E8] bg-blue-50/30 uppercase tracking-wider border-b border-gray-150">
                                                        Formulado
                                                    </div>
                                                    <div className="grid grid-cols-3 flex-grow divide-x divide-gray-150/40 text-[9px] md:text-[10px] items-center">
                                                        <div className="py-2.5">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Ant</span>
                                                            <strong className="text-gray-700">{prod.formulado_mes_anterior}</strong>
                                                        </div>
                                                        <div className="py-2.5">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Act</span>
                                                            <strong className="text-gray-700">{prod.formulado_mes_actual}</strong>
                                                        </div>
                                                        <div className="py-2.5 flex flex-col items-center justify-center">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Dif</span>
                                                            <RendimientoIndicador 
                                                                tendencia={prod.formulado_tendencia} 
                                                                diferencia={prod.formulado_diferencia} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Comprado Sub-Table */}
                                                <div className="flex flex-col">
                                                    <div className="py-1 px-2 text-[8px] font-black text-green-600 bg-green-50/30 uppercase tracking-wider border-b border-gray-150">
                                                        Comprado
                                                    </div>
                                                    <div className="grid grid-cols-3 flex-grow divide-x divide-gray-150/40 text-[9px] md:text-[10px] items-center">
                                                        <div className="py-2.5">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Ant</span>
                                                            <strong className="text-gray-700">{prod.comprado_mes_anterior}</strong>
                                                        </div>
                                                        <div className="py-2.5">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Act</span>
                                                            <strong className="text-gray-700">{prod.comprado_mes_actual}</strong>
                                                        </div>
                                                        <div className="py-2.5 flex flex-col items-center justify-center">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Dif</span>
                                                            <RendimientoIndicador 
                                                                tendencia={prod.comprado_tendencia} 
                                                                diferencia={prod.comprado_diferencia} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* State Vacío */
                        <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                            <FaFileMedical className="text-4xl text-gray-200 mb-3 mx-auto block" />
                            No se encontraron productos con transacciones para este médico en este filtro.
                        </div>
                    )}
                </main>

                <BarraNave />
            </div>
        </>
    );
};

export default ProductosAlerta;
