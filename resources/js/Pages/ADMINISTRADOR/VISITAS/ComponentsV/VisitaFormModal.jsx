import React, { useState, useMemo, useEffect, useRef } from 'react';

// ─── Componente reutilizable SearchableSelect ───────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder, getKey, getLabel, disabled }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = options.find(o => String(getKey(o)) === String(value));

    const filtered = query.trim()
        ? options.filter(o => getLabel(o).toLowerCase().includes(query.toLowerCase()))
        : options;

    useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleOpen() {
        if (disabled) return;
        setOpen(true);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 0);
    }

    function handleSelect(opt) {
        onChange(getKey(opt));
        setOpen(false);
        setQuery('');
    }

    function handleClear(e) {
        e.stopPropagation();
        onChange('');
        setOpen(false);
        setQuery('');
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold outline-none focus:bg-white focus:border-[#3D3FD8] transition-all flex items-center justify-between gap-2 text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <span className={selected ? 'text-slate-800 truncate' : 'text-slate-400'}>
                    {selected ? getLabel(selected).toUpperCase() : placeholder}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                    {selected && !disabled && (
                        <span
                            onClick={handleClear}
                            className="text-slate-300 hover:text-rose-400 transition-colors"
                        >
                            ✕
                        </span>
                    )}
                    <span className={`text-slate-300 text-[10px] transition-transform inline-block ${open ? 'rotate-180' : ''}`}>▼</span>
                </span>
            </button>

            {open && (
                <div className="absolute z-[200] mt-1 w-full bg-white rounded-2xl shadow-2xl border-2 border-[#3D3FD8] overflow-hidden">
                    <div className="px-3 pt-3 pb-2 border-b border-slate-50">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300 placeholder:font-normal"
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-[10px] text-slate-400 font-bold uppercase text-center">
                                Sin resultados
                            </li>
                        ) : (
                            filtered.map(opt => {
                                const isActive = String(getKey(opt)) === String(value);
                                return (
                                    <li
                                        key={getKey(opt)}
                                        onClick={() => handleSelect(opt)}
                                        className={`px-4 py-2.5 text-xs font-bold uppercase cursor-pointer transition-colors ${
                                            isActive ? 'bg-blue-50 text-[#3D3FD8]' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {getLabel(opt)}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
// ────────────────────────────────────────────────────────────────────────────

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

    useEffect(() => {
        if (isOpen) {
            if (isEditing && data.muestras) {
                setSearchTerm(data.muestras);
            } else if (!isEditing) {
                setSearchTerm('');
            }
        }
    }, [isOpen, isEditing, data.id]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
                if (searchTerm !== data.muestras) {
                    setData('muestras', searchTerm);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchTerm, data.muestras, setData]);

    const filteredProducts = useMemo(() => {
        const query = searchTerm ? searchTerm.toString().toLowerCase().trim() : '';
        if (!query || query.length < 1 || query === data.muestras?.toLowerCase()) return [];
        return productos.filter(p => {
            const nombre = p.nombre ? p.nombre.toLowerCase() : '';
            const codigo = p.codigo ? p.codigo.toLowerCase() : '';
            return nombre.includes(query) || codigo.includes(query);
        }).slice(0, 8);
    }, [searchTerm, productos, data.muestras]);

    const handleSelectProduct = (product) => {
        const selectedValue = `${product.codigo} - ${product.nombre}`;
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
                            <SearchableSelect
                                value={data.visitador_id}
                                onChange={val => setData(prev => ({ ...prev, visitador_id: val, medico_id: '' }))}
                                options={visitadores}
                                placeholder="Seleccionar..."
                                getKey={v => v.id}
                                getLabel={v => v.nombre}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Médico / Contacto</label>
                            <SearchableSelect
                                value={data.medico_id}
                                onChange={val => onMedicoChange(val)}
                                options={medicosFiltradosPorVisitador}
                                placeholder={data.visitador_id ? 'Seleccionar...' : 'Elija visitador'}
                                getKey={m => m.id}
                                getLabel={m => `${m.nombre} ${m.apellido}`}
                                disabled={!data.visitador_id}
                            />
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

                        {/* BUSCADOR DE PRODUCTOS (MUESTRAS) — sin cambios */}
                        <div className="relative" ref={wrapperRef}>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Muestras (Producto)</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                                onFocus={() => setShowResults(true)}
                                placeholder="Buscar código o nombre..."
                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-3.5 text-xs font-bold focus:bg-white focus:border-[#3D3FD8] outline-none transition-all"
                            />
                            {showResults && filteredProducts.length > 0 && (
                                <div
                                    className="absolute z-[100] w-full bg-white border-2 border-[#3D3FD8] rounded-2xl shadow-2xl mt-1 max-h-48 overflow-y-auto"
                                    onMouseDown={(e) => e.preventDefault()}
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

                    {/* Textareas */}
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

                {/* Errores */}
                {Object.keys(errors).length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
                        {Object.entries(errors).map(([key, msg]) => (
                            <p key={key} className="text-[9px] text-red-600 font-bold uppercase">• {msg}</p>
                        ))}
                    </div>
                )}

                {/* Botones */}
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