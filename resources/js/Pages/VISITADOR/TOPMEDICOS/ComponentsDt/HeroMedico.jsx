import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
    FaCrown, FaBell, FaPhoneFlip, FaLocationDot, FaSpinner,
    FaArrowsRotate, FaCommentDots, FaXmark, FaCheck
} from 'react-icons/fa6';

// ─── Hero del médico (carga siempre al instante, independiente de Odoo) ──────
const HeroMedico = ({ medico, mesActual, puestoReal, cargandoOdoo, googleMapsUrl }) => {
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [actualizando, setActualizando] = useState(false);

    // Estados para las observaciones del médico
    const [observacionMedicoAbierta, setObservacionMedicoAbierta] = useState(false);
    const [textoObservacionMedico, setTextoObservacionMedico] = useState(medico.observaciones ?? '');
    const [guardandoObsMedico, setGuardandoObsMedico] = useState(false);
    const [editandoObservacion, setEditandoObservacion] = useState(false);

    const handleRefrescar = () => {
        if (actualizando) return;
        setActualizando(true);
        router.post(route('visitador.top-medicos.refrescarMedico', medico.documento), {}, {
            preserveScroll: true,
            preserveState: false, // fuerza que la página vuelva a pedir odooDatosPesados
            onFinish: () => setActualizando(false),
        });
    };

    const handleAbrirObservaciones = () => {
        setTextoObservacionMedico(medico.observaciones ?? '');
        setEditandoObservacion(!medico.observaciones); // Editable de inicio solo si está vacío
        setObservacionMedicoAbierta(true);
    };

    const handleGuardarObservacionMedico = () => {
        if (!medico.id) return;

        setGuardandoObsMedico(true);
        router.patch(route('Gmedicos.observaciones', medico.id), {
            observaciones: textoObservacionMedico,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setObservacionMedicoAbierta(false);
                setEditandoObservacion(false);
            },
            onError: () => alert('Ocurrió un error al guardar la observación'),
            onFinish: () => setGuardandoObsMedico(false),
        });
    };

    return (
        <><section className="bg-gradient-to-br from-[#1C85E8] to-[#0A69C2] p-5 sm:p-6 rounded-[30px] shadow-lg text-white relative">
    
    {/* ── CONTENEDOR PRINCIPAL (En móvil pasa a columna) ── */}
    <div className="flex flex-col sm:flex-row sm:items-start gap-4">

        {/* 1. Cabecera superior en móvil: Puesto + Nombre */}
        <div className="flex items-center sm:items-start gap-3 sm:gap-4">
            {/* Avatar puesto ranking */}
            {(() => {
                let colorFondo = "bg-white/20";
                if (puestoReal === 1) colorFondo = "bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-200 border-2";
                if (puestoReal === 2) colorFondo = "bg-gradient-to-br from-slate-300 to-slate-500 border-slate-200 border-2";
                if (puestoReal === 3) colorFondo = "bg-gradient-to-br from-orange-400 to-amber-700 border-orange-300 border-2";
                return (
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-white/30 backdrop-blur-md transition-all duration-300 ${colorFondo}`}>
                        {puestoReal === 1 && <FaCrown size={12} className="text-white mb-0.5 animate-bounce" />}
                        <span className="text-sm sm:text-base font-black text-white leading-none">
                            {cargandoOdoo ? <FaSpinner className="animate-spin text-sm text-white/70" /> : puestoReal ? `#${puestoReal}` : '—'}
                        </span>
                    </div>
                );
            })()}

            {/* Nombre (En escritorio comparte fila, en móvil queda al lado de #152) */}
            <div className="flex-1 min-w-0 sm:hidden">
                <h2 className="text-base font-extrabold text-white leading-tight">
                    {medico?.nombre}
                </h2>
            </div>
        </div>

        {/* 2. Bloque de Nombre (Escritorio) y Cuadrícula a ancho completo (Móvil) */}
        <div className="flex-1 min-w-0 w-full">
            
            {/* Nombre solo para pantallas medianas/grandes */}
            <h2 className="hidden sm:block text-lg font-extrabold text-white leading-tight">
                {medico?.nombre}
            </h2>

            {/* ── CUADRÍCULA A ANCHO COMPLETO (100% W) ── */}
            <div className="mt-2 sm:mt-3 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full">
                
                {/* Especialidad ocupa todo el ancho de la cuadrícula */}
                <span className="col-span-2 sm:col-span-1 text-center sm:text-left text-[9px] font-black uppercase bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/20">
                    {medico?.especialidad || 'General'}
                </span>

                {/* Alerta */}
                <Link
                    href={`/visitador/alertas/${medico.documento}?mes=${mesActual}`}
                    className="bg-amber-400/90 hover:bg-amber-400 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border border-amber-300/40 transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                >
                    <FaBell size={10} /> Alerta
                </Link>

                {/* Info */}
                <button
                    onClick={() => setMostrarDetalles(!mostrarDetalles)}
                    className="bg-white/20 hover:bg-white/35 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border border-white/20 transition-all active:scale-95 text-center"
                >
                    {mostrarDetalles ? 'Cerrar' : 'Info'}
                </button>

                {/* Refrescar */}
                <button
                    onClick={handleRefrescar}
                    disabled={actualizando}
                    title="Actualizar datos de Odoo solo de este médico"
                    className="bg-white/20 hover:bg-white/35 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border border-white/20 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                    <FaArrowsRotate size={10} className={actualizando ? 'animate-spin' : ''} />
                    {actualizando ? 'Cargando' : 'Refrescar'}
                </button>

                {/* Observaciones */}
                <button
                    onClick={handleAbrirObservaciones}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 inline-flex items-center justify-center gap-1.5 border ${
                        medico.observaciones
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-sm'
                            : 'bg-white/20 hover:bg-white/35 text-white border-white/20'
                    }`}
                >
                    <FaCommentDots size={10} />
                    Observaciones
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

                        {medico.observaciones && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#0A69C2] flex items-center gap-1.5">
                                    <FaCommentDots className="text-[#1C85E8]" /> Observaciones del Médico
                                </p>
                                <p className="text-xs font-semibold text-gray-700 mt-1 whitespace-pre-line leading-relaxed">
                                    {medico.observaciones}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* MODAL DE OBSERVACIONES DEL MÉDICO (perfil, no por visita) */}
            {observacionMedicoAbierta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-md p-6 relative text-slate-800">
                        <button
                            onClick={() => setObservacionMedicoAbierta(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                        >
                            <FaXmark className="text-base" />
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                <FaCommentDots className="text-lg" />
                            </div>
                            <div>
                                <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-800">
                                    {editandoObservacion
                                        ? (medico.observaciones ? 'Editar Observación' : 'Nueva Observación')
                                        : 'Ver Observación'
                                    }
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    Médico: <span className="font-bold text-slate-600">{medico.nombre}</span>
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <textarea
                                rows={4}
                                value={textoObservacionMedico}
                                readOnly={!editandoObservacion}
                                onChange={(e) => setTextoObservacionMedico(e.target.value)}
                                placeholder="Escribe aquí observaciones o notas generales sobre este médico..."
                                className={`w-full text-[11px] p-3 text-slate-700 rounded-lg focus:outline-none transition-all resize-none border ${
                                    !editandoObservacion
                                        ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-default'
                                        : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white'
                                }`}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            {!editandoObservacion ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setObservacionMedicoAbierta(false)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-wider transition-all"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditandoObservacion(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                    >
                                        Editar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!medico.observaciones) {
                                                setObservacionMedicoAbierta(false);
                                            } else {
                                                setEditandoObservacion(false);
                                                setTextoObservacionMedico(medico.observaciones ?? '');
                                            }
                                        }}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-wider transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={guardandoObsMedico}
                                        onClick={handleGuardarObservacionMedico}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {guardandoObsMedico ? <FaSpinner className="animate-spin text-xs" /> : <FaCheck className="text-xs" />}
                                        Guardar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HeroMedico;


