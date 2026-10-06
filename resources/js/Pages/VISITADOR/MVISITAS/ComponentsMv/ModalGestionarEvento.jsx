import React, { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { FaCircleCheck, FaClock, FaBan, FaXmark, FaTriangleExclamation } from 'react-icons/fa6';
import { ETIQUETAS_PREDEFINIDAS, normalizarEtiquetas } from '../HooksMv/useMisVisitas';

const ModalGestionarEvento = ({ logic, etiquetas = [] }) => {
    const [dateWarning, setDateWarning] = useState('');
    const [coordenadas, setCoordenadas] = useState({ latitud: null, longitud: null });
    const [gpsStatus, setGpsStatus] = useState('');
    const [errorRed, setErrorRed] = useState(false);
    const [nuevaEtiquetaInput, setNuevaEtiquetaInput] = useState('');

    const formReporte = logic.formReporteEvento;
    const evento = logic.eventoSeleccionado;
    const esRealizado = evento?.estado === 'realizado';

    // Captura de errores globales de red de Inertia
    useEffect(() => {
        if (!logic.modalGestionEventoAbierto) return;
        const removeListener = router.on('exception', (event) => {
            event.preventDefault();
            setErrorRed(true);
        });
        return () => removeListener();
    }, [logic.modalGestionEventoAbierto]);

    const capturarUbicacion = () => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }
        setGpsStatus('obteniendo');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoordenadas({
                    latitud: pos.coords.latitude,
                    longitud: pos.coords.longitude,
                });
                setGpsStatus('ok');
            },
            (err) => {
                console.warn('GPS error:', err);
                setGpsStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Auto-detectar si cambió la fecha programada para marcar como 'reprogramada'
    useEffect(() => {
        if (!logic.modalGestionEventoAbierto || !evento) return;

        const originalStart = evento.fecha_programada?.slice(0, 16).replace(' ', 'T') || '';
        const currentStart = formReporte.data.fecha_programada?.replace(' ', 'T') || '';
        const originalState = evento.estado || '';

        if (currentStart !== originalStart) {
            setDateWarning('');
            if (formReporte.data.estado !== 'reprogramada') {
                formReporte.setData('estado', 'reprogramada');
            }
        } else {
            if (formReporte.data.estado === 'reprogramada') {
                formReporte.setData('estado', originalState !== 'reprogramada' ? originalState : 'programado');
            }
        }
    }, [formReporte.data.fecha_programada, logic.modalGestionEventoAbierto, evento]);

    // Reset del formulario cuando se abre el modal
    useEffect(() => {
        if (logic.modalGestionEventoAbierto && evento) {
            formReporte.setData({
                nombre_evento: evento.nombre_evento || '',
                estado: evento.estado || 'programado',
                comentario: evento.comentario || '',
                ubicacion: evento.ubicacion || '',
                latitud: evento.latitud ?? '',
                longitud: evento.longitud ?? '',
                fecha_programada: evento.fecha_programada?.slice(0, 16).replace(' ', 'T') || '',
                fecha_fin_programada: evento.fecha_fin_programada?.slice(0, 16).replace(' ', 'T') || '',
                fecha_realizada: evento.fecha_realizada?.slice(0, 16).replace(' ', 'T') || '',
                fecha_fin_real: evento.fecha_fin_real?.slice(0, 16).replace(' ', 'T') || '',
                etiquetas: normalizarEtiquetas(evento.etiquetas),
            });
            setDateWarning('');
            setCoordenadas({ latitud: null, longitud: null });
            setGpsStatus('');
            setErrorRed(false);
            setNuevaEtiquetaInput('');
        }
    }, [logic.modalGestionEventoAbierto, evento]);

    // ✅ useMemo SIEMPRE antes de cualquier return condicional (Rules of Hooks)
    const sugerenciasEtiquetas = useMemo(() => {
        const catalogo = (etiquetas || [])
            .map((e) => (typeof e === 'object' && e !== null ? e.nombre : e))
            .filter(Boolean);
        const actuales = normalizarEtiquetas(formReporte.data.etiquetas);
        return Array.from(new Set([...catalogo, ...actuales]));
    }, [etiquetas, formReporte.data.etiquetas]);

    if (!logic.modalGestionEventoAbierto || !evento) return null;

    const handleActualizar = () => {
        setErrorRed(false);

        const originalStart = evento.fecha_programada?.slice(0, 16).replace(' ', 'T') || '';
        const currentStart = formReporte.data.fecha_programada?.replace(' ', 'T') || '';
        const dateChanged = originalStart !== currentStart;

        if (formReporte.data.estado === 'reprogramada' && !dateChanged) {
            setDateWarning('Debes cambiar la fecha y hora de la actividad para poder reprogramarla.');
            return;
        }

        // Si el usuario dejó texto en el input de nueva etiqueta, procesarlo directamente en el payload
        let tagsActuales = [...normalizarEtiquetas(formReporte.data.etiquetas)];
        const textoTag = nuevaEtiquetaInput.trim();
        if (textoTag && !tagsActuales.includes(textoTag)) {
            tagsActuales.push(textoTag);
        }

        router.post(
            route('visitador.eventos.gestionar', evento.id),
            {
                ...formReporte.data,
                etiquetas: tagsActuales,
                latitud: coordenadas.latitud ?? formReporte.data.latitud,
                longitud: coordenadas.longitud ?? formReporte.data.longitud,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    logic.setModalGestionEventoAbierto(false);
                    setNuevaEtiquetaInput('');
                },
                onError: (errors) => console.log('Errores de validación backend:', errors),
            }
        );
    };

    const handleSelectOption = (optId) => {
        const originalStart = evento.fecha_programada?.slice(0, 16).replace(' ', 'T') || '';
        const currentStart = formReporte.data.fecha_programada?.replace(' ', 'T') || '';
        const dateChanged = originalStart !== currentStart;

        if (optId === 'reprogramada' && !dateChanged) {
            setDateWarning('Debes cambiar la fecha y hora de la actividad para poder reprogramarla.');
        } else {
            setDateWarning('');
        }

        formReporte.setData('estado', optId);

        if (optId === 'realizado') {
            capturarUbicacion();
        } else {
            setCoordenadas({ latitud: null, longitud: null });
            setGpsStatus('');
        }
    };

    const toggleEtiqueta = (tag) => {
        if (esRealizado) return;
        const seleccionadas = normalizarEtiquetas(formReporte.data.etiquetas);
        const nuevas = seleccionadas.includes(tag)
            ? seleccionadas.filter((t) => t !== tag)
            : [...seleccionadas, tag];
        formReporte.setData('etiquetas', nuevas);
    };

    const agregarNuevaEtiqueta = (e) => {
        if (e) e.preventDefault();
        if (esRealizado) return;
        const texto = nuevaEtiquetaInput.trim();
        if (!texto) return;
        const seleccionadas = normalizarEtiquetas(formReporte.data.etiquetas);
        if (!seleccionadas.includes(texto)) {
            formReporte.setData('etiquetas', [...seleccionadas, texto]);
        }
        setNuevaEtiquetaInput('');
    };

    const opciones = [
        { id: 'realizado', label: 'Realizada', icon: FaCircleCheck, color: 'text-green-500' },
        { id: 'reprogramada', label: 'Reprogramar', icon: FaClock, color: 'text-blue-500' },
        { id: 'cancelado', label: 'Cancelada', icon: FaBan, color: 'text-red-500' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => logic.setModalGestionEventoAbierto(false)}
            />

            {/* Ventana modal */}
            <div className="relative bg-white w-full max-w-lg rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <button
                    type="button"
                    onClick={() => logic.setModalGestionEventoAbierto(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label="Cerrar modal"
                >
                    <FaXmark className="text-xl" />
                </button>

                <div className="mb-5">
                    <h2 className="text-xl font-black uppercase text-slate-800">Gestionar Actividad</h2>
                    <p className="text-xs text-indigo-600 font-bold mt-1">{evento.nombre_evento}</p>
                    <div className="h-1 w-10 bg-indigo-600 mt-1.5 rounded-full" />
                </div>

                <div className="space-y-4">
                    {/* Modo solo lectura si ya está realizada */}
                    {esRealizado && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                            <p className="text-xs text-emerald-700 font-black uppercase tracking-wide">
                                ✓ Actividad completada (Realizada) — Modo solo lectura
                            </p>
                        </div>
                    )}

                    {/* Nombre del Evento */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Nombre de la Actividad
                        </label>
                        <input
                            type="text"
                            disabled={esRealizado}
                            className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 outline-none ${
                                esRealizado
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none'
                                    : 'bg-gray-50 focus:ring-2 focus:ring-indigo-500'
                            }`}
                            value={formReporte.data.nombre_evento}
                            onChange={(e) => formReporte.setData('nombre_evento', e.target.value)}
                        />
                    </div>

                    {/* Etiquetas */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Etiquetas
                        </label>

                        {sugerenciasEtiquetas.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mb-2 mt-1.5">
                                {sugerenciasEtiquetas.map((tag) => {
                                    const seleccionada = (formReporte.data.etiquetas || []).includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            disabled={esRealizado}
                                            onClick={() => toggleEtiqueta(tag)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                                                seleccionada
                                                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                            } ${esRealizado ? 'opacity-70 cursor-default' : ''}`}
                                        >
                                            <span>{seleccionada ? '✓' : '+'}</span>
                                            <span>{tag}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[11px] text-gray-400 italic mb-2 mt-1">
                                No hay etiquetas creadas todavía. Escribe una nueva abajo para agregarla.
                            </p>
                        )}

                        {!esRealizado && (
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
                        )}
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Fecha y Hora Inicio
                            </label>
                            <input
                                type="datetime-local"
                                disabled={esRealizado}
                                className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 outline-none ${
                                    esRealizado
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none'
                                        : 'bg-gray-50 focus:ring-2 focus:ring-indigo-500'
                                }`}
                                value={formReporte.data.fecha_programada || ''}
                                onChange={(e) => formReporte.setData('fecha_programada', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Fecha y Hora Fin
                            </label>
                            <input
                                type="datetime-local"
                                disabled={esRealizado}
                                className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 outline-none ${
                                    esRealizado
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none'
                                        : 'bg-gray-50 focus:ring-2 focus:ring-indigo-500'
                                }`}
                                value={formReporte.data.fecha_fin_programada || ''}
                                onChange={(e) => formReporte.setData('fecha_fin_programada', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Resultado / Estado */}
                    {!esRealizado && (
                        <div className="space-y-2 pt-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
                                Resultado de la actividad
                            </label>

                            {dateWarning && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-700 animate-in fade-in">
                                    ⚠️ {dateWarning}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                                {opciones.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        disabled={esRealizado}
                                        onClick={() => handleSelectOption(opt.id)}
                                        className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                                            formReporte.data.estado === opt.id
                                                ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                                                : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        <opt.icon
                                            className={`text-base ${
                                                formReporte.data.estado === opt.id ? opt.color : 'text-gray-400'
                                            }`}
                                        />
                                        <span className="text-xs font-bold">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Estatus del GPS */}
                            {formReporte.data.estado === 'realizado' && gpsStatus && (
                                <div
                                    className={`mt-2 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 ${
                                        gpsStatus === 'obteniendo'
                                            ? 'bg-blue-50 text-blue-500'
                                            : gpsStatus === 'ok'
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-red-50 text-red-500'
                                    }`}
                                >
                                    {gpsStatus === 'obteniendo' && (
                                        <>
                                            <span className="animate-spin">⏳</span> Obteniendo ubicación GPS...
                                        </>
                                    )}
                                    {gpsStatus === 'ok' && <>📍 Ubicación GPS capturada</>}
                                    {gpsStatus === 'error' && <>⚠️ No se pudo capturar GPS (se guardará sin coordenadas)</>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ubicación */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Ubicación / Lugar
                        </label>
                        <input
                            type="text"
                            disabled={esRealizado}
                            value={formReporte.data.ubicacion || ''}
                            onChange={(e) => formReporte.setData('ubicacion', e.target.value)}
                            placeholder="Dirección, sede o lugar..."
                            className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 outline-none ${
                                esRealizado
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none'
                                    : 'bg-gray-50 focus:ring-2 focus:ring-indigo-500'
                            }`}
                        />
                    </div>

                    {/* Comentarios */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Notas / Comentarios
                        </label>
                        <textarea
                            disabled={esRealizado}
                            value={formReporte.data.comentario || ''}
                            onChange={(e) => formReporte.setData('comentario', e.target.value)}
                            className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 h-20 resize-none outline-none ${
                                esRealizado
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none'
                                    : 'bg-gray-50 focus:ring-2 focus:ring-indigo-500'
                            }`}
                            placeholder="Notas sobre el evento..."
                        />
                    </div>

                    {/* Errores de validación backend */}
                    {Object.keys(formReporte.errors).length > 0 && (
                        <div className="p-3 bg-red-50 rounded-xl">
                            {Object.values(formReporte.errors).map((err, i) => (
                                <p key={i} className="text-[10px] text-red-600 font-bold uppercase">• {err}</p>
                            ))}
                        </div>
                    )}

                    {/* Error de Red */}
                    {errorRed && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                            <FaTriangleExclamation className="text-amber-500 text-xs mt-0.5 shrink-0" />
                            <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                                No se pudo guardar — revisa tu conexión e intenta de nuevo.
                            </p>
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => logic.setModalGestionEventoAbierto(false)}
                            className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-[10px] tracking-widest transition-all"
                        >
                            {esRealizado ? 'CERRAR' : 'CANCELAR'}
                        </button>
                        {!esRealizado && (
                            <button
                                type="button"
                                onClick={handleActualizar}
                                disabled={gpsStatus === 'obteniendo' || formReporte.processing}
                                className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                            >
                                {gpsStatus === 'obteniendo'
                                    ? 'OBTENIENDO GPS...'
                                    : formReporte.processing
                                    ? 'GUARDANDO...'
                                    : 'GUARDAR CAMBIOS'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalGestionarEvento;