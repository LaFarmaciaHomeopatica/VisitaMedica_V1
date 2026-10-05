import React, { useState } from 'react';
import { parseFecha, COLORES_ESTADO, ETIQUETA_ESTADO } from '../HooksE/useEventoForm';

const formatear = (valor) => {
    const d = parseFecha(valor);
    return d && !isNaN(d) ? d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
};

const Fila = ({ titulo, children }) => (
    <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-0.5">{titulo}</p>
        <div className="text-xs sm:text-sm text-slate-800 font-bold">{children}</div>
    </div>
);

const EventoDetalleModal = ({ isOpen, onClose, evento, onEdit, onDelete, deleting = false }) => {
    const [confirmar, setConfirmar] = useState(false);

    if (!isOpen || !evento) return null;

    const cerrar = () => {
        setConfirmar(false);
        onClose();
    };

    // Extrae y normaliza las etiquetas
    const listaEtiquetas = Array.isArray(evento.etiquetas)
        ? evento.etiquetas.map((item) => (typeof item === 'object' ? item.nombre : item))
        : [];

    const tieneCoordenadas =
        evento.latitud !== null &&
        evento.longitud !== null &&
        evento.latitud !== undefined &&
        evento.longitud !== undefined &&
        evento.latitud !== '' &&
        evento.longitud !== '';

    const mapaUrl = tieneCoordenadas
        ? `https://maps.google.com/maps?q=${evento.latitud},${evento.longitud}&z=16&output=embed`
        : null;

    const googleMapsLink = tieneCoordenadas
        ? `https://www.google.com/maps/search/?api=1&query=${evento.latitud},${evento.longitud}`
        : null;

    const handleEliminar = () => {
        if (typeof onDelete === 'function') {
            onDelete(evento);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={cerrar} />

            <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
                {/* Encabezado */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg">🎯</span>
                            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase">
                                {evento.nombre_evento || 'Sin título'}
                            </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {/* Estado del evento */}
                            <span
                                className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full border font-black uppercase tracking-wider ${
                                    COLORES_ESTADO?.[evento.estado] || COLORES_ESTADO?.programado || 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {ETIQUETA_ESTADO?.[evento.estado] || evento.estado}
                            </span>

                            {/* Badges de etiquetas */}
                            {listaEtiquetas.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={cerrar}
                        className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Detalle */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <Fila titulo="Visitador Responsable">
                        <p className="text-sm font-bold text-slate-800 uppercase">{evento.visitador?.nombre || '—'}</p>
                    </Fila>

                    {/* Fechas de inicio y fin */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <Fila titulo="Fecha y Hora de Inicio">{formatear(evento.fecha_programada)}</Fila>
                        <Fila titulo="Fecha y Hora de Fin">{formatear(evento.fecha_fin_programada)}</Fila>
                    </div>

                    {(evento.fecha_realizada || evento.fecha_fin_real) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                            <Fila titulo="Fecha Realizada">{formatear(evento.fecha_realizada)}</Fila>
                            <Fila titulo="Fin Real">{formatear(evento.fecha_fin_real)}</Fila>
                        </div>
                    )}

                    {/* Ubicación */}
                    <div className="border-t border-slate-100 pt-4">
                        <Fila titulo="Ubicación / Lugar">
                            <p className="text-xs sm:text-sm font-bold text-slate-800">{evento.ubicacion || '—'}</p>
                        </Fila>
                    </div>

                    {/* Comentario */}
                    <div className="border-t border-slate-100 pt-4">
                        <Fila titulo="Comentario / Descripción">
                            <p className="whitespace-pre-wrap text-slate-700 font-medium text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                                {evento.comentario || 'Sin comentarios adicionales.'}
                            </p>
                        </Fila>
                    </div>

                    {/* Ubicación / Mapa */}
                    {tieneCoordenadas && (
                        <div className="border-t border-slate-100 pt-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
                                    📍 Coordenadas de la actividad
                                </p>
                                <a
                                    href={googleMapsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-[#3D3FD8] hover:underline flex items-center gap-1"
                                >
                                    Ver en Google Maps ↗
                                </a>
                            </div>
                            <div className="h-44 rounded-xl overflow-hidden border border-slate-200">
                                <iframe
                                    title="Ubicación actividad"
                                    src={mapaUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Acciones */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    {confirmar ? (
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs sm:text-sm text-red-600 font-bold">
                                ¿Eliminar esta actividad? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setConfirmar(false)}
                                    disabled={deleting}
                                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
                                >
                                    No
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEliminar}
                                    disabled={deleting}
                                    className="px-4 py-1.5 text-xs font-black text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm disabled:opacity-50"
                                >
                                    {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmar(true)}
                                className="px-3 py-2 text-xs font-bold text-red-600 border border-red-200 bg-red-50/50 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors"
                            >
                                Eliminar Actividad
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={cerrar}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onEdit && onEdit(evento)}
                                    className="px-4 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md"
                                >
                                    Editar / Reprogramar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventoDetalleModal;