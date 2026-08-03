import React, { useState, useMemo, useRef, useEffect } from 'react';

export default function MedicoFormModal({
    isOpen, onClose,
    isEditing, data, setData, errors,
    processing, onSubmit,
    tiposDocumento,
    visitadorNombre,
    visitadores = [], 
}) {
    const [busquedaVisitador, setBusquedaVisitador] = useState('');
    const [abiertoVisitador, setAbiertoVisitador] = useState(false);
    const wrapperRef = useRef(null);

    // Cierra el dropdown si se hace click afuera
    useEffect(() => {
        const handleClickFuera = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setAbiertoVisitador(false);
            }
        };
        document.addEventListener('mousedown', handleClickFuera);
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, []);

    // Nombre completo del visitador seleccionado
    const nombreSeleccionado = useMemo(() => {
        if (visitadorNombre) return visitadorNombre;
        const enc = visitadores.find(v => String(v.id) === String(data.visitador_id));
        return enc ? `${enc.nombre || ''} ${enc.apellido || ''}`.trim() : '';
    }, [visitadorNombre, visitadores, data.visitador_id]);

    // Búsqueda optimizada (incluye ID, nombre, apellido y Nombre + Apellido combinados)
    const resultados = useMemo(() => {
        const q = busquedaVisitador.trim().toLowerCase();
        if (!q) return visitadores.slice(0, 8);
        
        return visitadores
            .filter(v => {
                const nombreCompleto = `${v.nombre || ''} ${v.apellido || ''}`.toLowerCase();
                const idStr = String(v.id);
                return idStr.includes(q) || nombreCompleto.includes(q);
            })
            .slice(0, 8);
    }, [busquedaVisitador, visitadores]);

    if (!isOpen) return null;

    const seleccionarVisitador = (v) => {
        setData('visitador_id', v.id);
        setBusquedaVisitador('');
        setAbiertoVisitador(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
                <form onSubmit={onSubmit} className="max-h-[90vh] overflow-y-auto p-6">
                    <h3 className="text-lg font-black text-slate-800 mb-4 uppercase">
                        {isEditing ? 'Editar' : 'Nuevo'} Médico
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                            placeholder="Nombre Completo" 
                            value={data.nombre} 
                            onChange={e => setData('nombre', e.target.value)}
                            className="col-span-1 md:col-span-2 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            required 
                        />

                        <input 
                            placeholder="Documento / Cédula / RUC" 
                            type="text" 
                            value={data.documento} 
                            onChange={e => setData('documento', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                            required 
                        />

                        {errors.documento && (
                            <div className="col-span-1 md:col-span-2 text-red-500 text-[11px] w-full mt-1 font-bold pl-1">
                                {errors.documento}
                            </div>
                        )}

                        <input 
                            placeholder="Teléfono" 
                            value={data.telefono_contacto} 
                            onChange={e => setData('telefono_contacto', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" 
                        />
                        
                        <input 
                            placeholder="Horario" 
                            value={data.horario_atencion} 
                            onChange={e => setData('horario_atencion', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" 
                        />

                        <input 
                            placeholder="Dirección" 
                            value={data.direccion_detalles} 
                            onChange={e => setData('direccion_detalles', e.target.value)}
                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" 
                        />

                        <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded-2xl flex gap-3">
                            <div className="flex-1 relative" ref={wrapperRef}>
                                <label className="text-[9px] font-black text-blue-600 uppercase block mb-1 tracking-widest">
                                    Visitador
                                </label>

                                <input
                                    type="text"
                                    placeholder="Buscar por ID, nombre o apellido..."
                                    value={abiertoVisitador ? busquedaVisitador : (nombreSeleccionado || data.visitador_id || '')}
                                    onChange={e => {
                                        setBusquedaVisitador(e.target.value);
                                        setAbiertoVisitador(true);
                                    }}
                                    onFocus={() => {
                                        setBusquedaVisitador('');
                                        setAbiertoVisitador(true);
                                    }}
                                    className="w-full p-2 rounded-lg border border-blue-200 text-sm outline-none"
                                    autoComplete="off"
                                />

                                {/* Corregido: Se eliminó el apellidoSeleccionado inexistente */}
                                {data.visitador_id && !abiertoVisitador && (
                                    <p className="text-[9px] text-blue-600 mt-1 font-bold italic tracking-tighter">
                                        ID #{data.visitador_id}{nombreSeleccionado ? ` · ${nombreSeleccionado}` : ''}
                                    </p>
                                )}

                                {abiertoVisitador && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-blue-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {resultados.length === 0 ? (
                                            <p className="text-[11px] text-slate-400 px-3 py-2">Sin resultados</p>
                                        ) : (
                                            resultados.map(v => (
                                                <button
                                                    type="button"
                                                    key={v.id}
                                                    onClick={() => seleccionarVisitador(v)}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors"
                                                >
                                                    <span className="font-bold text-slate-700 truncate">
                                                        {v.nombre} {v.apellido}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-black shrink-0">
                                                        #{v.id}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">
                                    Fecha Inicio
                                </label>
                                <input 
                                    type="date" 
                                    value={data.fecha_inicio_relacion} 
                                    onChange={e => setData('fecha_inicio_relacion', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 py-3 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={processing}
                            className="flex-[2] bg-[#3D3FD8] text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                        >
                            {processing ? 'Guardando...' : 'Confirmar Médico'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}