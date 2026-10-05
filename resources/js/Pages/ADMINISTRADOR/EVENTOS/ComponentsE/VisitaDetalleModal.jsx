import React, { useState } from 'react';
import { getEstadoEstilo, getNameById } from '../../VISITAS/ComponentsV/visitaHelpers';

const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '—';

    // Maneja objetos Date, strings ISO y strings con espacios en lugar de T
    const fecha = fechaStr instanceof Date 
        ? fechaStr 
        : new Date(typeof fechaStr === 'string' ? fechaStr.replace(' ', 'T') : fechaStr);

    if (isNaN(fecha.getTime())) return '—';

    const fechaFormato = fecha.toLocaleDateString('es-CO', { dateStyle: 'medium' });
    const horaFormato = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${fechaFormato} · ${horaFormato}`;
};

const Fila = ({ titulo, children }) => (
    <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-0.5">{titulo}</p>
        <div className="text-xs sm:text-sm text-slate-800 font-bold">{children}</div>
    </div>
);

export default function VisitaDetalleModal({
    isOpen,
    onClose,
    visita,
    visitadores = [],
    onEdit,
    onDelete,
    deleting = false,
}) {
    const [confirmar, setConfirmar] = useState(false);

    if (!isOpen || !visita) return null;

    const cerrar = () => {
        setConfirmar(false);
        onClose();
    };

    const medico = visita.medico;
    const visitadorNombre = visita.visitador?.nombre || getNameById(visitadores, visita.visitador_id);
    const tieneUbicacion = visita.latitud && visita.longitud;

    const mapaUrl = tieneUbicacion
        ? `https://maps.google.com/maps?q=${visita.latitud},${visita.longitud}&z=16&output=embed`
        : null;

    const googleMapsLink = tieneUbicacion
        ? `https://www.google.com/maps/search/?api=1&query=${visita.latitud},${visita.longitud}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={cerrar} />

            <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg">🩺</span>
                            <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase">
                                Detalle de Visita Médica
                            </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                            {medico ? `${medico.nombre} ${medico.apellido || ''}` : 'Visita registrada'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getEstadoEstilo(
                                visita.estado
                            )}`}
                        >
                            {visita.estado}
                        </span>
                        <button
                            type="button"
                            onClick={cerrar}
                            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {/* Médico y Visitador */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Fila titulo="Médico / Contacto">
                            <p className="text-sm font-black text-slate-900 uppercase">
                                {medico ? `${medico.nombre} ${medico.apellido || ''}` : 'No asignado'}
                            </p>
                            {medico?.documento && (
                                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                    Doc: {medico.documento}
                                </p>
                            )}
                            {medico?.direccion_detalles && (
                                <p className="text-[11px] text-slate-600 font-medium mt-0.5 truncate">
                                    📍 {medico.direccion_detalles}
                                </p>
                            )}
                        </Fila>

                        <Fila titulo="Visitador Responsable">
                            <p className="text-sm font-bold text-slate-800 uppercase">{visitadorNombre}</p>
                        </Fila>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <Fila titulo="Fecha Programada">{formatearFecha(visita.fecha_programada)}</Fila>
                        <Fila titulo="Fecha de Cierre / Realizada">{formatearFecha(visita.fecha_realizada)}</Fila>
                        {(visita.fecha_fin_real || visita.fecha_fin || visita.fechaFinReal) && (
                            <Fila titulo="Fecha Fin Real">
                                {formatearFecha(visita.fecha_fin_real || visita.fecha_fin || visita.fechaFinReal)}
                            </Fila>
                        )}
                    </div>

                    {/* Muestras */}
                    <div className="border-t border-slate-100 pt-4">
                        <Fila titulo="Muestras / Productos">
                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mt-1">
                                <p className="text-xs font-black text-[#3D3FD8] uppercase">
                                    {visita.muestras || 'NINGUNA MUESTRA REGISTRADA'}
                                </p>
                                {visita.comentario_muestra && (
                                    <p className="text-[11px] text-slate-600 font-medium mt-1">
                                        Detalle: {visita.comentario_muestra}
                                    </p>
                                )}
                            </div>
                        </Fila>
                    </div>

                    {/* Comentarios */}
                    <div className="border-t border-slate-100 pt-4">
                        <Fila titulo="Notas de la Visita">
                            <p className="text-xs text-slate-700 font-medium italic whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                                {visita.comentarios ? `"${visita.comentarios}"` : 'Sin notas adicionales.'}
                            </p>
                        </Fila>
                    </div>

                    {/* Ubicación / Mapa */}
                    {tieneUbicacion && (
                        <div className="border-t border-slate-100 pt-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
                                    📍 Coordenadas al cerrar visita
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
                                    title="Ubicación visita"
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

                {/* Footer de Acciones */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    {confirmar ? (
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs sm:text-sm text-red-600 font-bold">
                                ¿Deseas eliminar esta visita médica? Esta acción no se puede deshacer.
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
                                    onClick={() => onDelete && onDelete(visita)}
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
                                Eliminar Visita
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
                                    onClick={() => onEdit && onEdit(visita)}
                                    className="px-4 py-2 text-xs font-black text-white bg-[#3D3FD8] rounded-xl hover:bg-blue-700 transition-all shadow-md"
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
}