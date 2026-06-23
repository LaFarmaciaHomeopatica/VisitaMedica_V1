import React from 'react';
import { getEstadoEstilo, getNameById } from './visitaHelpers';

export default function VisitaViewModal({ isOpen, onClose, visita, medicos, visitadores }) {
    if (!isOpen || !visita) return null;

    const medicoActual = medicos?.find(m => m.id === visita.medico_id);
    const tieneUbicacion = visita.latitud && visita.longitud;

    // URL de Google Maps estática (no requiere API key para embed básico)
    const mapaUrl = tieneUbicacion
        ? `https://maps.google.com/maps?q=${visita.latitud},${visita.longitud}&z=16&output=embed`
        : null;

    const googleMapsLink = tieneUbicacion
        ? `https://www.google.com/maps?q=${visita.latitud},${visita.longitud}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            {/* max-w-2xl para que sea más ancho */}
            <div className="relative bg-white w-full max-w-2xl rounded-[30px] shadow-2xl p-8 border border-slate-100 max-h-[92vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">DETALLE DE VISITA</h3>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Ficha Informativa</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getEstadoEstilo(visita.estado)}`}>
                        {visita.estado}
                    </span>
                </div>

                <div className="space-y-6">
                    {/* Médico + Visitador */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Médico</label>
                            <p className="text-[13px] font-black text-slate-800 uppercase leading-tight">
                                {medicoActual
                                    ? `${medicoActual.nombre} ${medicoActual.apellido || ''}`
                                    : 'MÉDICO NO ENCONTRADO'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Visitador</label>
                            <p className="text-[13px] font-black text-slate-800 uppercase leading-tight">
                                {getNameById(visitadores, visita.visitador_id)}
                            </p>
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fecha Programada</label>
                            <p className="text-xs font-bold text-slate-600 italic">{visita.fecha_programada || 'NO DEFINIDA'}</p>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fecha de Realización</label>
                            <p className="text-xs font-bold text-blue-600 italic">{visita.fecha_realizada || 'SIN REGISTRO FINAL'}</p>
                        </div>
                    </div>

                    {/* Muestras */}
                    <div className="border-t border-slate-100 pt-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">Muestra</label>
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
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
                    <div className="bg-slate-50/80 rounded-[20px] p-6 border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest text-center border-b border-slate-200 pb-2">
                            Notas de la Visita
                        </label>
                        <p className="text-xs text-slate-600 font-bold leading-relaxed italic text-center">
                            "{visita.comentarios || 'EL VISITADOR NO HA INGRESADO COMENTARIOS ADICIONALES.'}"
                        </p>
                    </div>

                    {/* ── UBICACIÓN AL CERRAR VISITA ── */}
                    <div className="border-t border-slate-100 pt-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                📍 Ubicación al cerrar visita
                            </label>
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

                        {tieneUbicacion ? (
                            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <iframe
                                    title="Ubicación de la visita"
                                    src={mapaUrl}
                                    width="100%"
                                    height="280"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex gap-6">
                                    <span className="text-[10px] font-bold text-slate-400">
                                        LAT: <span className="text-slate-600">{visita.latitud}</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        LNG: <span className="text-slate-600">{visita.longitud}</span>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-2xl p-5 border border-dashed border-slate-200 text-center">
                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                                    Sin ubicación registrada
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Solo se captura al marcar la visita como efectiva
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-10">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 text-white py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl active:scale-95"
                    >
                        CERRAR PANEL
                    </button>
                </div>
            </div>
        </div>
    );
}