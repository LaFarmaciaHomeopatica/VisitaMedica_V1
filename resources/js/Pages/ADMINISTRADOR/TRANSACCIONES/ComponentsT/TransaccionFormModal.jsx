import React, { useState, useRef, useEffect } from 'react';
import { FaXmark, FaChevronDown } from 'react-icons/fa6';

function SearchableSelect({ value, onChange, options, placeholder, getKey, getLabel }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = options.find(o => String(getKey(o)) === String(value));

    const filtered = query.trim()
        ? options.filter(o => getLabel(o).toLowerCase().includes(query.toLowerCase()))
        : options;

    // Close on outside click
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
            {/* Trigger */}
            <button
                type="button"
                onClick={handleOpen}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/10 flex items-center justify-between gap-2 text-left"
            >
                <span className={selected ? 'text-slate-800 truncate' : 'text-slate-400'}>
                    {selected ? getLabel(selected) : placeholder}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                    {selected && (
                        <span
                            onClick={handleClear}
                            className="text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                            <FaXmark className="w-3 h-3" />
                        </span>
                    )}
                    <FaChevronDown className={`w-3 h-3 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    {/* Search input */}
                    <div className="px-3 pt-3 pb-2 border-b border-slate-50">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300 placeholder:font-normal"
                        />
                    </div>

                    {/* Options list */}
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
                                        className={`px-4 py-2.5 text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-slate-700 hover:bg-slate-50'
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

export default function TransaccionFormModal({
    isOpen, onClose,
    isEditing, data, setData,
    processing, errors, onSubmit,
    medicos, productos,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">

                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
                        {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <FaXmark className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-8 grid grid-cols-2 gap-6">
                    {/* Médico */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Médico</label>
                        <SearchableSelect
                            value={data.medico_documento}
                            onChange={val => setData('medico_documento', val)}
                            options={medicos}
                            placeholder="Seleccionar Médico"
                            getKey={m => m.documento}
                            getLabel={m => `${m.nombre} ${m.apellido}`}
                        />
                        {errors.medico_documento && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.medico_documento}</p>}
                    </div>

                    {/* Producto */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Producto</label>
                        <SearchableSelect
                            value={data.producto_codigo}
                            onChange={val => setData('producto_codigo', val)}
                            options={productos}
                            placeholder="Seleccionar Producto"
                            getKey={p => p.codigo}
                            getLabel={p => p.nombre}
                        />
                        {errors.producto_codigo && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.producto_codigo}</p>}
                    </div>

                    {/* Unidades compradas */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Unidades Compradas</label>
                        <input
                            type="number"
                            value={data.unidades_compradas}
                            onChange={e => setData('unidades_compradas', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Valor comprado */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Valor Comprado</label>
                        <input
                            type="number"
                            value={data.valor_comprado}
                            onChange={e => setData('valor_comprado', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Unidades formuladas */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Unidades Formuladas</label>
                        <input
                            type="number"
                            value={data.unidades_formuladas}
                            onChange={e => setData('unidades_formuladas', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Valor formulado */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Valor Formulado</label>
                        <input
                            type="number"
                            value={data.valor_formulado}
                            onChange={e => setData('valor_formulado', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Fecha */}
                    <div className="col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Fecha</label>
                        <input
                            type="date"
                            value={data.fecha}
                            onChange={e => setData('fecha', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                        {errors.fecha && <p className="text-rose-500 text-[9px] mt-1 font-bold">{errors.fecha}</p>}
                    </div>

                    {/* Acciones */}
                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-[#3D3FD8] text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                        >
                            {processing ? 'Guardando...' : 'Confirmar Registro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}