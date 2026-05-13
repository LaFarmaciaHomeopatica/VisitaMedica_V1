import React, { useState, useMemo, useEffect, useRef } from 'react';

export default function VisitaFormModal({
    isOpen, onClose, onSubmit,
    isEditing, data, setData,
    processing, errors,
    visitadores, medicosFiltradosPorVisitador,
    productos = [],
    onFechaProgramadaChange, onMedicoChange,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef(null);

    // Sincronización inicial al abrir el modal o cambiar de registro
    useEffect(() => {
        if (isOpen) {
            if (isEditing && data.muestras) {
                setSearchTerm(data.muestras);
            } else if (!isEditing) {
                setSearchTerm('');
            }
        }
    }, [isOpen, isEditing, data.id]);

    // Manejo de clics fuera para cerrar la lista y sincronizar valor manual
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
                // Si el usuario escribió algo y cerró haciendo clic fuera, lo guardamos en el form
                if (searchTerm !== data.muestras) {
                    setData('muestras', searchTerm);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchTerm, data.muestras, setData]);

    // Filtrado de productos por nombre o código
    const filteredProducts = useMemo(() => {
        const query = searchTerm ? searchTerm.toString().toLowerCase().trim() : '';

        // No mostrar resultados si el campo está vacío o si coincide exactamente con lo ya seleccionado
        if (!query || query.length < 1 || query === data.muestras?.toLowerCase()) {
            return [];
        }

        return productos.filter(p => {
            const nombre = p.nombre ? p.nombre.toLowerCase() : '';
            const codigo = p.codigo ? p.codigo.toLowerCase() : '';
            return nombre.includes(query) || codigo.includes(query);
        }).slice(0, 8);
    }, [searchTerm, productos, data.muestras]);

    // Función de selección definitiva
    const handleSelectProduct = (product) => {
        const selectedValue = `${product.codigo} - ${product.nombre}`;

        // Actualizamos estado visual y estado de Inertia de forma atómica
        setSearchTerm(selectedValue);
        setData('muestras', selectedValue);

        setShowResults(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <form
                onSubmit={onSubmit}
                className="relative bg-white w-full max-w-lg rounded-[30px] shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-slate-100"
            >
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                        {isEditing ? 'Editar Visita' : 'Nueva Visita'}
                    </h3>
                    <div className="h-1 w-12 bg-[#3D3FD8] mt-1 rounded-full" />
                </div>

                <div className="space-y-5">
                    {/* Fila: Visitador y Médico */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Visitador Responsable</label>
                            <select
                                value={data.visitador_id}
                                onChange={e => setData(prev => ({ ...prev, visitador_id: e.target.value, medico_id: '' }))}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all"
                                required
                            >
                                <option value="">SELECCIONAR...</option>
                                {visitadores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Médico / Contacto</label>
                            <select
                                value={data.medico_id}
                                onChange={e => onMedicoChange(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all disabled:opacity-50"
                                required
                                disabled={!data.visitador_id}
                            >
                                <option value="">{data.visitador_id ? 'SELECCIONAR...' : 'ELIJA VISITADOR'}</option>
                                {medicosFiltradosPorVisitador.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Fila: Fechas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Fecha Programada</label>
                            <input
                                type="datetime-local"
                                value={data.fecha_programada}
                                onChange={e => onFechaProgramadaChange(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Fecha de Cierre (Opcional)</label>
                            <input
                                type="datetime-local"
                                value={data.fecha_realizada || ''}
                                onChange={e => setData('fecha_realizada', e.target.value)}
                                className="w-full bg-blue-50/50 border-2 border-blue-100/50 rounded-2xl p-3.5 text-xs font-bold text-blue-700 outline-none"
                            />
                        </div>
                    </div>

                    {/* Fila: Estado y Buscador de Productos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Estado</label>
                            <select
                                value={data.estado}
                                onChange={e => setData('estado', e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all"
                            >
                                <option value="sin programar">SIN PROGRAMAR</option>
                                <option value="programada">PROGRAMADA</option>
                                <option value="efectiva">EFECTIVA</option>
                                <option value="No contactado">NO CONTACTADO</option>
                                <option value="reprogramada">REPROGRAMADA</option>
                                <option value="cancelada">CANCELADA</option>
                            </select>
                        </div>

                        {/* BUSCADOR DE PRODUCTOS (MUESTRAS) */}
                        <div className="relative" ref={wrapperRef}>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Muestras (Producto)</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                                placeholder="Buscar código o nombre..."
                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all"
                            />

                            {showResults && filteredProducts.length > 0 && (
                                <div
                                    className="absolute z-[100] w-full bg-white border-2 border-[#3D3FD8] rounded-2xl shadow-2xl mt-1 max-h-48 overflow-y-auto"
                                    onMouseDown={(e) => e.preventDefault()} // BLOQUEA el cierre del input al clickear la lista
                                >
                                    {filteredProducts.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleSelectProduct(p)}
                                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-50 last:border-none cursor-pointer transition-colors"
                                        >
                                            <div className="flex flex-col pointer-events-none">
                                                <span className="text-[10px] font-black text-[#3D3FD8]">{p.codigo}</span>
                                                <span className="text-[11px] font-bold text-slate-700 uppercase">{p.nombre}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Textareas de detalles y comentarios */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Detalles de la Muestra</label>
                        <textarea
                            value={data.comentario_muestra || ''}
                            onChange={e => setData('comentario_muestra', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold h-20 outline-none focus:bg-white focus:border-[#3D3FD8] transition-all resize-none"
                            placeholder="Lote, cantidad u otro tipo de muestra..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Notas de la Visita</label>
                        <textarea
                            value={data.comentarios || ''}
                            onChange={e => setData('comentarios', e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold h-24 outline-none focus:bg-white focus:border-[#3D3FD8] transition-all resize-none"
                            placeholder="Resumen de la visita..."
                        />
                    </div>
                </div>

                {/* Lista de Errores de Validación */}
                {Object.keys(errors).length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
                        {Object.entries(errors).map(([key, msg]) => (
                            <p key={key} className="text-[9px] text-red-600 font-bold uppercase">• {msg}</p>
                        ))}
                    </div>
                )}

                {/* Botones de Acción */}
                <div className="mt-8 flex flex-col gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-[#3D3FD8] text-white py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                    >
                        {processing ? 'Guardando...' : 'Guardar Visita'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}