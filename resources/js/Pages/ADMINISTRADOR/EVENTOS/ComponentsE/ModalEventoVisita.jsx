import React, { useState, useEffect, useMemo, useRef } from 'react';
import { aInput, ETIQUETA_ESTADO, ETIQUETAS_PREDEFINIDAS, normalizarEtiquetas } from '../HooksE/useEventoForm';

// Helper de visualización de errores
const Err = ({ msg }) => (msg ? <p className="text-xs text-red-600 mt-1 font-medium">• {msg}</p> : null);

const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#3D3FD8] focus:ring-2 focus:ring-[#3D3FD8]/10 transition-all';

// Componente SearchableSelect reutilizable para visitadores y médicos
function SearchableSelect({ value, onChange, options = [], placeholder, getKey, getLabel, disabled = false }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = options.find((o) => String(getKey(o)) === String(value));

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => getLabel(o).toLowerCase().includes(q));
    }, [options, query]);

    useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleOpen() {
        if (disabled) return;
        setOpen(true);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 50);
    }

    function handleSelect(opt) {
        onChange(getKey(opt));
        setOpen(false);
        setQuery('');
    }

    function handleClear(e) {
        e.stopPropagation();
        onChange('');
        setOpen(false);
        setQuery('');
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none focus:bg-white focus:border-[#3D3FD8] transition-all flex items-center justify-between gap-2 text-left ${
                    disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:border-slate-300'
                }`}
            >
                <span className={selected ? 'text-slate-800 truncate' : 'text-slate-400 font-normal'}>
                    {selected ? getLabel(selected) : placeholder}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                    {selected && !disabled && (
                        <span
                            onClick={handleClear}
                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5 text-xs font-bold"
                            title="Limpiar"
                        >
                            ✕
                        </span>
                    )}
                    <span className={`text-slate-400 text-[10px] transition-transform inline-block ${open ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </span>
            </button>

            {open && (
                <div className="absolute z-[200] mt-1 w-full bg-white rounded-xl shadow-2xl border border-[#3D3FD8] overflow-hidden">
                    <div className="px-3 pt-2.5 pb-2 border-b border-slate-100">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#3D3FD8] placeholder:text-slate-400 placeholder:font-normal"
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-[11px] text-slate-400 font-semibold text-center">
                                Sin resultados
                            </li>
                        ) : (
                            filtered.map((opt) => {
                                const isActive = String(getKey(opt)) === String(value);
                                return (
                                    <li
                                        key={getKey(opt)}
                                        onClick={() => handleSelect(opt)}
                                        className={`px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                                            isActive ? 'bg-blue-50 text-[#3D3FD8] font-bold' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {getLabel(opt)}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function ModalEventoVisita({
    isOpen,
    onClose,
    tipoModal = 'visita', // 'visita' | 'actividad'
    setTipoModal,
    isEditing = false,
    visitadores = [],
    productos = [],
    etiquetas = [],
    // Props para Visita
    visitaData,
    setVisitaData,
    visitaErrors = {},
    visitaProcessing = false,
    onVisitaSubmit,
    medicosFiltradosPorVisitador = [],
    onVisitaMedicoChange,
    onVisitaFechaChange,
    // Props para Actividad / Evento
    eventoData,
    setEventoData,
    eventoErrors = {},
    eventoProcessing = false,
    onEventoSubmit,
}) {
    // Estado local para búsqueda de visitadores en modo masivo de actividad
    const [busquedaVisitador, setBusquedaVisitador] = useState('');
    const [nuevaEtiquetaInput, setNuevaEtiquetaInput] = useState('');

    // Estado local para búsqueda de productos/muestras en visita
    const [productoSearchTerm, setProductoSearchTerm] = useState('');
    const [showProductResults, setShowProductResults] = useState(false);
    const productWrapperRef = useRef(null);

    // Sincronizar producto cuando se abre o edita
    useEffect(() => {
        if (isOpen && tipoModal === 'visita') {
            if (isEditing && visitaData?.muestras) {
                setProductoSearchTerm(visitaData.muestras);
            } else if (!isEditing) {
                setProductoSearchTerm(visitaData?.muestras || '');
            }
        }
    }, [isOpen, isEditing, tipoModal, visitaData?.muestras]);

    // Cerrar sugerencias de productos al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (productWrapperRef.current && !productWrapperRef.current.contains(event.target)) {
                setShowProductResults(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Productos filtrados (hook debe ejecutarse incondicionalmente antes de cualquier return)
    const filteredProducts = useMemo(() => {
        const query = (productoSearchTerm || '').toString().toLowerCase().trim();
        if (!query || query.length < 1) return [];
        return productos
            .filter((p) => {
                const nombre = p.nombre ? p.nombre.toLowerCase() : '';
                const codigo = p.codigo ? p.codigo.toLowerCase() : '';
                return nombre.includes(query) || codigo.includes(query);
            })
            .slice(0, 8);
    }, [productoSearchTerm, productos]);

    // Este useMemo DEBE estar antes del early return (regla de hooks de React)
    const sugerenciasEtiquetas = useMemo(() => {
        const catalogo = (etiquetas || [])
            .map((e) => (typeof e === 'object' && e !== null ? e.nombre : e))
            .filter(Boolean);
        const actuales = normalizarEtiquetas(eventoData?.etiquetas);
        return Array.from(new Set([...catalogo, ...actuales]));
    }, [etiquetas, eventoData?.etiquetas]);

    if (!isOpen) return null;

    const handleSelectProduct = (product) => {
        const selectedValue = `${product.codigo} - ${product.nombre}`;
        setProductoSearchTerm(selectedValue);
        setVisitaData('muestras', selectedValue);
        setShowProductResults(false);
    };

    // Filtro de visitadores en Eventos (modo masivo)
    const visitadoresFiltradosActividad = visitadores.filter((v) =>
        (v.nombre || '').toLowerCase().includes(busquedaVisitador.toLowerCase())
    );

    const toggleVisitadorActividad = (id) => {
        const idsActuales = eventoData.visitadores_ids || [];
        const nuevosIds = idsActuales.includes(id)
            ? idsActuales.filter((x) => x !== id)
            : [...idsActuales, id];
        setEventoData('visitadores_ids', nuevosIds);
    };

    const seleccionarVisiblesActividad = () => {
        const idsActuales = eventoData.visitadores_ids || [];
        const idsVisibles = visitadoresFiltradosActividad.map((v) => v.id);
        const union = Array.from(new Set([...idsActuales, ...idsVisibles]));
        setEventoData('visitadores_ids', union);
    };

    const toggleEtiqueta = (tag) => {
        const seleccionadas = normalizarEtiquetas(eventoData.etiquetas);
        const nuevas = seleccionadas.includes(tag)
            ? seleccionadas.filter((item) => item !== tag)
            : [...seleccionadas, tag];
        setEventoData('etiquetas', nuevas);
    };

    const agregarNuevaEtiqueta = (e) => {
        if (e) e.preventDefault();
        const texto = nuevaEtiquetaInput.trim();
        if (!texto) return;
        const seleccionadas = normalizarEtiquetas(eventoData.etiquetas);
        if (!seleccionadas.includes(texto)) {
            setEventoData('etiquetas', [...seleccionadas, texto]);
        }
        setNuevaEtiquetaInput('');
    };

    const submitActividad = (e) => {
        if (e) e.preventDefault();
        const texto = nuevaEtiquetaInput.trim();
        if (texto) {
            const actual = normalizarEtiquetas(eventoData.etiquetas);
            if (!actual.includes(texto)) {
                eventoData.etiquetas = [...actual, texto];
                setEventoData('etiquetas', [...actual, texto]);
            }
            setNuevaEtiquetaInput('');
        }
        onEventoSubmit(e);
    };

    const cambiarInicioEvento = (valor) => {
        let fin = eventoData.fecha_fin_programada;
        if (!fin || fin <= valor) {
            const d = new Date(valor);
            d.setHours(d.getHours() + 1);
            fin = aInput(d);
        }
        setEventoData('fecha_programada', valor);
        setEventoData('fecha_fin_programada', fin);
    };

    const cantidadSeleccionadosActividad = (eventoData.visitadores_ids || []).length;

    const textoBotonActividad = eventoProcessing
        ? 'Guardando...'
        : isEditing
        ? 'Guardar Cambios'
        : eventoData.todos
        ? 'Asignar a todos los visitadores'
        : `Asignar a ${cantidadSeleccionadosActividad} visitador${cantidadSeleccionadosActividad === 1 ? '' : 'es'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
                {/* ENCABEZADO CON SWITCHER DE TABS */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-tight">
                                {isEditing
                                    ? tipoModal === 'visita'
                                        ? 'Editar Visita Médica'
                                        : 'Editar Actividad'
                                    : 'Nueva Asignación'}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                {isEditing
                                    ? 'Actualiza los datos del registro seleccionado'
                                    : 'Elige si deseas programar una Visita Médica o una Actividad/Evento'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition-all"
                        >
                            ✕
                        </button>
                    </div>

                    {/* SELECTOR DE TABS (VISITA vs ACTIVIDADES) */}
                    <div className="flex bg-slate-200/70 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setTipoModal('visita')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                tipoModal === 'visita'
                                    ? 'bg-white text-[#3D3FD8] shadow-sm font-black'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span className="text-sm">🩺</span>
                            <span>Visita Médica</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipoModal('actividad')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                tipoModal === 'actividad'
                                    ? 'bg-white text-indigo-600 shadow-sm font-black'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span className="text-sm">🎯</span>
                            <span>Actividades / Evento</span>
                        </button>
                    </div>
                </div>

                {/* CONTENIDO DEL FORMULARIO */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {/* ========================================================= */}
                    {/* TAB 1: FORMULARIO DE VISITA MÉDICA                        */}
                    {/* ========================================================= */}
                    {tipoModal === 'visita' && (
                        <form id="form-visita" onSubmit={onVisitaSubmit} className="space-y-4">
                            {/* Alerta de errores de Visita */}
                            {visitaErrors && Object.keys(visitaErrors).length > 0 && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                    {Object.entries(visitaErrors).map(([key, msg]) => (
                                        <p key={key} className="text-xs text-red-600 font-semibold">• {msg}</p>
                                    ))}
                                </div>
                            )}

                            {/* Visitador y Médico */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Visitador Responsable *
                                    </label>
                                    <SearchableSelect
                                        value={visitaData.visitador_id}
                                        onChange={(val) => {
                                            setVisitaData('visitador_id', val);
                                            setVisitaData('medico_id', '');
                                        }}
                                        options={visitadores}
                                        placeholder="Seleccionar visitador..."
                                        getKey={(v) => v.id}
                                        getLabel={(v) => v.nombre}
                                    />
                                    <Err msg={visitaErrors.visitador_id} />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Médico / Contacto *
                                    </label>
                                    <SearchableSelect
                                        value={visitaData.medico_id}
                                        onChange={(val) => onVisitaMedicoChange(val)}
                                        options={medicosFiltradosPorVisitador}
                                        placeholder={visitaData.visitador_id ? 'Seleccionar médico...' : 'Primero elija visitador'}
                                        getKey={(m) => m.id}
                                        getLabel={(m) => `${m.nombre} ${m.apellido || ''}`.trim()}
                                        disabled={!visitaData.visitador_id}
                                    />
                                    <Err msg={visitaErrors.medico_id} />
                                </div>
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Fecha y Hora Programada *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={visitaData.fecha_programada || ''}
                                        onChange={(e) => onVisitaFechaChange(e.target.value)}
                                        className={inputCls}
                                        required
                                    />
                                    <Err msg={visitaErrors.fecha_programada} />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Fecha de Cierre (Opcional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={visitaData.fecha_realizada || ''}
                                        onChange={(e) => setVisitaData('fecha_realizada', e.target.value)}
                                        className={inputCls}
                                    />
                                    <Err msg={visitaErrors.fecha_realizada} />
                                </div>
                            </div>

                            {/* Estado y Muestras */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Estado de la Visita *
                                    </label>
                                    <select
                                        value={visitaData.estado || 'sin programar'}
                                        onChange={(e) => setVisitaData('estado', e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="sin programar">SIN PROGRAMAR</option>
                                        <option value="programada">PROGRAMADA</option>
                                        <option value="efectiva">EFECTIVA</option>
                                        <option value="No contactado">NO CONTACTADO</option>
                                        <option value="reprogramada">REPROGRAMADA</option>
                                        <option value="cancelada">CANCELADA</option>
                                    </select>
                                    <Err msg={visitaErrors.estado} />
                                </div>

                                <div className="relative" ref={productWrapperRef}>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Muestras (Producto)
                                    </label>
                                    <input
                                        type="text"
                                        value={productoSearchTerm}
                                        onChange={(e) => {
                                            setProductoSearchTerm(e.target.value);
                                            setShowProductResults(true);
                                            setVisitaData('muestras', e.target.value);
                                        }}
                                        onFocus={() => setShowProductResults(true)}
                                        placeholder="Buscar código o nombre del producto..."
                                        className={inputCls}
                                    />
                                    {showProductResults && filteredProducts.length > 0 && (
                                        <div
                                            className="absolute z-[100] w-full bg-white border border-[#3D3FD8] rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto"
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            {filteredProducts.map((p) => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handleSelectProduct(p)}
                                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-slate-50 last:border-none cursor-pointer transition-colors"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-[#3D3FD8]">{p.codigo}</span>
                                                        <span className="text-xs font-semibold text-slate-700">{p.nombre}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Err msg={visitaErrors.muestras} />
                                </div>
                            </div>

                            {/* Detalles de Muestra */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                    Detalles de la Muestra
                                </label>
                                <textarea
                                    rows={2}
                                    value={visitaData.comentario_muestra || ''}
                                    onChange={(e) => setVisitaData('comentario_muestra', e.target.value)}
                                    className={inputCls}
                                    placeholder="Lote, cantidad u observaciones de la muestra..."
                                />
                                <Err msg={visitaErrors.comentario_muestra} />
                            </div>

                            {/* Comentarios / Notas */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                    Notas / Observaciones de la Visita
                                </label>
                                <textarea
                                    rows={3}
                                    value={visitaData.comentarios || ''}
                                    onChange={(e) => setVisitaData('comentarios', e.target.value)}
                                    className={inputCls}
                                    placeholder="Resumen o notas adicionales de la visita médica..."
                                />
                                <Err msg={visitaErrors.comentarios} />
                            </div>
                        </form>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: FORMULARIO DE ACTIVIDADES / EVENTOS                 */}
                    {/* ========================================================= */}
                    {tipoModal === 'actividad' && (
                        <form id="form-actividad" onSubmit={submitActividad} className="space-y-4">
                            {/* Alerta de errores de Evento */}
                            {(eventoErrors.fecha_programada || eventoErrors.fecha_fin_programada) && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 space-y-1">
                                    {eventoErrors.fecha_programada && <p>{eventoErrors.fecha_programada}</p>}
                                    {eventoErrors.fecha_fin_programada && <p>{eventoErrors.fecha_fin_programada}</p>}
                                </div>
                            )}

                            {/* Nombre del Evento / Actividad */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                    Nombre de la Actividad / Evento *
                                </label>
                                <input
                                    type="text"
                                    value={eventoData.nombre_evento || ''}
                                    onChange={(e) => setEventoData('nombre_evento', e.target.value)}
                                    className={inputCls}
                                    placeholder="Ej: Capacitación técnica, Reunión de ciclo, Congreso..."
                                    required
                                />
                                <Err msg={eventoErrors.nombre_evento} />
                            </div>

                            {/* Etiquetas */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                    Etiquetas
                                </label>
                                
                                {/* Pills sugeridas e interactivas */}
                                {sugerenciasEtiquetas.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                                        {sugerenciasEtiquetas.map((tag) => {
                                            const seleccionada = (eventoData.etiquetas || []).includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleEtiqueta(tag)}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                                        seleccionada
                                                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                                                    }`}
                                                >
                                                    <span>{seleccionada ? '✓' : '+'}</span>
                                                    <span>{tag}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-slate-400 italic mb-2">
                                        No hay etiquetas creadas todavía. Escribe una nueva abajo para agregarla.
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={nuevaEtiquetaInput}
                                        onChange={(e) => setNuevaEtiquetaInput(e.target.value)}
                                        placeholder="Escribe otra etiqueta y presiona Enter o Agregar..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                agregarNuevaEtiqueta(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={agregarNuevaEtiqueta}
                                        className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
                                    >
                                        + Agregar
                                    </button>
                                </div>
                                <Err msg={eventoErrors.etiquetas} />
                            </div>

                            {/* Visitadores */}
                            {isEditing ? (
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Visitador Responsable *
                                    </label>
                                    <SearchableSelect
                                        value={eventoData.visitador_id}
                                        onChange={(val) => setEventoData('visitador_id', val)}
                                        options={visitadores}
                                        placeholder="Seleccionar visitador..."
                                        getKey={(v) => v.id}
                                        getLabel={(v) => v.nombre}
                                    />
                                    <Err msg={eventoErrors.visitador_id} />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Asignar a
                                    </label>

                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={!!eventoData.todos}
                                            onChange={(e) => setEventoData('todos', e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Todos los visitadores ({visitadores.length})</span>
                                    </label>

                                    {!eventoData.todos && (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="flex items-center gap-2 p-2 border-b bg-slate-50">
                                                <input
                                                    type="text"
                                                    value={busquedaVisitador}
                                                    onChange={(e) => setBusquedaVisitador(e.target.value)}
                                                    placeholder="Buscar visitador..."
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={seleccionarVisiblesActividad}
                                                    className="text-xs font-bold text-indigo-600 hover:underline whitespace-nowrap"
                                                >
                                                    Seleccionar visibles
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEventoData('visitadores_ids', [])}
                                                    className="text-xs font-medium text-slate-500 hover:underline"
                                                >
                                                    Limpiar
                                                </button>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                                                {visitadoresFiltradosActividad.length === 0 ? (
                                                    <p className="text-xs text-slate-400 p-2 text-center">Sin resultados.</p>
                                                ) : (
                                                    visitadoresFiltradosActividad.map((v) => (
                                                        <label
                                                            key={v.id}
                                                            className="flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer text-slate-700"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={(eventoData.visitadores_ids || []).includes(v.id)}
                                                                onChange={() => toggleVisitadorActividad(v.id)}
                                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span>{v.nombre}</span>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-600 px-3 py-1.5 border-t bg-slate-50">
                                                {cantidadSeleccionadosActividad} seleccionado{cantidadSeleccionadosActividad === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                    )}
                                    <Err msg={eventoErrors.visitadores_ids} />
                                </div>
                            )}

                            {/* Fechas de la actividad */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Fecha y Hora de Inicio *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={eventoData.fecha_programada || ''}
                                        onChange={(e) => cambiarInicioEvento(e.target.value)}
                                        className={inputCls}
                                        required
                                    />
                                    <Err msg={eventoErrors.fecha_programada} />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                        Fecha y Hora de Fin *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={eventoData.fecha_fin_programada || ''}
                                        onChange={(e) => setEventoData('fecha_fin_programada', e.target.value)}
                                        className={inputCls}
                                        required
                                    />
                                    <Err msg={eventoErrors.fecha_fin_programada} />
                                </div>
                            </div>

                            {/* Fechas reales si está editando */}
                            {isEditing && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                            Fecha Realizada (Opcional)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={eventoData.fecha_realizada || ''}
                                            onChange={(e) => setEventoData('fecha_realizada', e.target.value)}
                                            className={inputCls}
                                        />
                                        <Err msg={eventoErrors.fecha_realizada} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                            Fin Real (Opcional)
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={eventoData.fecha_fin_real || ''}
                                            onChange={(e) => setEventoData('fecha_fin_real', e.target.value)}
                                            className={inputCls}
                                        />
                                        <Err msg={eventoErrors.fecha_fin_real} />
                                    </div>
                                </div>
                            )}

                            {/* Estado */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                    Estado de la Actividad *
                                </label>
                                <select
                                    value={eventoData.estado || 'programado'}
                                    onChange={(e) => setEventoData('estado', e.target.value)}
                                    className={inputCls}
                                >
                                    {Object.entries(ETIQUETA_ESTADO || {}).map(([valor, etiqueta]) => (
                                        <option key={valor} value={valor}>
                                            {etiqueta}
                                        </option>
                                    ))}
                                </select>
                                <Err msg={eventoErrors.estado} />
                            </div>

                            {/* Ubicación y Coordenadas */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                    Ubicación / Lugar
                                </label>
                                <input
                                    type="text"
                                    value={eventoData.ubicacion || ''}
                                    onChange={(e) => setEventoData('ubicacion', e.target.value)}
                                    className={inputCls}
                                    placeholder="Dirección, sede, hotel o enlace virtual"
                                />
                                <Err msg={eventoErrors.ubicacion} />
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <div>
                                        <input
                                            type="number"
                                            step="any"
                                            value={eventoData.latitud ?? ''}
                                            onChange={(e) => setEventoData('latitud', e.target.value)}
                                            className={inputCls}
                                            placeholder="Latitud (opcional)"
                                        />
                                        <Err msg={eventoErrors.latitud} />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            step="any"
                                            value={eventoData.longitud ?? ''}
                                            onChange={(e) => setEventoData('longitud', e.target.value)}
                                            className={inputCls}
                                            placeholder="Longitud (opcional)"
                                        />
                                        <Err msg={eventoErrors.longitud} />
                                    </div>
                                </div>
                            </div>

                            {/* Comentarios */}
                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase mb-1">
                                    Comentario / Descripción
                                </label>
                                <textarea
                                    rows={3}
                                    value={eventoData.comentario || ''}
                                    onChange={(e) => setEventoData('comentario', e.target.value)}
                                    className={inputCls}
                                    placeholder="Detalles sobre los objetivos, material o requerimientos del evento..."
                                />
                                <Err msg={eventoErrors.comentario} />
                            </div>
                        </form>
                    )}
                </div>

                {/* BOTONES DE ACCIÓN FOOTER */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>

                    {tipoModal === 'visita' ? (
                        <button
                            type="submit"
                            form="form-visita"
                            disabled={visitaProcessing}
                            className="px-5 py-2.5 bg-[#3D3FD8] text-white text-xs font-black rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                            {visitaProcessing && <span className="animate-spin text-sm">↻</span>}
                            <span>{visitaProcessing ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Visita Médica'}</span>
                        </button>
                    ) : (
                        <button
                            type="submit"
                            form="form-actividad"
                            disabled={eventoProcessing}
                            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                            {eventoProcessing && <span className="animate-spin text-sm">↻</span>}
                            <span>{textoBotonActividad}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
