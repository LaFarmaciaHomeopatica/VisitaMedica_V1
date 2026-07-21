import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { FaCrown, FaBell, FaPhoneFlip, FaLocationDot, FaSpinner, FaArrowsRotate } from 'react-icons/fa6';

// ─── Hero del médico (carga siempre al instante, independiente de Odoo) ──────
const HeroMedico = ({ medico, mesActual, puestoReal, cargandoOdoo, googleMapsUrl }) => {
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [actualizando, setActualizando] = useState(false);

    const handleRefrescar = () => {
        if (actualizando) return;
        setActualizando(true);
        router.post(route('visitador.top-medicos.refrescarMedico', medico.documento), {}, {
            preserveScroll: true,
            preserveState: false, // fuerza que la página vuelva a pedir odooDatosPesados
            onFinish: () => setActualizando(false),
        });
    };

    return (
        <section className="bg-gradient-to-br from-[#1C85E8] to-[#0A69C2] p-6 rounded-[30px] shadow-lg text-white relative">
            <div className="flex items-start gap-4">

                {/* Avatar puesto ranking */}
                {(() => {
                    let colorFondo = "bg-white/20";
                    if (puestoReal === 1) colorFondo = "bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-200 border-2";
                    if (puestoReal === 2) colorFondo = "bg-gradient-to-br from-slate-300 to-slate-500 border-slate-200 border-2";
                    if (puestoReal === 3) colorFondo = "bg-gradient-to-br from-orange-400 to-amber-700 border-orange-300 border-2";
                    return (
                        <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-white/30 backdrop-blur-md transition-all duration-300 ${colorFondo}`}>
                            {puestoReal === 1 && <FaCrown size={12} className="text-white mb-0.5 animate-bounce" />}
                            <span className="text-base font-black text-white leading-none">
                                {cargandoOdoo ? <FaSpinner className="animate-spin text-sm text-white/70" /> : puestoReal ? `#${puestoReal}` : '—'}
                            </span>
                        </div>
                    );
                })()}

                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-extrabold text-white leading-tight">
                        {medico?.nombre}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
                            {medico?.especialidad || 'General'}
                        </span>
                        <Link
                            href={`/visitador/alertas/${medico.documento}?mes=${mesActual}`}
                            className="bg-amber-400/90 hover:bg-amber-400 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-300/40 transition-all active:scale-95 flex items-center gap-1"
                        >
                            <FaBell size={9} /> Alerta
                        </Link>
                        <button
                            onClick={() => setMostrarDetalles(!mostrarDetalles)}
                            className="bg-white/20 hover:bg-white/35 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/20 transition-all active:scale-95"
                        >
                            {mostrarDetalles ? 'Cerrar' : 'Info'}
                        </button>
                        <button
                            onClick={handleRefrescar}
                            disabled={actualizando}
                            title="Actualizar datos de Odoo solo de este médico"
                            className="bg-white/20 hover:bg-white/35 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-white/20 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1"
                        >
                            <FaArrowsRotate size={9} className={actualizando ? 'animate-spin' : ''} />
                            {actualizando ? 'Actualizando' : 'Refrescar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Datos detallados — desplegable */}
            {mostrarDetalles && (
                <div className="bg-white/90 backdrop-blur-md rounded-[20px] border border-white/50 mt-5 p-5 text-slate-800 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Documento</p>
                                <p className="text-xs font-bold text-gray-700 mt-0.5">
                                    {(medico?.tipo_documento?.nombre || '') + ' ' + (medico?.documento || 'N/A')}
                                </p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">ID Registro</p>
                                <p className="text-xs font-bold text-gray-700 mt-0.5">#{medico?.id}</p>
                            </div>
                        </div>

                        <div className="space-y-3 sm:border-l sm:pl-5 border-gray-100">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Contacto Directo</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs font-bold text-gray-700">{medico?.telefono_contacto || '---'}</p>
                                    {medico?.telefono_contacto && (
                                        <a href={`tel:${medico.telefono_contacto}`} className="text-[#24C765] hover:scale-110 transition-transform">
                                            <FaPhoneFlip className="text-[11px]" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Horario de Atención</p>
                                <p className="text-xs font-bold text-gray-700 mt-0.5">{medico?.horario_atencion || 'No definido'}</p>
                            </div>
                        </div>

                        <div className="sm:border-l sm:pl-5 border-gray-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Dirección de Consultorio</p>
                            <div className="flex items-start gap-2 mt-0.5">
                                <p className="text-xs font-bold text-gray-700 leading-tight flex-1">
                                    {medico?.direccion_detalles || 'Sin dirección registrada'}
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
    );
};

export default HeroMedico;
