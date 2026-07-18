import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import { FaTags, FaGear, FaUserGear, FaMapLocationDot, FaLayerGroup } from 'react-icons/fa6';

import TarifasPanel from './ComponentsC/TarifasPanel';
import OdooConfigPanel from './ComponentsC/OdooConfigPanel';
import UsuariosPanel from './ComponentsC/UsuariosPanel';
import ZonasPanel from './ComponentsC/ZonasPanel';
import CategoriasPanel from './ComponentsC/CategoriasPanel';

const TABS = [
    { key: 'tarifas',    label: 'Tarifas',        icon: <FaTags /> },
    { key: 'odoo',       label: 'Conexión Odoo',  icon: <FaGear /> },
    { key: 'usuarios',   label: 'Usuarios',       icon: <FaUserGear /> },
    { key: 'zonas',      label: 'Zonas',          icon: <FaMapLocationDot /> },
    { key: 'categorias', label: 'Categorías',     icon: <FaLayerGroup /> },
];

function tabInicial() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return TABS.some(t => t.key === tab) ? tab : 'tarifas';
}

export default function Configuracion({ auth, tarifas, categorias, odooConfig, usuarios, roles, zonas, categoriasMedicos }) {
    const [tabActiva, setTabActiva] = useState(tabInicial());

    const cambiarTab = (key) => {
        setTabActiva(key);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', key);
        window.history.replaceState({}, '', url);
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Configuración" />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* ── HEADER ───────────────────────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    {/* ── PESTAÑAS ─────────────────────────────────── */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
                        {TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => cambiarTab(t.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                    tabActiva === t.key
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-8 pt-7">
                    {tabActiva === 'tarifas' && <TarifasPanel tarifas={tarifas} categorias={categorias} />}
                    {tabActiva === 'odoo' && <OdooConfigPanel odooConfig={odooConfig} />}
                    {tabActiva === 'usuarios' && <UsuariosPanel usuarios={usuarios} roles={roles} />}
                    {tabActiva === 'zonas' && <ZonasPanel zonas={zonas} />}
                    {tabActiva === 'categorias' && <CategoriasPanel categoriasMedicos={categoriasMedicos} />}
                </div>
            </div>
        </PanelAdmin>
    );
}
