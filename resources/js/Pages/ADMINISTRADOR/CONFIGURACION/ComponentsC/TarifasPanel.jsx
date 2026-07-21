import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { FaRotate, FaTrash, FaCheck, FaTriangleExclamation } from 'react-icons/fa6';

const CATEGORIA_NA = 'NA';

// ── selector de categoría con opción "Otra..." ──────────────────────────────
function SelectCategoria({ value, categoriasBase, onChange }) {
    const opciones = Array.from(new Set([...categoriasBase, CATEGORIA_NA]));
    const [modoLibre, setModoLibre] = useState(!opciones.includes(value));

    if (modoLibre) {
        return (
            <div className="flex items-center gap-1">
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="Nombre de categoría"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                    type="button"
                    title="Elegir de la lista"
                    onClick={() => setModoLibre(false)}
                    className="text-[9px] font-black text-blue-500 uppercase px-1"
                >
                    Lista
                </button>
            </div>
        );
    }

    return (
        <select
            value={opciones.includes(value) ? value : ''}
            onChange={e => {
                if (e.target.value === '__otra__') {
                    setModoLibre(true);
                    onChange('');
                } else {
                    onChange(e.target.value);
                }
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-400"
        >
            <option value="" disabled>Seleccionar...</option>
            {opciones.map(c => (
                <option key={c} value={c}>{c}</option>
            ))}
            <option value="__otra__">+ Otra categoría...</option>
        </select>
    );
}

function FilaTarifa({ tarifa, categoriasBase, onSaved }) {
    const [nombre, setNombre] = useState(tarifa.nombre);
    const [categoria, setCategoria] = useState(tarifa.categoria);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const cambios = nombre !== tarifa.nombre || categoria !== tarifa.categoria;

    const guardar = () => {
        if (!categoria) return;
        setSaving(true);
        router.put(route('Gtarifas.update', tarifa.id), { nombre, categoria }, {
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
        if (!confirm(`¿Eliminar la tarifa "${tarifa.nombre}"?`)) return;
        router.delete(route('Gtarifas.destroy', tarifa.id), { preserveScroll: true, onSuccess: onSaved });
    };

    return (
        <tr className="hover:bg-blue-50/20 transition-colors">
            <td className="px-5 py-3 border-r border-slate-50">
                <input
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-400"
                />
            </td>
            <td className="px-4 py-3 border-r border-slate-50">
                <SelectCategoria value={categoria} categoriasBase={categoriasBase} onChange={setCategoria} />
                {categoria === CATEGORIA_NA && (
                    <p className="flex items-center gap-1 text-[8px] font-bold text-amber-500 uppercase mt-1">
                        <FaTriangleExclamation className="h-2.5 w-2.5" /> Sin clasificar
                    </p>
                )}
            </td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={guardar}
                        disabled={saving || !cambios || !categoria}
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
                        title="Eliminar tarifa"
                    >
                        <FaTrash className="h-3 w-3" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function TarifasPanel({ tarifas, categorias }) {
    const [sincronizando, setSincronizando] = useState(false);
    const [key, setKey] = useState(0);

    const sincronizar = () => {
        setSincronizando(true);
        router.post(route('Gtarifas.sincronizar'), {}, {
            preserveScroll: true,
            onFinish: () => { setSincronizando(false); setKey(k => k + 1); },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <button
                    onClick={sincronizar}
                    disabled={sincronizando}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50"
                >
                    <FaRotate className={sincronizando ? 'animate-spin' : ''} />
                    {sincronizando ? 'Sincronizando...' : 'Sincronizar con Odoo'}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600">
                                <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Nombre de la lista de precios</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Categoría</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50" key={key}>
                            {tarifas.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-5 py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        No hay tarifas registradas
                                    </td>
                                </tr>
                            ) : tarifas.map(t => (
                                <FilaTarifa
                                    key={t.id}
                                    tarifa={t}
                                    categoriasBase={categorias}
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
