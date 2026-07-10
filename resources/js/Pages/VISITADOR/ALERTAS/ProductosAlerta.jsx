import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BarraNave from '../barranave'; 
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaFileMedical,
    FaArrowUp,
    FaArrowDown,
    FaMinus,
    FaCrown,
    FaPhoneFlip,
    FaLocationDot,
    FaCalendarDays,
    FaSpinner 
} from 'react-icons/fa6';

const ProductosAlerta = ({ medico = {}, productosAlertas = null, mesActual = '', puestoReal = null }) => {
    // ── Estados Locales ──
    const [search, setSearch] = useState('');
    const [mostrarDetalles, setMostrarDetalles] = useState(false); 
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [itemsPerPageInput, setItemsPerPageInput] = useState('10');

    // Estado para controlar la altura exacta del header flotante
    const [headerHeight, setHeaderHeight] = useState(180);
    const headerRef = useRef(null);
    
    // Referencia para activar el input de fecha nativo de forma programática
    const monthInputRef = useRef(null);

    // ── 1. Disparar la carga diferida de los datos pesados de Odoo al montar ──
    useEffect(() => {
        router.reload({ only: ['productosAlertas', 'puestoReal'] });
    }, [mesActual]);

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

    const handleMesChange = (e) => {
        const nuevoMes = e.target.value;
        router.get(
            '/visitador/alertas/' + medico.documento, 
            { mes: nuevoMes }, 
            { preserveState: true, replace: true }
        );
    };


    const handleItemsPerPageChange = (e) => {
    const val = e.target.value; // Capturamos lo que escribe el usuario como string
    
    // 1. Permitir que el usuario lo deje vacío para que escriba libremente
    setItemsPerPageInput(val);

    // 2. Si está vacío o es un 0, mantenemos 10 registros por detrás temporalmente para evitar divisiones por cero
    if (val === '' || parseInt(val, 10) <= 0) {
        setItemsPerPage(10);
        return;
    }

    // 3. Si es un número válido, actualizamos el paginador real y volvemos a la página 1
    setItemsPerPage(Number(val));
    setCurrentPage(1);
};

// Asegurar que si el input queda vacío al perder el foco (onBlur), se rellene con el valor real mínimo
const handleItemsPerPageBlur = () => {
    if (itemsPerPageInput === '' || parseInt(itemsPerPageInput, 10) <= 0) {
        setItemsPerPageInput('10');
        setItemsPerPage(10);
    }
};

    const formatMesLabel = (mesString) => {
        if (!mesString) return '';
        const [year, month] = mesString.split('-');
        const meses = [
            'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
        ];
        const index = parseInt(month, 10) - 1;
        return `${meses[index]} DE ${year}`;
    };

    const getMesActualSistema = () => {
        const fecha = new Date();
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const mesSistemaString = getMesActualSistema();

    // Validamos si Odoo terminó de responder
    const datosListos = productosAlertas !== null;

    // Filtrado condicional local
    const productosFiltrados = datosListos
        ? productosAlertas.filter(prod => 
            (prod.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
            (prod.laboratorio || '').toLowerCase().includes(search.toLowerCase()) ||
            (prod.codigo || '').includes(search)
          )
        : [];

    // 🌟 CÁLCULOS MATEMÁTICOS PARA LA PAGINACIÓN LOCAL
    const totalItems = productosFiltrados.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Ajuste por si el filtro reduce las páginas drásticamente
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [productosFiltrados, totalPages, currentPage]);

    // Segmentación de los productos correspondientes a la página actual
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const productosPaginados = productosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1); // Resetea a la primera página al buscar
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

    const telefonoMedico = medico?.telefono || medico?.telefono_contacto || '';
    const direccionMedico = medico?.direccion || medico?.direccion_detalles || '';

    const googleMapsUrl = medico?.geolocalizacion
        ? `https://maps.google.com/?q=${encodeURIComponent(medico.geolocalizacion)}`
        : `https://maps.google.com/?q=${encodeURIComponent(direccionMedico || medico?.nombre || '')}`;

    const SkeletonProductCard = () => (
        <div className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-white/40 animate-pulse flex justify-between h-20 items-center">
            <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-2 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-[45%] h-full bg-gray-150/50 rounded-lg"></div>
        </div>
    );

    return (
        <>
            <Head title={`Productos Alerta - ${medico?.nombre || 'Médico'} - LFH`} />

            {/* Header Flotante Unificado */}
            <header 
                ref={headerRef}
                className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md shadow-sm rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20 overflow-hidden"
            >
                {/* Contenedor Superior: Buscador y Filtros */}
                <div className="max-w-[1440px] mx-auto p-4 md:p-6 pb-2 md:pb-3 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href={`/visitador/alertas?mes=${mesActual}`}
                                className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                            >
                                <FaArrowLeft className="text-xs" /> 
                            </Link>

                            <div className="flex flex-col min-w-0 text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#1C85E8]/70 opacity-70 leading-none mb-0.5">
                                    Panel de Alertas
                                </p>
                                <h1 className="text-xs md:text-sm font-black text-[#1C85E8] uppercase tracking-wider whitespace-nowrap">
                                    Análisis de Tendencias
                                </h1>
                            </div>
                        </div>

                        {/* Barra de Búsqueda */}
                        <div className="relative flex-grow max-w-xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs md:text-sm" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                disabled={!datosListos}
                                placeholder={datosListos ? "Buscar producto por nombre o código..." : "Cargando catálogo de Odoo..."}
                                className="w-full bg-blue-50/50 border-none rounded-full py-2.5 pl-11 pr-4 text-xs focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700 disabled:opacity-60"
                            />
                        </div>

                        {/* Controles de Período */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0 self-end md:self-auto">
                            <div 
                                onClick={() => monthInputRef.current?.showPicker()}
                                className="relative flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-2 pointer-events-none z-10">
                                    <FaCalendarDays className="text-[#1C85E8] text-xs shrink-0" />
                                    <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
                                        <span>Comparar contra:</span>
                                        <span className="text-gray-700 font-black ml-0.5">{formatMesLabel(mesActual)}</span>
                                    </div>
                                </div>
                                <input 
                                    ref={monthInputRef}
                                    type="month" 
                                    value={mesActual} 
                                    onChange={handleMesChange}
                                    className="absolute inset-0 pointer-events-none opacity-0 w-full h-full" 
                                />
                            </div>

                            <div className="flex items-center bg-blue-50/70 border border-blue-200/60 px-4 py-2 rounded-full shadow-sm">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-[#1C85E8]">
                                    Evolución: {formatMesLabel(mesActual).replace('DE ', '')} ➔ {formatMesLabel(mesSistemaString).replace('DE ', '')}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 🌟 BARRA DE PAGINACIÓN PEGAJOSA Y ADHERIDA AL HEADER (FUSIONADA AL BLANCO) */}
                {datosListos && productosFiltrados.length > 0 && (
                    <div className="bg-gradient-to-r from-[#1C85E8] via-[#02CFE3] to-[#24C765] px-6 py-2 flex items-center justify-between text-white text-[10px] md:text-[11px] font-black uppercase tracking-wider select-none border-t border-white/10">
                        
                        {/* Izquierda */}
                        <div className="flex items-center gap-1">
                            <span>{totalItems}</span>
                            <span className="opacity-90 font-bold">productos</span>
                        </div>

                        {/* Centro */}
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="w-5 h-5 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-90 transition-all disabled:opacity-40"
                            >
                                <FaArrowLeft className="text-[7px]" />
                            </button>

                            <div className="flex items-center gap-1 font-bold">
                                <span className="opacity-80 text-[9px]">PÁG.</span>
                                <div className="bg-white/20 px-2.5 py-0.5 rounded font-black min-w-[28px] text-center text-white">
                                    {currentPage}
                                </div>
                                <span className="opacity-80 text-[9px]">/ {totalPages}</span>
                            </div>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="w-5 h-5 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 active:scale-90 transition-all disabled:opacity-40"
                            >
                                <FaArrowLeft className="text-[7px] rotate-180" />
                            </button>
                        </div>

                        {/* Derecha */}
                        <div className="flex items-center gap-1.5 font-bold">
                            <span className="opacity-80 text-[9px]">VER</span>
                           {/* Derecha */}
<div className="flex items-center gap-1.5 font-bold">
    <span className="opacity-80 text-[9px]">VER</span>
    
    {/* 🌟 NUEVO INPUT NUMÉRICO DINÁMICO */}
    <input
        type="number"
        inputMode="numeric"
        pattern="[0-9]*"
        value={itemsPerPageInput}
        onChange={handleItemsPerPageChange}
        onBlur={handleItemsPerPageBlur}
        className="bg-white/20 text-white font-black text-[11px] rounded w-12 py-0.5 border-none focus:ring-0 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    
    <span className="opacity-80 text-[9px]">/ pág.</span>
</div>
                            <span className="opacity-80 text-[9px]">/ pág.</span>
                        </div>
                    </div>
                )}
            </header>

            {/* Contenido Principal */}
            <div 
                className="bg-[#E5F4FF] min-h-screen pb-28 font-sans text-gray-800 transition-[padding-top] duration-200"
                style={{ paddingTop: `${headerHeight}px` }}
            >
                <main className="max-w-[1440px] mx-auto px-4 md:px-6 space-y-4">

                    {/* CARD HERO DEL MÉDICO */}
                    <section className="bg-gradient-to-br from-[#1C85E8] via-[#02CFE3] to-[#24C765] p-6 rounded-[30px] shadow-lg text-white relative">
                        <div className="flex items-start gap-4">
                            
                            {/* Avatar del Puesto Ranking */}
                            {puestoReal === null ? (
                                <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-white/30 bg-white/10 backdrop-blur-md animate-pulse">
                                    <FaSpinner className="text-white text-xs animate-spin" />
                                </div>
                            ) : (
                                (() => {
                                    let colorFondo = "bg-white/20";
                                    if (puestoReal === 1) colorFondo = "bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-200 border-2";
                                    if (puestoReal === 2) colorFondo = "bg-gradient-to-br from-slate-300 to-slate-500 border-slate-200 border-2";
                                    if (puestoReal === 3) colorFondo = "bg-gradient-to-br from-orange-400 to-amber-700 border-orange-300 border-2";

                                    return (
                                        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-white/30 backdrop-blur-md transition-all duration-300 ${colorFondo}`}>
                                            {puestoReal === 1 && <FaCrown size={12} className="text-white mb-0.5 animate-bounce" />}
                                            <span className="text-base font-black text-white leading-none">
                                                #{puestoReal}
                                            </span>
                                        </div>
                                    );
                                })()
                            )}

                            <div className="flex-1 min-w-0 text-left">
                                <h2 className="text-lg font-extrabold text-white leading-tight">
                                    {medico?.nombre || 'Sin Nombre'}
                                </h2>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="text-[9px] font-black uppercase bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
                                        {medico?.especialidad || 'General'}
                                    </span>
                                    <button
                                        onClick={() => setMostrarDetalles(!mostrarDetalles)}
                                        className="bg-white/20 hover:bg-white/35 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/20 transition-all active:scale-95"
                                    >
                                        {mostrarDetalles ? 'Cerrar' : 'Info'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Datos Detallados Desplegables */}
                        {mostrarDetalles && (
                            <div className="bg-white/90 backdrop-blur-md rounded-[20px] border border-white/50 mt-5 p-5 text-slate-800 animate-in slide-in-from-top-2 duration-200 text-left">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Documento</p>
                                        <p className="text-xs font-bold text-gray-700 mt-0.5">
                                            {(medico?.tipo_documento?.nombre || 'CC') + ' ' + (medico?.documento || '—')}
                                        </p>
                                    </div>
                                    <div className="sm:border-l sm:pl-5 border-gray-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Contacto Directo</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs font-bold text-gray-700">{telefonoMedico || 'No registrado'}</p>
                                            {telefonoMedico && (
                                                <a href={`tel:${telefonoMedico}`} className="text-[#24C765] hover:scale-110 transition-transform">
                                                    <FaPhoneFlip className="text-[11px]" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="sm:border-l sm:pl-5 border-gray-100 flex flex-col justify-center">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Dirección de Consultorio</p>
                                        <div className="flex items-start gap-2 mt-0.5">
                                            <p className="text-xs font-bold text-gray-700 leading-tight flex-1">
                                                {direccionMedico || 'Sin dirección registrada'}
                                            </p>
                                            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-[#1C85E8] shrink-0 hover:scale-110 transition-transform mt-0.5">
                                                <FaLocationDot className="text-sm" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="bg-blue-50/80 border border-blue-200 text-blue-700 text-[10px] font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider text-center max-w-md mx-auto">
                        💡 La formulación no está registrada en Odoo (valores en 0)
                    </div>

                    {/* ── SECCIONES SEGÚN ESTADO DE CARGA ── */}
                    {!datosListos ? (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest flex items-center gap-2 mt-4 text-left">
                                <FaSpinner className="text-sm text-[#02CFE3] animate-spin" /> 
                                Sincronizando transacciones de productos con Odoo...
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <SkeletonProductCard />
                                <SkeletonProductCard />
                                <SkeletonProductCard />
                                <SkeletonProductCard />
                            </div>
                        </div>
                    ) : productosFiltrados.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* 🌟 RECORRIDO DE PRODUCTOS USANDO LA VARIABLE CORRECTA DE LA PAGINACIÓN */}
                                {productosPaginados.map((prod) => (
                                    <div
                                        key={prod.codigo}
                                        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 hover:shadow-md transition-all duration-200 overflow-hidden flex text-left w-full relative"
                                    >
                                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-[#1C85E8] to-[#24C765]" />
                                        
                                        <div className="flex flex-col w-full">
                                            <div className="p-4 pl-5 bg-white/40 border-b border-gray-150/60">
                                                <h4 className="font-black text-gray-800 text-xs md:text-sm uppercase tracking-tight leading-snug">
                                                    {prod.nombre}
                                                </h4>
                                                <div className="flex flex-wrap gap-2 items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                                                        COD: {prod.codigo}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-[#1C85E8] bg-blue-50/70 px-2 py-0.5 rounded-md font-black">
                                                        {prod.laboratorio}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 text-center bg-gray-50/30">
                                                <div className="border-r border-gray-150/60 flex flex-col justify-between">
                                                    <div className="py-1.5 px-2 text-[9px] font-black text-[#1C85E8] bg-blue-50/40 uppercase tracking-widest border-b border-gray-150/60">
                                                        Formulado
                                                    </div>
                                                    <div className="grid grid-cols-3 divide-x divide-gray-150/40 text-[10px] items-center py-2">
                                                        <div>
                                                            <span className="block text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Ant</span>
                                                            <strong className="text-gray-700 font-bold">{prod.formulado_mes_anterior}</strong>
                                                        </div>
                                                        <div>
                                                            <span className="block text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Act</span>
                                                            <strong className="text-gray-700 font-bold">{prod.formulado_mes_actual}</strong>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center px-0.5">
                                                            <span className="block text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Dif</span>
                                                            <RendimientoIndicador 
                                                                tendencia={prod.formulado_tendencia} 
                                                                diferencia={prod.formulado_diferencia} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col justify-between">
                                                    <div className="py-1.5 px-2 text-[9px] font-black text-green-600 bg-green-50/40 uppercase tracking-widest border-b border-gray-150/60">
                                                        Comprado
                                                    </div>
                                                    <div className="grid grid-cols-3 divide-x divide-gray-150/40 text-[10px] items-center py-2">
                                                        <div>
                                                            <span className="block text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Ant</span>
                                                            <strong className="text-gray-700 font-bold">{prod.comprado_mes_anterior}</strong>
                                                        </div>
                                                        <div>
                                                            <span className="block text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Act</span>
                                                            <strong className="text-gray-700 font-bold">{prod.comprado_mes_actual}</strong>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center px-0.5">
                                                            <span className="block text-[7px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Dif</span>
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
                                ))}
                            </div>
                        </div>
                    ) : (
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