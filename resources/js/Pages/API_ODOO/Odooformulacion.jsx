import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from "@/Pages/ADMINISTRADOR/PanelAdmin";
import {
    FaMagnifyingGlass, FaGear, FaPlug, FaCircleCheck,
    FaCircleXmark, FaTriangleExclamation, FaUser,
    FaIdCard, FaArrowLeft, FaDatabase, FaSpinner,
    FaPrescriptionBottleMedical, FaBarcode, FaXmark, FaUserDoctor,
    FaChevronLeft, FaChevronRight
} from 'react-icons/fa6';

function ConexionBadge({ estado = 'sin_probar' }) {
    const map = {
        conectado:  { color: '#10b981', Icon: FaCircleCheck,       label: 'Conectado' },
        error:      { color: '#ef4444', Icon: FaCircleXmark,        label: 'Sin conexión' },
        sin_probar: { color: '#94a3b8', Icon: FaTriangleExclamation, label: 'Sin configurar' },
    };
    const { color, Icon, label } = map[estado] ?? map.sin_probar;
    return (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border"
              style={{ color, background: `${color}12`, borderColor: `${color}30` }}>
            <Icon className="text-[8px]" />
            {label}
        </span>
    );
}

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtN = (n) => new Intl.NumberFormat('es-CO').format(n);

