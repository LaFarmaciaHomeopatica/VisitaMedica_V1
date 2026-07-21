import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { FaPlus, FaTrash, FaCheck, FaTag } from 'react-icons/fa6';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

function FilaCategoria({ categoria, onSaved }) {
    const [nombre, setNombre] = useState(categoria.nombre);
    const [descripcion, setDescripcion] = useState(categoria.descripcion || '');
    const [valorMinimo, setValorMinimo] = useState(categoria.valor_minimo);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const cambios = nombre !== categoria.nombre
        || descripcion !== (categoria.descripcion || '')
        || Number(valorMinimo) !== Number(categoria.valor_minimo);

    const guardar = () => {
        if (!nombre || valorMinimo === '') return;
        setSaving(true);
        router.put(route('Gcategorias.update', categoria.id), { nombre, descripcion, valor_minimo: valorMinimo }, {
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
                onSaved();
            },
            onError: () => setSaving(false),
        });
    };

    const eliminar = () => {
        if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;
        router.delete(route('Gcategorias.destroy', categoria.id), { preserveScroll: true, onSuccess: onSaved });
    };

    return (
        <tr className="hover:bg-blue-50/20 transition-colors">
            <td className="px-5 py-3 border-r border-slate-50">
                <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-400"
                />
            </td>
            <td className="px-4 py-3 border-r border-slate-50">
                <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-[10px] font-black text-slate-400">$</span>
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={valorMinimo}
                        onChange={e => setValorMinimo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{fmt(valorMinimo)} / mes</p>
            </td>
            <td className="px-4 py-3 border-r border-slate-50">
                <input
                    type="text"
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-400"
                />
            </td>
            <td className="px-4 py-3 border-r border-slate-50 text-center">
                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {categoria.medicos_count ?? 0}
                </span>
            </td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={guardar}
                        disabled={saving || !cambios || !nombre || valorMinimo === ''}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                            saved
                                ? 'bg-emerald-500 text-white'
                                : 'bg-[#3D3FD8] text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400'
                        }`}
                    >
                        {saving ? '...' : saved ? <FaCheck /> : 'Guardar'}
                    </button>
                    <button
                        onClick={eliminar}
                        className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"
                        title="Eliminar categoría"
                    >
                        <FaTrash className="h-3 w-3" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function ModalNuevaCategoria({ onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        descripcion: '',
        valor_minimo: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('Gcategorias.store'), { onSuccess: onClose });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                <h3 className="text-lg font-black text-slate-800 uppercase mb-1">Nueva categoría</h3>
                <p className="text-[10px] text-slate-400 mb-6 uppercase">Umbral mensual de valor comprado + formulado</p>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Nombre</label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            placeholder="Ej: A, B, Premium..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.nombre && <p className="text-[10px] text-rose-500 mt-1">{errors.nombre}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Valor mínimo mensual</label>
                        <input
                            type="number"
                            min="0"
                            step="1000"
                            value={data.valor_minimo}
                            onChange={e => setData('valor_minimo', e.target.value)}
                            placeholder="Ej: 5000000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.valor_minimo && <p className="text-[10px] text-rose-500 mt-1">{errors.valor_minimo}</p>}
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Descripción (opcional)</label>
                        <input
                            type="text"
                            value={data.descripcion}
                            onChange={e => setData('descripcion', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.descripcion && <p className="text-[10px] text-rose-500 mt-1">{errors.descripcion}</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={processing || !data.nombre || data.valor_minimo === ''}
                            className="flex-[2] py-3 bg-[#3D3FD8] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 disabled:bg-slate-200 transition-all">
                            {processing ? 'Guardando...' : 'Agregar categoría'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CategoriasPanel({ categoriasMedicos }) {
    const [showModal, setShowModal] = useState(false);
    const [key, setKey] = useState(0);

    const categoriasOrdenadas = [...categoriasMedicos].sort((a, b) => Number(b.valor_minimo) - Number(a.valor_minimo));

    return (
        <div className="space-y-4">
            {showModal && <ModalNuevaCategoria onClose={() => { setShowModal(false); setKey(k => k + 1); }} />}

            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 max-w-xl">
                    <FaTag className="text-blue-500 text-sm shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
                        Cada mes el sistema calcula la categoría de un médico sumando su valor
                        comprado + formulado en Odoo, y lo ubica en la categoría de mayor
                        umbral que no supere ese total. El cálculo corre automáticamente el
                        día 1 de cada mes (mes anterior ya cerrado).
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-[#3D3FD8] text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-sm"
                >
                    <FaPlus className="h-3 w-3" /> Nueva categoría
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600">
                                <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Nombre</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Valor mínimo mensual</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Descripción</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Médicos</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50" key={key}>
                            {categoriasOrdenadas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        No hay categorías registradas
                                    </td>
                                </tr>
                            ) : categoriasOrdenadas.map(c => (
                                <FilaCategoria
                                    key={c.id}
                                    categoria={c}
                                    onSaved={() => setKey(k => k + 1)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
