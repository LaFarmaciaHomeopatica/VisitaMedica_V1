import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import PanelAdmin from "@/Pages/ADMINISTRADOR/PanelAdmin";
import {
    FaMagnifyingGlass, FaIdCard, FaSpinner, FaChartLine,
} from 'react-icons/fa6';

export default function OdooMedicos({ auth }) {

    const [documento, setDocumento] = useState('');
    const [buscando, setBuscando]   = useState(false);

    const handleBuscar = (e) => {
        e.preventDefault();
        if (!documento.trim()) return;
        setBuscando(true);
        router.get(route('Gmedicos.showPorDocumento', documento.trim()), {}, {
            onFinish: () => setBuscando(false),
        });
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
                            <div className="relative flex-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <FaIdCard className="text-xs" />
                                </span>
                                <input
                                    type="text"
                                    value={documento}
                                    onChange={e => setDocumento(e.target.value)}
                                    placeholder="Ej: 1012345678"
                                    autoFocus
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700"
                                />
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
