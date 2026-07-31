import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BarraNave from '../barranave'; 
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaUserDoctor,
    FaBell,
    FaArrowUp,
    FaArrowDown,
    FaMinus,
    FaSpinner,
    FaChevronLeft,
    FaChevronRight
} from 'react-icons/fa6';

const Alerta = ({
    datosAlertas = null,
    mesActual = '',
    periodoALabel = '',
    periodoBLabel = '',
    perPageInicial = 10,
    paginaInicial = 1,
}) => {

    // ── Estados Locales ──
    const [search, setSearch] = useState('');
    const [mesFiltro, setMesFiltro] = useState(mesActual);
    const [perPage, setPerPage] = useState(perPageInicial);
    const [perPageInput, setPerPageInput] = useState(String(perPageInicial));
    const [cargando, setCargando] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(180);
    const headerRef = useRef(null);

    const datosListos = datosAlertas !== null;
    const medicosAlertas = datosAlertas?.medicosAlertas ?? [];
    const pagination = datosAlertas?.pagination ?? {
        total: 0,
        per_page: perPage,
        current_page: paginaInicial,
        last_page: 1,
    };

    // ── Petición a la vista actual pidiendo SOLO la data pesada (Odoo) ──
    // Esto hace que la vista entre de inmediato (skeleton) y los datos
    // se vayan cargando en segundo plano, sin bloquear la navegación.
    const irA = (params = {}) => {
        router.get('/visitador/alertas', {
            mes: mesFiltro,
            page: pagination.current_page || 1,
            per_page: perPage,
            ...params,
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['datosAlertas'],
            onStart: () => setCargando(true),
            onFinish: () => setCargando(false),
        });
    };

    // ── Disparar carga diferida al entrar a la vista ──
    useEffect(() => {
        irA({ page: paginaInicial, per_page: perPageInicial, mes: mesActual });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Medir Header dinámicamente ──
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

    const bloqueado = !datosListos || cargando;

    const medicosFiltrados = datosListos
        ? medicosAlertas.filter(medico =>
            medico.nombre.toLowerCase().includes(search.toLowerCase()) ||
            medico.especialidad.toLowerCase().includes(search.toLowerCase()) ||
            medico.documento.includes(search)
          )
        : [];

    const handleSearch = (e) => setSearch(e.target.value);

    const handleMesChange = (e) => {
        const newMes = e.target.value;
        setMesFiltro(newMes);
        irA({ mes: newMes, page: 1 });
    };

    // ── Cambios de página ──
    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina < 1 || nuevaPagina > pagination.last_page) return;
        irA({ page: nuevaPagina });
    };

    // ── Cantidad de registros por página (input libre) ──
    const PER_PAGE_MIN = 1;
    const PER_PAGE_MAX = 200;

    // Mientras se escribe: solo filtra dígitos y deja borrar todo (incluso vacío)
    const handlePerPageInputChange = (e) => {
        const soloDigitos = e.target.value.replace(/\D/g, '');
        setPerPageInput(soloDigitos);
    };

    // Al confirmar (blur o Enter): valida, aplica límites y dispara la carga
    const confirmarPerPage = () => {
        let valor = parseInt(perPageInput, 10);

        if (isNaN(valor) || valor < PER_PAGE_MIN) valor = PER_PAGE_MIN;
        if (valor > PER_PAGE_MAX) valor = PER_PAGE_MAX;

        setPerPageInput(String(valor));

        if (valor !== perPage) {
            setPerPage(valor);
            irA({ per_page: valor, page: 1 });
        }
    };

    const handlePerPageKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); // dispara el onBlur -> confirmarPerPage
        }
    };

    const handleMedicoClick = (documento) => {
        if (bloqueado) return;
        router.get(`/visitador/alertas/${documento}`, { mes: mesFiltro });
    };

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

    const SkeletonCard = () => (
        <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-white/40 animate-pulse flex justify-between h-20 items-center">
            <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="w-[40%] h-full bg-gray-150/50 rounded-lg"></div>
        </div>
    );

    return (
        <>
            <Head title="Alertas de Rendimiento - LFH" />

            {/* Header Flotante */}
            <header 
                ref={headerRef}
                className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md shadow-sm rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20"
            >
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
                                Alertas de Médicos
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
                                disabled={bloqueado}
                                placeholder={datosListos ? "Buscar médico, especialidad..." : "Cargando listado de médicos..."}
                                className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700 disabled:opacity-60"
                            />
                        </div>
                    </div>
                </div>

                {/* Sub-Header con Filtro de Mes y Barra de Paginación Estilo Imagen */}
                <div className="bg-gradient-to-r from-[#1C85E8] to-[#0A69C2] rounded-b-[30px] md:rounded-b-[40px] px-5 py-3">
                    <div className="max-w-[1440px] mx-auto flex flex-col gap-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 w-fit">
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Comparar con:</span>
                                    <input
                                        type="month"
                                        value={mesFiltro}
                                        onChange={handleMesChange}
                                        className="bg-white/20 border-none rounded-md py-0.5 px-2 text-xs font-black text-white outline-none w-36 text-center focus:ring-2 focus:ring-white/50 [color-scheme:dark]"
                                    />
                                </div>
                                {periodoALabel && periodoBLabel && (
                                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider pl-1">
                                        Comparando {periodoALabel} vs {periodoBLabel}
                                    </span>
                                )}
                            </div>

                            {/* BARRA DE PAGINACIÓN ADAPTADA SEGÚN LA IMAGEN */}
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0">
                                {/* Total registros */}
                                <span className="text-white font-black text-sm md:text-base">
                                    {pagination.total}
                                </span>

                                {/* Controles centrales */}
                                <div className="flex items-center gap-2">
                                    {/* Botón Anterior */}
                                    <button
                                        onClick={() => cambiarPagina(pagination.current_page - 1)}
                                        disabled={pagination.current_page <= 1 || bloqueado}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-white/20 active:scale-95"
                                    >
                                        <FaChevronLeft className="text-xs" />
                                    </button>

                                    {/* Etiqueta PÁG. [ 1 ] / 16 */}
                                    <div className="flex items-center gap-1.5 text-white text-xs font-black tracking-wider uppercase">
                                        <span>PÁG.</span>
                                        <span className="bg-white/30 text-white px-2.5 py-1 rounded-xl text-xs font-black min-w-[28px] text-center flex items-center justify-center">
                                            {cargando ? <FaSpinner className="animate-spin text-[10px]" /> : pagination.current_page}
                                        </span>
                                        <span className="opacity-80">/ {pagination.last_page}</span>
                                    </div>

                                    {/* Botón Siguiente */}
                                    <button
                                        onClick={() => cambiarPagina(pagination.current_page + 1)}
                                        disabled={pagination.current_page >= pagination.last_page || bloqueado}
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-white/20 active:scale-95"
                                    >
                                        <FaChevronRight className="text-xs" />
                                    </button>
                                </div>

                                {/* Cantidad de registros por página (editable libremente) */}
                                <div className="flex items-center gap-1.5">
                                    <span className="hidden sm:inline text-[9px] font-black text-white/70 uppercase tracking-wider">
                                        Ver
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={perPageInput}
                                        onChange={handlePerPageInputChange}
                                        onBlur={confirmarPerPage}
                                        onKeyDown={handlePerPageKeyDown}
                                        disabled={bloqueado}
                                        placeholder="10"
                                        className="bg-white/30 hover:bg-white/40 focus:bg-white text-white focus:text-gray-800 w-14 px-2 py-1 rounded-xl text-xs font-black outline-none border-none text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido Principal */}
            <div 
                className="bg-[#E5F4FF] min-h-screen pb-28 font-sans text-gray-800 transition-[padding-top] duration-200"
                style={{ paddingTop: `${headerHeight}px` }}
            >
                <main className="max-w-[1440px] mx-auto px-4 md:px-6 space-y-4">
                    
                    {!datosListos ? (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest flex items-center gap-2">
                                <FaSpinner className="text-sm text-[#02CFE3] animate-spin" /> 
                                Consultando métricas en tiempo real...
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {Array.from({ length: Math.min(perPage, 6) || 3 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        </div>
                    ) : medicosFiltrados.length > 0 ? (
                        <div className={`space-y-4 transition-opacity duration-200 ${cargando ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <h3 className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest flex items-center gap-2">
                                {cargando ? (
                                    <FaSpinner className="text-sm text-[#02CFE3] animate-spin" />
                                ) : (
                                    <FaBell className="text-sm text-[#02CFE3]" />
                                )}
                                {cargando ? 'Actualizando resultados...' : 'Mostrando médicos ordenados por alertas críticas'}
                            </h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {medicosFiltrados.map((medico) => (
                                    <button
                                        key={medico.documento}
                                        onClick={() => handleMedicoClick(medico.documento)}
                                        className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-white/40 hover:shadow-md hover:scale-[1.002] active:scale-[0.995] transition-all duration-200 overflow-hidden flex text-left w-full items-stretch"
                                    >
                                        <div className="flex flex-col md:flex-row items-stretch w-full relative">
                                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#1C85E8] to-[#0A69C2]" />
                                            
                                            <div className="flex-1 p-4 pl-5 flex flex-col justify-center bg-white/30 border-r border-gray-150">
                                                <h4 className="font-bold text-gray-800 text-xs md:text-sm leading-tight mb-1 flex items-center gap-2">
                                                    {medico.nombre}
                                                </h4>
                                                <div className="flex flex-wrap gap-2 items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                                    <span className="text-[#1C85E8] bg-blue-50/60 px-1.5 py-0.5 rounded-md">
                                                        {medico.especialidad}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-full md:w-[60%] shrink-0 grid grid-cols-2 text-center bg-gray-50/20">
                                                {/* Tabla Formulado */}
                                                <div className="border-r border-gray-150 flex flex-col">
                                                    <div className="py-1 px-2 text-[8px] font-black text-[#1C85E8] bg-blue-50/30 uppercase tracking-wider border-b border-gray-150">
                                                        Formulado
                                                    </div>
                                                    <div className="grid grid-cols-3 flex-grow divide-x divide-gray-150/40 text-[9px] md:text-[10px] items-center">
                                                        <div className="py-2.5">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Ant</span>
                                                            <strong className="text-gray-700">{medico.totales.formulado_mes_anterior}</strong>
                                                        </div>
                                                        <div className="py-2.5">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Act</span>
                                                            <strong className="text-gray-700">{medico.totales.formulado_mes_actual}</strong>
                                                        </div>
                                                        <div className="py-2.5 flex flex-col items-center justify-center">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Dif</span>
                                                            <RendimientoIndicador 
                                                                tendencia={medico.totales.formulado_tendencia} 
                                                                diferencia={medico.totales.formulado_diferencia} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Tabla Comprado */}
                                                <div className="flex flex-col">
                                                    <div className="py-1 px-2 text-[8px] font-black text-green-600 bg-green-50/30 uppercase tracking-wider border-b border-gray-150">
                                                        Comprado
                                                    </div>
                                                    <div className="grid grid-cols-3 flex-grow divide-x divide-gray-150/40 text-[9px] md:text-[10px] items-center">
                                                        <div className="py-2.5">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Ant</span>
                                                            <strong className="text-gray-700">{medico.totales.comprado_mes_anterior}</strong>
                                                        </div>
                                                        <div className="py-2.5">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Act</span>
                                                            <strong className="text-gray-700">{medico.totales.comprado_mes_actual}</strong>
                                                        </div>
                                                        <div className="py-2.5 flex flex-col items-center justify-center">
                                                            <span className="block text-[6.5px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Dif</span>
                                                            <RendimientoIndicador 
                                                                tendencia={medico.totales.comprado_tendencia} 
                                                                diferencia={medico.totales.comprado_diferencia} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                            <FaUserDoctor className="text-4xl text-gray-200 mb-3 mx-auto block" />
                            No se encontraron médicos con datos en este filtro.
                        </div>
                    )}
                </main>

                <BarraNave />
            </div>
        </>
    );
};

export default Alerta;