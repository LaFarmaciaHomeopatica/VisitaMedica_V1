import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import PanelAdmin from "@/Pages/ADMINISTRADOR/PanelAdmin";
import {
    FaMagnifyingGlass, FaIdCard, FaSpinner, FaChartLine,
} from 'react-icons/fa6';

export default function OdooMedicos({ auth }) {

    const [documento, setDocumento] = useState('');
    const [buscando, setBuscando]   = useState(false);
    const [sugerencias, setSugerencias] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [indiceActivo, setIndiceActivo] = useState(-1);
    const contenedorRef = useRef(null);

    // Autocompletado por nombre o documento — mismo campo, sugerencias
    // conforme se escribe (debounced, consulta la tabla local de médicos).
    useEffect(() => {
        const termino = documento.trim();
        if (termino.length < 2) {
            setSugerencias([]);
            return;
        }

        const timer = setTimeout(() => {
            axios.get(route('odoo.medicos.buscar'), { params: { q: termino } })
                .then(res => {
                    setSugerencias(res.data ?? []);
                    setIndiceActivo(-1);
                })
                .catch(() => setSugerencias([]));
        }, 250);

        return () => clearTimeout(timer);
    }, [documento]);

    useEffect(() => {
        const handler = e => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
                setMostrarSugerencias(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const irAlPanel = (doc) => {
        if (!doc.trim()) return;
        setBuscando(true);
        setMostrarSugerencias(false);
        router.get(route('Gmedicos.showPorDocumento', doc.trim()), {}, {
            onFinish: () => setBuscando(false),
        });
    };

    const handleBuscar = (e) => {
        e.preventDefault();
        if (indiceActivo >= 0 && sugerencias[indiceActivo]) {
            irAlPanel(String(sugerencias[indiceActivo].documento));
        } else {
            irAlPanel(documento);
        }
    };

    const handleKeyDown = (e) => {
        if (!mostrarSugerencias || sugerencias.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIndiceActivo(i => Math.min(i + 1, sugerencias.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndiceActivo(i => Math.max(i - 1, -1));
        } else if (e.key === 'Escape') {
            setMostrarSugerencias(false);
        }
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Consulta de Clientes · Odoo" />

            <div className="w-full min-h-screen bg-white pb-12">

                {/* CONTENIDO */}
                <div className="px-8 pt-7">
                    <div className="max-w-xl mx-auto text-center pt-12">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
                            <FaChartLine className="text-blue-500 text-2xl" />
                        </div>
                        <h2 className="text-[15px] font-black text-slate-800 uppercase mb-2">
                            Panel gerencial por cliente
                        </h2>
                        <p className="text-[11px] text-slate-400 mb-8">
                            Funciona con cualquier número de documento — esté o no registrado
                            localmente como médico. Te lleva directo al panel con KPIs, tendencia
                            de compras/formulación, categoría, visitas y transacciones.
                        </p>

                        <form onSubmit={handleBuscar} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <div ref={contenedorRef} className="relative flex-1 text-left">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 z-10">
                                    <FaIdCard className="text-xs" />
                                </span>
                                <input
                                    type="text"
                                    value={documento}
                                    onChange={e => { setDocumento(e.target.value); setMostrarSugerencias(true); }}
                                    onFocus={() => setMostrarSugerencias(true)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Nombre o documento..."
                                    autoFocus
                                    autoComplete="off"
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700"
                                />

                                {mostrarSugerencias && sugerencias.length > 0 && (
                                    <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                                        {sugerencias.map((m, idx) => (
                                            <li key={m.documento}
                                                onMouseDown={() => irAlPanel(String(m.documento))}
                                                className={`px-4 py-2 cursor-pointer transition ${idx === indiceActivo ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                                <p className="text-[11px] font-black text-slate-700 uppercase">{m.nombre}</p>
                                                <p className="text-[9px] text-slate-400">
                                                    {m.documento}
                                                    {!m.registrado && <span className="ml-1.5 text-amber-500 font-black">· no registrado</span>}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <button type="submit" disabled={buscando || !documento.trim()}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm transition-colors">
                                {buscando
                                    ? <><FaSpinner className="animate-spin text-[10px]" /> Abriendo panel...</>
                                    : <><FaMagnifyingGlass className="text-[10px]" /> Ver panel</>
                                }
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </PanelAdmin>
    );
}
