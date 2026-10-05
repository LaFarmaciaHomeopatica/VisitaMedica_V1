import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FaXmark, FaLocationDot, FaTriangleExclamation } from 'react-icons/fa6';
import { ETIQUETAS_PREDEFINIDAS, normalizarEtiquetas } from '../HooksMv/useMisVisitas';

const ModalNuevaVisita = ({ logic, doctores = [], productos = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [errorRed, setErrorRed] = useState(false);
    const [nuevaEtiquetaInput, setNuevaEtiquetaInput] = useState('');
    const wrapperRef = useRef(null);

    const tipoModal = logic.tipoNuevoModal || 'visita';

    // Sincronizar buscador al abrir modal
    useEffect(() => {
        if (logic.modalNuevoAbierto) {
            setSearchTerm(logic.formNuevaVisita.data.muestras || '');
            setErrorRed(false);
        }
    }, [logic.modalNuevoAbierto, logic.formNuevaVisita.data.muestras]);

    // Cerrar buscador al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
                if (searchTerm !== logic.formNuevaVisita.data.muestras) {
                    logic.formNuevaVisita.setData('muestras', searchTerm);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm, logic.formNuevaVisita]);

    // Filtrar productos por nombre o código (Hook incondicional en el nivel superior)
    const filteredProducts = useMemo(() => {
        const query = searchTerm.toString().toLowerCase().trim();
        if (!query || query === (logic.formNuevaVisita.data.muestras || '').toLowerCase()) return [];
        return productos
            .filter(
                (p) =>
                    p.nombre?.toLowerCase().includes(query) ||
                    p.codigo?.toLowerCase().includes(query)
            )
            .slice(0, 8);
    }, [searchTerm, productos, logic.formNuevaVisita.data.muestras]);

    // Obtener los datos del médico seleccionado actualmente
    const medicoSeleccionado = useMemo(() => {
        if (!logic.formNuevaVisita.data.medico_id) return null;
        return (doctores || []).find((doc) => doc.id == logic.formNuevaVisita.data.medico_id);
    }, [logic.formNuevaVisita.data.medico_id, doctores]);

    // Hook incondicional de etiquetas
    const sugerenciasEtiquetas = useMemo(() => {
        const base = ETIQUETAS_PREDEFINIDAS || [];
        const actuales = normalizarEtiquetas(logic.formNuevoEvento.data.etiquetas);
        return Array.from(new Set([...base, ...actuales]));
    }, [logic.formNuevoEvento.data.etiquetas]);

    if (!logic.modalNuevoAbierto) return null;

    const handleSelectProduct = (product) => {
        const val = `${product.codigo} - ${product.nombre}`;
        setSearchTerm(val);
        logic.formNuevaVisita.setData('muestras', val);
        setShowResults(false);
    };

    const handleFechaProgramadaVisitaChange = (e) => {
        const val = e.target.value;
        logic.formNuevaVisita.setData('fecha_programada', val);
        if (!logic.formNuevaVisita.data.fecha_realizada || logic.formNuevaVisita.data.fecha_realizada <= val) {
            const d = new Date(val);
            d.setHours(d.getHours() + 1);
            const pad = (n) => String(n).padStart(2, '0');
            const finStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            logic.formNuevaVisita.setData('fecha_realizada', finStr);
        }
    };

    const handleFechaProgramadaEventoChange = (e) => {
        const val = e.target.value;
        logic.formNuevoEvento.setData('fecha_programada', val);
        if (!logic.formNuevoEvento.data.fecha_fin_programada || logic.formNuevoEvento.data.fecha_fin_programada <= val) {
            const d = new Date(val);
            d.setHours(d.getHours() + 1);
            const pad = (n) => String(n).padStart(2, '0');
            const finStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            logic.formNuevoEvento.setData('fecha_fin_programada', finStr);
        }
    };

    const toggleEtiqueta = (tag) => {
        const seleccionadas = normalizarEtiquetas(logic.formNuevoEvento.data.etiquetas);
        const nuevas = seleccionadas.includes(tag)
            ? seleccionadas.filter((t) => t !== tag)
            : [...seleccionadas, tag];
        logic.formNuevoEvento.setData('etiquetas', nuevas);
    };

    const agregarNuevaEtiqueta = (e) => {
        if (e) e.preventDefault();
        const texto = nuevaEtiquetaInput.trim();
        if (!texto) return;
        const seleccionadas = normalizarEtiquetas(logic.formNuevoEvento.data.etiquetas);
        if (!seleccionadas.includes(texto)) {
            logic.formNuevoEvento.setData('etiquetas', [...seleccionadas, texto]);
        }
        setNuevaEtiquetaInput('');
    };

    const handleVisitaSubmit = (e) => {
        e.preventDefault();
        setErrorRed(false);
        logic.formNuevaVisita.post(route('visitas.store'), {
            onSuccess: () => {
                logic.setModalNuevoAbierto(false);
                logic.formNuevaVisita.reset();
                setSearchTerm('');
            },
        });
    };

    const handleEventoSubmit = (e) => {
        e.preventDefault();
        setErrorRed(false);
        let tagsActuales = [...normalizarEtiquetas(logic.formNuevoEvento.data.etiquetas)];
        const textoTag = nuevaEtiquetaInput.trim();
        if (textoTag && !tagsActuales.includes(textoTag)) {
            tagsActuales.push(textoTag);
            logic.formNuevoEvento.setData('etiquetas', tagsActuales);
        }

        logic.formNuevoEvento.transform((data) => ({
            ...data,
            etiquetas: tagsActuales,
        }));

        logic.formNuevoEvento.post(route('visitador.eventos.store'), {
            preserveScroll: true,
            onSuccess: () => {
                logic.setModalNuevoAbierto(false);
                logic.formNuevoEvento.reset();
                setNuevaEtiquetaInput('');
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => logic.setModalNuevoAbierto(false)}
            />

            <div className="relative bg-white w-full max-w-lg rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <button
                    type="button"
                    onClick={() => logic.setModalNuevoAbierto(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label="Cerrar modal"
                >
                    <FaXmark className="text-xl" />
                </button>

                <div className="mb-4">
                    <h2 className="text-xl font-black uppercase text-slate-800">Nueva Programación</h2>
                    <div className="h-1 w-10 bg-[#5D8BF4] mt-1 rounded-full" />
                </div>

                {/* SELECTOR DE PESTAÑAS (VISITA vs ACTIVIDAD) */}
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
                    <button
                        type="button"
                        onClick={() => logic.setTipoNuevoModal('visita')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            tipoModal === 'visita'
                                ? 'bg-white text-[#1C85E8] shadow-sm font-black'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <span>🩺</span>
                        <span>Visita Médica</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => logic.setTipoNuevoModal('actividad')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            tipoModal === 'actividad'
                                ? 'bg-white text-indigo-600 shadow-sm font-black'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <span>🎯</span>
                        <span>Actividades</span>
                    </button>
                </div>

                {/* ========================================================= */}
                {/* 1. FORMULARIO DE VISITA MÉDICA                            */}
                {/* ========================================================= */}
                {tipoModal === 'visita' && (
                    <form onSubmit={handleVisitaSubmit} className="space-y-4">
                        {/* Médico */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Seleccionar Doctor *
                            </label>
                            <select
                                className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                                value={logic.formNuevaVisita.data.medico_id}
                                onChange={(e) => logic.formNuevaVisita.setData('medico_id', e.target.value)}
                                required
                            >
                                <option value="">-- Elige un médico --</option>
                                {(doctores || []).map((doc) => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.nombre} {doc.apellido || ''}
                                    </option>
                                ))}
                            </select>

                            {medicoSeleccionado && (medicoSeleccionado.direccion_detalles || medicoSeleccionado.geolocalizacion) && (
                                <div className="mt-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                                    {medicoSeleccionado.direccion_detalles && (
                                        <p className="text-[11px] text-slate-600 font-medium">
                                            <span className="font-bold text-slate-700">Dirección:</span> {medicoSeleccionado.direccion_detalles}
                                        </p>
                                    )}
                                    {medicoSeleccionado.geolocalizacion && (
                                        <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                            <FaLocationDot className="text-[#5D8BF4] text-xs" />
                                            <span>Ubicación base: {medicoSeleccionado.geolocalizacion}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Fechas de Visita (ambas editables) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Fecha Inicio *
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                                    value={logic.formNuevaVisita.data.fecha_programada}
                                    onChange={handleFechaProgramadaVisitaChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Fecha Cierre / Fin
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                                    value={logic.formNuevaVisita.data.fecha_realizada || ''}
                                    onChange={(e) => logic.formNuevaVisita.setData('fecha_realizada', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Buscador de Productos / Muestras */}
                        <div className="relative" ref={wrapperRef}>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Muestras (Producto)
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowResults(true);
                                    logic.formNuevaVisita.setData('muestras', e.target.value);
                                }}
                                onFocus={() => setShowResults(true)}
                                placeholder="Buscar por código o nombre..."
                                className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                            />
                            {showResults && filteredProducts.length > 0 && (
                                <div className="absolute z-[110] w-full bg-white border-2 border-[#5D8BF4] rounded-2xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                                    {filteredProducts.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleSelectProduct(p)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none"
                                        >
                                            <p className="text-[10px] font-black text-[#5D8BF4]">{p.codigo}</p>
                                            <p className="text-[11px] font-bold text-gray-700 uppercase">{p.nombre}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Detalle de Muestra */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Detalles de la Muestra
                            </label>
                            <textarea
                                value={logic.formNuevaVisita.data.comentario_muestra || ''}
                                onChange={(e) => logic.formNuevaVisita.setData('comentario_muestra', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 h-16 resize-none focus:ring-2 focus:ring-[#5D8BF4]"
                                placeholder="Lote, cantidad, etc..."
                            />
                        </div>

                        {/* Comentarios */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Notas / Comentarios
                            </label>
                            <textarea
                                value={logic.formNuevaVisita.data.comentarios || ''}
                                onChange={(e) => logic.formNuevaVisita.setData('comentarios', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 h-20 resize-none focus:ring-2 focus:ring-[#5D8BF4]"
                                placeholder="Notas adicionales de la visita..."
                            />
                        </div>

                        {/* Errores */}
                        {Object.keys(logic.formNuevaVisita.errors).length > 0 && (
                            <div className="p-3 bg-red-50 rounded-xl">
                                {Object.values(logic.formNuevaVisita.errors).map((err, i) => (
                                    <p key={i} className="text-[10px] text-red-600 font-bold uppercase">• {err}</p>
                                ))}
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => logic.setModalNuevoAbierto(false)}
                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-[10px] tracking-widest transition-all"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="submit"
                                disabled={logic.formNuevaVisita.processing}
                                className="flex-1 bg-[#1C85E8] text-white rounded-2xl py-3.5 text-[11px] font-black tracking-widest shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                            >
                                {logic.formNuevaVisita.processing ? 'PROCESANDO...' : 'AGENDAR VISITA'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ========================================================= */}
                {/* 2. FORMULARIO DE ACTIVIDADES / EVENTOS                    */}
                {/* ========================================================= */}
                {tipoModal === 'actividad' && (
                    <form onSubmit={handleEventoSubmit} className="space-y-4">
                        {/* Nombre de la actividad */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Nombre de la Actividad / Evento *
                            </label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 focus:ring-2 focus:ring-indigo-500"
                                value={logic.formNuevoEvento.data.nombre_evento}
                                onChange={(e) => logic.formNuevoEvento.setData('nombre_evento', e.target.value)}
                                placeholder="Ej: Capacitación técnica, Reunión de ciclo..."
                                required
                            />
                        </div>

                        {/* Etiquetas */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Etiquetas
                            </label>
                            
                            {/* Pills sugeridas e interactivas */}
                            <div className="flex flex-wrap gap-1.5 mb-2 mt-1.5">
                                {sugerenciasEtiquetas.map((tag) => {
                                    const seleccionada = (logic.formNuevoEvento.data.etiquetas || []).includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleEtiqueta(tag)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                                seleccionada
                                                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                            }`}
                                        >
                                            <span>{seleccionada ? '✓' : '+'}</span>
                                            <span>{tag}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={nuevaEtiquetaInput}
                                    onChange={(e) => setNuevaEtiquetaInput(e.target.value)}
                                    placeholder="Escribe otra etiqueta y presiona Enter o Agregar..."
                                    className="flex-1 bg-gray-50 border-none rounded-2xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
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
                                    className="px-3.5 py-2 bg-slate-800 text-white rounded-2xl text-xs font-bold hover:bg-slate-900 transition-colors"
                                >
                                    + Agregar
                                </button>
                            </div>
                        </div>

                        {/* Fechas de Actividad */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Fecha y Hora de Inicio *
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 focus:ring-2 focus:ring-indigo-500"
                                    value={logic.formNuevoEvento.data.fecha_programada}
                                    onChange={handleFechaProgramadaEventoChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                    Fecha y Hora de Fin *
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 focus:ring-2 focus:ring-indigo-500"
                                    value={logic.formNuevoEvento.data.fecha_fin_programada}
                                    onChange={(e) => logic.formNuevoEvento.setData('fecha_fin_programada', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Ubicación */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Ubicación / Lugar
                            </label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 focus:ring-2 focus:ring-indigo-500"
                                value={logic.formNuevoEvento.data.ubicacion || ''}
                                onChange={(e) => logic.formNuevoEvento.setData('ubicacion', e.target.value)}
                                placeholder="Dirección, sede o lugar del evento..."
                            />
                        </div>

                        {/* Comentario */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Comentarios / Descripción
                            </label>
                            <textarea
                                value={logic.formNuevoEvento.data.comentario || ''}
                                onChange={(e) => logic.formNuevoEvento.setData('comentario', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl p-3.5 text-xs font-bold mt-1 h-20 resize-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Notas o requerimientos del evento..."
                            />
                        </div>

                        {/* Errores */}
                        {Object.keys(logic.formNuevoEvento.errors).length > 0 && (
                            <div className="p-3 bg-red-50 rounded-xl">
                                {Object.values(logic.formNuevoEvento.errors).map((err, i) => (
                                    <p key={i} className="text-[10px] text-red-600 font-bold uppercase">• {err}</p>
                                ))}
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => logic.setModalNuevoAbierto(false)}
                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-[10px] tracking-widest transition-all"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="submit"
                                disabled={logic.formNuevoEvento.processing}
                                className="flex-1 bg-indigo-600 text-white rounded-2xl py-3.5 text-[11px] font-black tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {logic.formNuevoEvento.processing ? 'PROCESANDO...' : 'AGENDAR ACTIVIDAD'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ModalNuevaVisita;