export default function OdooFormulacion({ auth, conexionEstado = 'sin_probar', flash, errors, resultadoFormulacion }) {

    const [documento, setDocumento]   = useState('');
    const [buscando, setBuscando]     = useState(false);
    const [busquedaTexto, setBusquedaTexto] = useState('');
    const [agruparRepetidos, setAgruparRepetidos] = useState(false);
    const [ocultarCancelados, setOcultarCancelados] = useState(false);

    // --- NUEVOS ESTADOS (Filtros de Fecha & Paginación) ---
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    
    const [paginaActual, setPaginaActual] = useState(1);
    const [porPagina, setPorPagina] = useState(10); // Límite real numérico
    const [inputPorPagina, setInputPorPagina] = useState('10'); // Estado temporal de texto para evitar bloqueos al borrar

    const formulacion = resultadoFormulacion?.formulacion || [];
    const medico = resultadoFormulacion?.medico || null;
    const buscado = !!resultadoFormulacion;
    const errorMsg = !resultadoFormulacion?.encontrado ? (resultadoFormulacion?.mensaje || errors?.error || flash?.error || '') : '';

const handleBuscar = (e) => {
        e.preventDefault();
        if (!documento.trim()) return;
        setBuscando(true);
        setBusquedaTexto('');
        setPaginaActual(1); // Resetear página en nueva búsqueda

        // Validación segura: Si Ziggy no encuentra la nueva, usa temporalmente la vieja para que no rompa la app
        const existeRutaNueva = typeof route !== 'undefined' && route.has && route.has('formulacion.buscar');
        const rutaDestino = existeRutaNueva ? route('formulacion.buscar') : route('odoo.formulacion.buscar');

        router.post(rutaDestino, { documento }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setBuscando(false),
            onError: () => setBuscando(false)
        });
    };

    // --- MANEJADORES DE INPUT DE PAGINACIÓN SIN BLOQUEOS ---
    const handlePorPaginaChange = (e) => {
        const val = e.target.value;
        // Solo permite números o dejarlo totalmente vacío
        if (val === '' || /^\d+$/.test(val)) {
            setInputPorPagina(val);
            
            // Si el usuario escribe un número válido y mayor a 0, actualizamos el límite real inmediatamente
            const num = parseInt(val, 10);
            if (!isNaN(num) && num > 0) {
                setPorPagina(num);
                setPaginaActual(1); // Resetear a la primera página al cambiar el límite
            }
        }
    };

    const handlePorPaginaBlur = () => {
        // Al salir del input, si quedó vacío o en 0, lo restauramos por defecto a 10
        const num = parseInt(inputPorPagina, 10);
        if (isNaN(num) || num <= 0) {
            setInputPorPagina('10');
            setPorPagina(10);
        }
    };

    // --- PROCESAMIENTO DE FILTROS ---
  const formulacionFiltradaInicial = formulacion.filter(f => {
        // Nuevo: Filtro para quitar cancelados
        if (ocultarCancelados && f.estado === 'cancel') {
            return false;
        }

        // 1. Filtro por texto (Producto, paciente, etc.)
        const query = busquedaTexto.toLowerCase().trim();
        const cumpleTexto = !query ? true : (
            (f.nombre?.toLowerCase() || '').includes(query) ||
            (f.codigo?.toLowerCase() || '').includes(query) ||
            (f.paciente?.toLowerCase() || '').includes(query) ||
            (f.referencia?.toLowerCase() || '').includes(query)
        );

        // 2. Filtro por Fechas (Desde / Hasta)
        let cumpleFecha = true;
        if (f.fecha) {
            // Extraemos solo "YYYY-MM-DD" para evitar problemas con las horas
            const fechaLimpia = f.fecha.substring(0, 10); 
            const [year, month, day] = fechaLimpia.split('-').map(Number);
            const fechaRegistro = new Date(year, month - 1, day); // Creada en hora local sin desfases

            if (fechaDesde) {
                const [dYear, dMonth, dDay] = fechaDesde.split('-').map(Number);
                const limiteDesde = new Date(dYear, dMonth - 1, dDay);
                if (fechaRegistro < limiteDesde) cumpleFecha = false;
            }
            if (fechaHasta) {
                const [hYear, hMonth, hDay] = fechaHasta.split('-').map(Number);
                const limiteHasta = new Date(hYear, hMonth - 1, hDay);
                if (fechaRegistro > limiteHasta) cumpleFecha = false;
            }
        } else if (fechaDesde || fechaHasta) {
            cumpleFecha = false;
        }

        return cumpleTexto && cumpleFecha;
    });

   
    // --- AGRUPAR REPETIDOS ---
    const formulacionFiltradaYAgrupada = agruparRepetidos
        ? Object.values(formulacionFiltradaInicial.reduce((acc, f) => {
            const key = f.producto_id;
            if (!acc[key]) {
                acc[key] = { 
                    ...f, 
                    cantidad: Number(f.cantidad) || 0, 
                    subtotal: Number(f.subtotal) || 0,
                    total: Number(f.total) || 0 // <-- Agregado
                };
            } else {
                acc[key].cantidad += Number(f.cantidad) || 0;
                acc[key].subtotal += Number(f.subtotal) || 0;
                acc[key].total += Number(f.total) || 0; // <-- Agregado
            }
            return acc;
        }, {}))
        : formulacionFiltradaInicial;

    // --- CÁLCULO DE TOTALES GENERALES (Sobre la lista filtrada completa) ---
    const subtotalGeneral = formulacionFiltradaYAgrupada.reduce((acc, f) => acc + (Number(f.subtotal) || 0), 0); // <-- Cambiamos de totalGeneral a subtotalGeneral
    const totalGeneral = formulacionFiltradaYAgrupada.reduce((acc, f) => acc + (Number(f.total) || 0), 0);       // <-- NUEVO: Acumula el total (con impuestos)
    const cantidadTotal = formulacionFiltradaYAgrupada.reduce((acc, f) => acc + (Number(f.cantidad) || 0), 0);
    const pacientesUnicos = new Set(formulacionFiltradaYAgrupada.map(f => f.paciente)).size;

    // --- LÓGICA DE PAGINACIÓN ---
    const totalRegistrosFiltrados = formulacionFiltradaYAgrupada.length;
    const totalPaginas = Math.ceil(totalRegistrosFiltrados / porPagina) || 1;

    // Asegurar que la página actual esté en un rango válido si se reducen los registros
    useEffect(() => {
        if (paginaActual > totalPaginas) {
            setPaginaActual(totalPaginas);
        }
    }, [totalPaginas, paginaActual]);

    const inicioIndex = (paginaActual - 1) * porPagina;
    const finIndex = inicioIndex + porPagina;
    const registrosPaginados = formulacionFiltradaYAgrupada.slice(inicioIndex, finIndex);

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Formulación · Odoo" />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* HEADER */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <Link href={route('odoo.medicos')}
                        className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition mb-3">
                        <FaArrowLeft className="text-[8px]" /> Volver a Consulta Médicos
                    </Link>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded inline-block mb-1">
                                Integración Externa
                            </p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase flex items-center gap-2">
                                <FaPrescriptionBottleMedical className="text-indigo-500 text-[18px]" />
                                Formulación · Odoo
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Productos formulados por el médico a sus pacientes — solo lectura
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                                <FaPlug className="text-slate-400 text-[10px]" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Estado API:</span>
                                <ConexionBadge estado={conexionEstado} />
                            </div>
                            <Link href={route('odoo.config')}
                                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-sm transition-colors">
                                <FaGear className="text-[10px]" />
                                Ajustes de Conexión
                            </Link>
                        </div>
                    </div>
                </div>

                {/* CONTENIDO */}
                <div className="px-8 pt-7 space-y-6">

                    {/* Buscador de Médico */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                            Consultar formulación por número de documento del médico
                        </p>
                        <form onSubmit={handleBuscar} className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <FaIdCard className="text-xs" />
                                </span>
                                <input
                                    type="text"
                                    value={documento}
                                    onChange={e => setDocumento(e.target.value)}
                                    placeholder="Ej: 1012345678"
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
                                />
                            </div>
                            <button type="submit" disabled={buscando || !documento.trim()}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm transition-colors">
                                {buscando
                                    ? <><FaSpinner className="animate-spin text-[10px]" /> Consultando...</>
                                    : <><FaMagnifyingGlass className="text-[10px]" /> Consultar Odoo</>
                                }
                            </button>
                        </form>
                    </div>

                    {/* Resultados */}
                    {buscado && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                            {/* Cabecera + CONTROLES */}
                            <div className="flex flex-col gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                        <FaUserDoctor className="text-indigo-500 text-sm" />
                                        <div>
                                            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                {medico?.name ? `Formulación · Dr(a). ${medico.name}` : `Resultado · Doc: ${documento}`}
                                            </h3>
                                            <p className="text-[8px] font-semibold text-slate-400 uppercase mt-0.5">
                                                Mostrando {totalRegistrosFiltrados} de {formulacion.length} líneas · {pacientesUnicos} paciente(s)
                                            </p>
                                        </div>
                                    </div>

                                    {formulacion.length > 0 && (
    <div className="flex items-center gap-3">
        {/* Filtro Ocultar Cancelados */}
        <label className="inline-flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors select-none border border-slate-200">
            <input
                type="checkbox"
                checked={ocultarCancelados}
                onChange={(e) => {
                    setOcultarCancelados(e.target.checked);
                    setPaginaActual(1);
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight">
                Quitar Cancelados
            </span>
        </label>

        {/* Agrupar Repetidos */}
        <label className="inline-flex items-center gap-2 cursor-pointer bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors select-none border border-slate-200">
            <input
                type="checkbox"
                checked={agruparRepetidos}
                onChange={(e) => {
                    setAgruparRepetidos(e.target.checked);
                    setPaginaActual(1);
                }}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight">
                Agrupar repetidos
            </span>
        </label>
    </div>
)}

                                    
                                </div>

                                {formulacion.length > 0 && (
                                    <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-slate-200/60">
                                        
                                        {/* FILTRO DE FECHAS (Idéntico al de tu imagen) */}
                                        <div className="flex items-center gap-4">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                Filtrar por fecha:
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Desde:</span>
                                                    <input
                                                        type="date"
                                                        value={fechaDesde}
                                                        onChange={e => { setFechaDesde(e.target.value); setPaginaActual(1); }}
                                                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-semibold text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Hasta:</span>
                                                    <input
                                                        type="date"
                                                        value={fechaHasta}
                                                        onChange={e => { setFechaHasta(e.target.value); setPaginaActual(1); }}
                                                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-semibold text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                                                    />
                                                </div>
                                                {(fechaDesde || fechaHasta) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setFechaDesde(''); setFechaHasta(''); setPaginaActual(1); }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Limpiar fechas"
                                                    >
                                                        <FaXmark className="text-[10px]" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Buscador de texto */}
                                        <div className="relative w-full max-w-xs">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                <FaMagnifyingGlass className="text-[9px]" />
                                            </span>
                                            <input
                                                type="text"
                                                value={busquedaTexto}
                                                onChange={e => { setBusquedaTexto(e.target.value); setPaginaActual(1); }}
                                                placeholder="Filtrar por producto, paciente o ref..."
                                                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-7 text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
                                            />
                                            {busquedaTexto && (
                                                <button type="button" onClick={() => { setBusquedaTexto(''); setPaginaActual(1); }}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600">
                                                    <FaXmark className="text-[10px]" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                           
                            {/* Sumatoria */}
{formulacion.length > 0 && (
    <div className="px-6 py-4 bg-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-8">
            {/* Nuevo bloque destacado: Total Formulado */}
            <div>
                <p className="text-[8px] font-black uppercase text-indigo-300 tracking-widest mb-0.5">
                    Total Formulado (Con Filtros Activos)
                </p>
                <p className="text-[22px] font-black text-white leading-none">{fmt(totalGeneral)}</p>
            </div>
            
            {/* Bloque secundario: Subtotal Neto */}
            <div className="border-l border-slate-700 pl-8">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">
                    Subtotal Neto
                </p>
                <p className="text-[16px] font-bold text-slate-300 leading-none">{fmt(subtotalGeneral)}</p>
            </div>
        </div>

        <div className="text-right">
            <p className="text-[8px] font-black uppercase text-indigo-300 tracking-widest mb-0.5">Cantidad total</p>
            <p className="text-[16px] font-black text-indigo-200 leading-none">{fmtN(cantidadTotal)} u.</p>
        </div>
    </div>
)}

                            {/* Tabla */}
                            {registrosPaginados.length > 0 ? (
                                <>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-indigo-600">
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-indigo-500">Código</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-indigo-500">Producto</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-indigo-500">Paciente</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-indigo-500 text-center">Fecha</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-indigo-500 text-center">Cantidad</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-indigo-500 text-right">Subtotal</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-indigo-500 text-right">Total</th>
                                                <th className="px-6 py-3 text-white text-[9px] font-black uppercase text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {registrosPaginados.map((f, idx) => (
                                                <tr key={`${f.producto_id}-${idx}`} className={`hover:bg-indigo-50/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                                                    <td className="px-6 py-3 border-r border-slate-100">
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                                                            <FaBarcode className="text-[8px] text-slate-400" /> {f.codigo}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 border-r border-slate-100">
                                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{f.nombre}</p>
                                                        <p className="text-[8px] text-slate-400 font-medium uppercase">{f.referencia}</p>
                                                    </td>
                                                    <td className="px-6 py-3 border-r border-slate-100">
                                                        <span className="text-[10px] font-bold text-slate-600 uppercase">{f.paciente}</span>
                                                    </td>
                                                   <td className="px-6 py-3 border-r border-slate-100 text-center">
                                                        <span className="text-[9px] font-bold text-slate-500 font-mono">
                                                            {f.fecha ? (() => {
                                                                const fechaLimpia = f.fecha.substring(0, 10);
                                                                const [year, month, day] = fechaLimpia.split('-').map(Number);
                                                                return new Date(year, month - 1, day).toLocaleDateString('es-CO');
                                                            })() : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 border-r border-slate-100 text-center">
                                                        <span className="text-[10px] font-bold text-slate-600 font-mono">{fmtN(f.cantidad)}</span>
                                                    </td>
                                                    <td className="px-6 py-3 border-r border-slate-100 text-right">
                                                        <span className="text-[10px] font-black text-slate-800 font-mono">{fmt(f.subtotal)}</span>
                                                    </td>

                                                    {/* Nuevo campo de Total: */}
                                    <td className="px-6 py-3 border-r border-slate-100 text-right">
                                        <span className="text-[10px] font-black text-slate-800 font-mono">{fmt(f.total)}</span>
                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                                                            ['sale', 'done'].includes(f.estado)
                                                                ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                                : ['draft', 'sent'].includes(f.estado)
                                                                ? 'text-blue-500 bg-blue-50 border-blue-100'
                                                                : 'text-slate-400 bg-slate-50 border-slate-100'
                                                        }`}>
                                                            {f.estado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* SECCIÓN DE PAGINACIÓN */}
                                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 flex-wrap gap-4">
                                        
                                        {/* Input especial de cantidad de registros (Paginador Dinámico) */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar:</span>
                                            <input
                                                type="text"
                                                value={inputPorPagina}
                                                onChange={handlePorPaginaChange}
                                                onBlur={handlePorPaginaBlur}
                                                placeholder="Ej. 10"
                                                className="w-14 bg-white border border-slate-200 rounded-lg py-1 px-2 text-center text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">reg. por página</span>
                                        </div>

                                        {/* Info General & Botones de Navegación */}
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                Mostrando {inicioIndex + 1} - {Math.min(finIndex, totalRegistrosFiltrados)} de {totalRegistrosFiltrados} registros
                                            </span>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={paginaActual === 1}
                                                    onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                                                    className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <FaChevronLeft className="text-[10px]" />
                                                </button>
                                                
                                                <span className="px-3 text-[11px] font-black text-slate-700">
                                                    Pág. {paginaActual} de {totalPaginas}
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled={paginaActual === totalPaginas}
                                                    onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                                                    className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <FaChevronRight className="text-[10px]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-16 text-slate-400">
                                    <FaPrescriptionBottleMedical className="text-4xl text-slate-200 mb-2 mx-auto block" />
                                    <p className="text-[11px] font-bold uppercase">
                                        {errorMsg || 'No se encontró formulación que coincida con los filtros aplicados.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado inicial */}
                    {!buscado && !buscando && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                            <FaPrescriptionBottleMedical className="text-4xl text-slate-200 mb-2 mx-auto block" />
                            <p className="text-[11px] font-bold uppercase">
                                Ingresa el documento del médico para ver su formulación en Odoo
                            </p>
                            <p className="text-[9px] font-medium text-slate-300 mt-1 uppercase">
                                Los resultados aparecerán aquí
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PanelAdmin>
    );
}