import React from 'react';
import { getEstadoEstilo, getNameById } from './visitaHelpers';

export default function VisitaViewModal({ isOpen, onClose, visita, medicos, visitadores }) {
    if (!isOpen || !visita) return null;

    const medicoActual = medicos?.find(m => m.id === visita.medico_id);
    const tieneUbicacion = visita.latitud && visita.longitud;

    const mapaUrl = tieneUbicacion
        ? `https://maps.google.com/maps?q=${visita.latitud},${visita.longitud}&z=16&output=embed`
        : null;

    const googleMapsLink = tieneUbicacion
        ? `https://www.google.com/maps/search/?api=1&query=${visita.latitud},${visita.longitud}`
        : null;

        // Agrega esta función justo antes del return
const formatearFecha = (fechaStr) => {
    if (!fechaStr) return null;
    const fecha = new Date(fechaStr.replace(' ', 'T'));
    const fechaFormato = fecha.toLocaleDateString('es-CO');
    const horaFormato  = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${fechaFormato} ${horaFormato.toUpperCase()}`;
};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            {/* Contenedor principal — ancho máximo grande, layout horizontal */}
            <div className="relative bg-white w-full max-w-7xl rounded-[30px] shadow-2xl border border-slate-100 max-h-[92vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center px-8 pt-7 pb-5 border-b border-slate-100 shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">DETALLE DE VISITA</h3>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Ficha Informativa</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getEstadoEstilo(visita.estado)}`}>
                        {visita.estado}
                    </span>
                </div>

                {/* Cuerpo — dos columnas */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── COLUMNA IZQUIERDA: Información ── */}
                    <div className="w-[42%] overflow-y-auto px-8 py-6 space-y-5 border-r border-slate-100">

                        {/* Médico */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Médico</label>
                            <p className="text-[13px] font-black text-slate-800 uppercase leading-tight">
                                {medicoActual
                                    ? `${medicoActual.nombre} ${medicoActual.apellido || ''}`
                                    : 'MÉDICO NO ENCONTRADO'}
                            </p>
                            {medicoActual && (medicoActual.direccion_detalles || medicoActual.geolocalizacion) && (
                                <div className="mt-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                                    {medicoActual.direccion_detalles && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(medicoActual.direccion_detalles)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-[10px] text-slate-600 font-medium hover:text-[#3D3FD8] hover:underline truncate"
                                        >
                                            <span className="font-bold text-slate-700">Dir:</span> {medicoActual.direccion_detalles}
                                        </a>
                                    )}
                                    {medicoActual.geolocalizacion && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${medicoActual.geolocalizacion}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[9px] text-slate-500 font-mono hover:text-[#3D3FD8] hover:underline"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#3D3FD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>Base: {medicoActual.geolocalizacion}</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Visitador */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Visitador</label>
                            <p className="text-[13px] font-black text-slate-800 uppercase leading-tight">
                                {getNameById(visitadores, visita.visitador_id)}
                            </p>
                        </div>

                        {/* Fechas */}
<div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
    <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Programada</label>
        <p className="text-xs font-bold text-slate-600 italic">
            {formatearFecha(visita.fecha_programada) || 'NO DEFINIDA'}
        </p>
    </div>
    <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fin Programada</label>
        <p className="text-xs font-bold text-blue-600 italic">
            {formatearFecha(visita.fecha_realizada) || 'SIN REGISTRO'}
        </p>
    </div>
    <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Finalizada</label>
        <p className="text-xs font-bold text-blue-600 italic">
            {formatearFecha(visita.fecha_fin_real) || 'SIN REGISTRO'}
        </p>
    </div>

</div>

                        {/* Muestra */}
                        <div className="border-t border-slate-100 pt-5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">Muestra</label>
                            <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100">
                                <p className="text-[11px] font-black text-[#3D3FD8] uppercase">
                                    {visita.muestras || 'NINGUNA MUESTRA REGISTRADA'}
                                </p>
                                {visita.comentario_muestra && (
                                    <p className="text-[10px] font-bold text-slate-500 mt-1 italic">
                                        Nota: {visita.comentario_muestra}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Comentarios */}
                        <div className="border-t border-slate-100 pt-5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Notas de la Visita</label>
                            <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                                "{visita.comentarios || 'EL VISITADOR NO HA INGRESADO COMENTARIOS ADICIONALES.'}"
                            </p>
                        </div>

                        {/* Coordenadas (si existen) */}
                        {tieneUbicacion && (
                            <div className="border-t border-slate-100 pt-5 flex gap-6">
                                <span className="text-[10px] font-bold text-slate-400">
                                    LAT: <span className="text-slate-600">{visita.latitud}</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    LNG: <span className="text-slate-600">{visita.longitud}</span>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── COLUMNA DERECHA: Mapa ── */}
                    <div className="flex-1 flex flex-col">

                        {/* Título del mapa */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                📍 Ubicación al cerrar visita
                            </span>
                            {tieneUbicacion && (
                                <a
                                    href={googleMapsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-black text-[#3D3FD8] uppercase tracking-wider hover:underline"
                                >
                                    Abrir en Maps ↗
                                </a>
                            )}
                        </div>

                        {/* Mapa o placeholder */}
                        <div className="flex-1">
                            {tieneUbicacion ? (
                                <iframe
                                    title="Ubicación de la visita"
                                    src={mapaUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, minHeight: '300px' }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-3">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-wider">Sin ubicación registrada</p>
                                    <p className="text-[10px] text-slate-400">Solo se captura al marcar efectiva</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 text-white py-3.5 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl active:scale-95"
                    >
                        CERRAR PANEL
                    </button>
                </div>
            </div>
        </div>
    );
}