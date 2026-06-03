import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BarraNave from '../barranave'; 
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaUserDoctor,
    FaRankingStar
} from 'react-icons/fa6';

const TopMedicos = ({ topMedicos = [], mesActual = '', filters = {} }) => {
    // ── Estados Locales ──
    const [search, setSearch] = useState(filters.search || '');
    const [mesFiltro, setMesFiltro] = useState(mesActual);
    const [topLimit, setTopLimit] = useState(10);
    const [vistaTipo, setVistaTipo] = useState('general'); 

    // Estado para controlar la altura exacta del header flotante
    const [headerHeight, setHeaderHeight] = useState(180);
    const headerRef = useRef(null);

    // ── Efecto para medir el Header dinámicamente ──
    useEffect(() => {
        if (!headerRef.current) return;

        // Medimos en tiempo real por si cambia el tamaño al rotar la tablet o redimensionar
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                // Le sumamos 16px extra de margen de cortesía para que respire el diseño
                setHeaderHeight(entry.contentBoxSize[0].blockSize + 16);
            }
        });

        resizeObserver.observe(headerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // ── Procesamiento de Datos ──
    const medicosProcesados = [...topMedicos]
        .sort((a, b) => {
            if (vistaTipo === 'compradores') return b.total_comprado - a.total_comprado;
            if (vistaTipo === 'formuladores') return b.total_formulado - a.total_formulado;
            return (b.total_comprado + b.total_formulado) - (a.total_comprado + a.total_formulado);
        })
        .filter(medico => 
            medico.nombre.toLowerCase().includes(search.toLowerCase()) ||
            medico.especialidad.toLowerCase().includes(search.toLowerCase()) ||
            medico.documento.includes(search)
        )
        .slice(0, topLimit);

    const handleSearch = (e) => setSearch(e.target.value);

    return (
        <>
            <Head title="Ranking Top Médicos - LFH" />

            {/* ── Header Flotante (Con referencia de medición) ── */}
            <header 
                ref={headerRef}
                className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md shadow-sm rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20"
            >
                {/* Fila 1: Regresar + Título + Búsqueda */}
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">
                        <Link
                            href="/panel"
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                        >
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        <div className="hidden md:flex flex-col min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1C85E8]/70 leading-none mb-0.5">
                                LFH Rendimiento
                            </p>
                            <h1 className="text-xs md:text-sm font-black text-[#1C85E8] uppercase tracking-wider whitespace-nowrap">
                                Top Médicos del Mes
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
                                placeholder="Filtrar médico por nombre, especialidad o documento..."
                                className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Fila 2: Gradiente Corporativo con Selector Numérico y Botonera Integrada */}
                <div className="bg-gradient-to-r from-[#1C85E8] via-[#02CFE3] to-[#24C765] rounded-b-[30px] md:rounded-b-[40px] px-5 py-3.5">
                    <div className="max-w-[1440px] mx-auto flex flex-col gap-3">
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider">Ver ranking:</span>
                                <div className="flex items-center gap-1 text-xs font-black text-white">
                                    <span className="text-white/70">Top</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={topLimit === 0 ? '' : topLimit}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            setTopLimit(val);
                                        }}
                                        className="bg-white/20 border-none rounded-md py-0.5 px-2 text-xs font-black text-white outline-none w-14 text-center focus:ring-2 focus:ring-white/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="N°"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="bg-white/10 p-1 rounded-2xl flex gap-1 border border-white/10 max-w-md w-full">
                            <button
                                onClick={() => setVistaTipo('general')}
                                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                    vistaTipo === 'general' ? 'bg-white text-gray-800 shadow-sm' : 'text-white hover:bg-white/10'
                                }`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setVistaTipo('compradores')}
                                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                    vistaTipo === 'compradores' ? 'bg-white text-gray-800 shadow-sm' : 'text-white hover:bg-white/10'
                                }`}
                            >
                                Compradores
                            </button>
                            <button
                                onClick={() => setVistaTipo('formuladores')}
                                className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                    vistaTipo === 'formuladores' ? 'bg-white text-gray-800 shadow-sm' : 'text-white hover:bg-white/10'
                                }`}
                            >
                                Formuladores
                            </button>
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
                        <FaRankingStar className="text-sm text-[#02CFE3]" /> 
                        Mostrando {medicosProcesados.length} médicos del Top {topLimit} ({vistaTipo})
                    </h3>

                    {/* ── Listado de Tarjetas en Sistema de Grilla (2 Columnas) ── */}
                    {medicosProcesados.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {medicosProcesados.map((medico, index) => {
                                const puesto = index + 1;

                              return (
    <Link
    key={medico.documento}
    href={`/visitador/top-medicos/${medico.documento}?mes=${mesFiltro}&vista=${vistaTipo}&limit=${topLimit}&search=${search}`}
    className="bg-white/80 backdrop-blur-md rounded-xl flex gap-0 items-stretch shadow-sm border border-white/40 hover:shadow-md hover:scale-[1.002] active:scale-[0.995] transition-all duration-200 overflow-hidden text-left block w-full"
>
    {/* Acento lateral (Ajustado a rounded-l-xl y fino) */}
    <div className={`w-1 shrink-0 rounded-l-xl ${
        vistaTipo === 'compradores' ? 'bg-[#24C765]' : vistaTipo === 'formuladores' ? 'bg-[#1C85E8]' : 'bg-gradient-to-b from-[#1C85E8] via-[#02CFE3] to-[#24C765]'
    }`} />

    {/* Puesto del Ranking (Más esbelto) */}
    <div className="flex flex-col items-center justify-center px-2.5 shrink-0 bg-blue-50/25 border-r border-gray-100/40 min-w-[44px]">
        <span className="text-[8px] font-black text-gray-400/80 uppercase tracking-wider leading-none mb-0.5">TOP</span>
        <span className={`text-xs font-black leading-none ${
            puesto === 1 ? 'text-[#24C765]' : puesto === 2 ? 'text-[#02CFE3]' : puesto === 3 ? 'text-[#1C85E8]' : 'text-slate-400'
        }`}>
            #{puesto}
        </span>
    </div>

    {/* Contenedor Principal (py-2 para máxima finura y px-3.5 para consistencia) */}
    <div className="flex-1 min-w-0 py-2 px-3.5 flex flex-col justify-between gap-1.5">
        
        {/* Fila Superior: Nombre del Médico solo (aprovecha todo el ancho horizontal) */}
        <div className="w-full min-w-0">
            <h4 className="font-bold text-gray-800 text-xs leading-tight truncate">
                {medico.nombre}
            </h4>
        </div>

        {/* Fila Inferior: Valores Financieros distribuidos y Especialidad a la derecha */}
        <div className="flex items-center justify-between gap-3 w-full py-0.5 min-w-0">
            
            {/* Sección Financiera: Expandible mediante flex-1 para llenar el espacio central */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {(vistaTipo === 'general' || vistaTipo === 'compradores') && (
                    <div className="text-left flex-1 min-w-[75px] max-w-[110px]">
                        <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-wider leading-none mb-0.5">Comprado</p>
                        <p className="text-[10.5px] font-black text-gray-700 leading-none truncate">
                            ${medico.total_comprado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                        </p>
                    </div>
                )}
                
                {vistaTipo === 'general' && <div className="w-px h-4.5 bg-gray-200/80 shrink-0 mx-0.5" />}
                
                {(vistaTipo === 'general' || vistaTipo === 'formuladores') && (
                    <div className="text-left flex-1 min-w-[75px] max-w-[110px]">
                        <p className="text-[7.5px] font-black text-gray-400 uppercase tracking-wider leading-none mb-0.5">Formulado</p>
                        <p className="text-[10.5px] font-black text-[#1C85E8] leading-none truncate">
                            ${medico.total_formulado.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                        </p>
                    </div>
                )}
            </div>

            {/* Especialidad: Perfectamente anclada a la derecha del todo como píldora minimalista */}
            <div className="min-w-0 shrink-0 flex justify-end">
                {medico.especialidad && (
                    <p className="text-[8.5px] text-[#1C85E8] font-bold truncate uppercase tracking-tight bg-blue-50/60 border border-blue-100/40 px-1.5 py-0.5 rounded-md max-w-[100px]">
                        <span className="truncate">{medico.especialidad}</span>
                    </p>
                )}
            </div>
            
        </div>
        
    </div>
</Link>
);
                            })}
                        </div>
                    ) : (
                        /* State Vacío */
                        <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                            <FaUserDoctor className="text-4xl text-gray-200 mb-3 mx-auto block" />
                            No se encontraron médicos en este filtro o rango seleccionado.
                        </div>
                    )}
                </main>

                <BarraNave />
            </div>
        </>
    );
};

export default TopMedicos;