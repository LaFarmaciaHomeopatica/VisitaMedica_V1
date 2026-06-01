import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    FaArrowLeft,
    FaBoxOpen,
    FaBuilding,
    FaCalendarCheck,
    FaCartShopping,
    FaDollarSign,
    FaFlask,
    FaUserDoctor,
} from 'react-icons/fa6';

import BarraNave from '../barranave';

const formatCOP = (value) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value || 0);

const formatNumber = (value) => new Intl.NumberFormat('es-CO').format(value || 0);

const StatCard = ({ label, value, icon, tone = 'green' }) => {
    const tones = {
        green: 'bg-[#24C765]/10 text-[#24C765]',
        blue: 'bg-[#1C85E8]/10 text-[#1C85E8]',
        violet: 'bg-violet-50 text-violet-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-[22px] border border-white/50 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                <p className="text-sm font-black text-gray-800 truncate">{value}</p>
            </div>
        </div>
    );
};

const LimitInput = ({ value, onChange }) => (
    <div className="flex items-center gap-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
            Mostrar
        </label>
        <input
            type="number"
            min={1}
            value={value}
            onChange={onChange}
            className="w-16 text-center text-sm font-black text-[#24C765] bg-[#24C765]/10 border border-[#24C765]/30 rounded-xl py-1.5 px-2 outline-none focus:ring-2 focus:ring-[#24C765]/40"
        />
    </div>
);

const RankingTable = ({ title, icon, items = [], limit, tone = 'green', valueLabel = 'Valor' }) => {
    const shownItems = items.slice(0, limit || 0);
    const accent = tone === 'violet' ? 'text-violet-600' : 'text-[#24C765]';
    const maxQuantity = Math.max(...shownItems.map(item => Number(item.cantidad || 0)), 1);

    return (
        <section className="bg-white/90 backdrop-blur-md rounded-[24px] border border-white/50 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${accent}`}>
                    {icon}
                    {title}
                </div>
                <span className="text-[10px] font-black text-gray-400">
                    {shownItems.length} registros
                </span>
            </div>

            {shownItems.length === 0 ? (
                <div className="px-4 py-12 text-center text-xs font-bold text-gray-400">
                    Sin datos registrados para este mes.
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {shownItems.map((item, index) => {
                        const width = (Number(item.cantidad || 0) / maxQuantity) * 100;

                        return (
                            <div key={`${item.codigo || item.laboratorio}-${index}`} className="p-4">
                                <div className="grid grid-cols-[32px_1fr_auto] items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-black">
                                        {index + 1}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-800 truncate">
                                            {item.nombre || item.laboratorio || 'Sin dato'}
                                        </p>
                                        <p className="text-[11px] font-bold text-gray-400 truncate mt-0.5">
                                            {item.codigo ? `${item.codigo} - ${item.laboratorio || 'Sin laboratorio'}` : `${item.productos || 0} producto(s)`}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className={`text-sm font-black ${accent}`}>
                                            {formatNumber(item.cantidad)}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400">
                                            {valueLabel}: {formatCOP(item.valor)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${tone === 'violet' ? 'bg-violet-500' : 'bg-[#24C765]'}`}
                                        style={{ width: `${width}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

const DetallesTop = ({
    medico,
    mesActual,
    totales = {},
    productosComprados = [],
    productosFormulados = [],
    laboratoriosComprados = [],
    laboratoriosFormulados = [],
}) => {
    const [limiteComprados, setLimiteComprados] = useState(10);
    const [limiteFormulados, setLimiteFormulados] = useState(10);
    const [limiteLabs, setLimiteLabs] = useState(5);
    const [tabLaboratorio, setTabLaboratorio] = useState('comprados');

    const handleLimit = (setter) => (event) => {
        const value = parseInt(event.target.value, 10);
        if (isNaN(value) || value < 1) return setter('');
        setter(value);
    };

    const labsActivos = useMemo(() => (
        tabLaboratorio === 'comprados' ? laboratoriosComprados : laboratoriosFormulados
    ), [tabLaboratorio, laboratoriosComprados, laboratoriosFormulados]);

    return (
        <div className="bg-[#E5F4FF] min-h-screen pb-24 font-sans text-gray-800">
            <Head title={`Detalle Top - ${medico?.nombre || 'Medico'}`} />

            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20">
                <div className="max-w-6xl mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/panel"
                            className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm"
                        >
                            <FaArrowLeft size={14} />
                        </Link>

                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#24C765]">
                                Detalle Top Medico
                            </p>
                            <h1 className="text-base md:text-xl font-black text-gray-800 truncate">
                                {medico?.nombre}
                            </h1>
                            <p className="text-xs font-bold text-gray-400 truncate">
                                {medico?.especialidad || 'General'} - Doc: {medico?.documento} - {mesActual}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-6 mt-6 space-y-4">
                <section className="bg-gradient-to-br from-[#1C85E8] via-[#02CFE3] to-[#24C765] rounded-[28px] p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                            <FaUserDoctor size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                                Analisis mensual
                            </p>
                            <h2 className="text-lg md:text-2xl font-black truncate">{medico?.nombre}</h2>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                        label="Comprado"
                        value={formatCOP(totales.total_comprado)}
                        icon={<FaDollarSign size={18} />}
                        tone="green"
                    />
                    <StatCard
                        label="Formulado"
                        value={formatCOP(totales.total_formulado)}
                        icon={<FaFlask size={18} />}
                        tone="violet"
                    />
                    <StatCard
                        label="Unid. compradas"
                        value={formatNumber(totales.unidades_compradas)}
                        icon={<FaBoxOpen size={18} />}
                        tone="blue"
                    />
                    <StatCard
                        label="Transacciones"
                        value={formatNumber(totales.transacciones)}
                        icon={<FaCalendarCheck size={18} />}
                        tone="amber"
                    />
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 px-1">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                                Productos comprados
                            </h3>
                            <LimitInput value={limiteComprados} onChange={handleLimit(setLimiteComprados)} />
                        </div>
                        <RankingTable
                            title="Top comprados"
                            icon={<FaCartShopping size={13} />}
                            items={productosComprados}
                            limit={limiteComprados}
                            tone="green"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 px-1">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                                Productos formulados
                            </h3>
                            <LimitInput value={limiteFormulados} onChange={handleLimit(setLimiteFormulados)} />
                        </div>
                        <RankingTable
                            title="Top formulados"
                            icon={<FaFlask size={13} />}
                            items={productosFormulados}
                            limit={limiteFormulados}
                            tone="violet"
                        />
                    </div>
                </section>

                <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                                Laboratorios
                            </h3>
                            <div className="flex items-center gap-1 bg-white/80 rounded-xl p-1 border border-white/60">
                                <button
                                    type="button"
                                    onClick={() => setTabLaboratorio('comprados')}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black ${tabLaboratorio === 'comprados' ? 'bg-[#24C765] text-white' : 'text-gray-400'}`}
                                >
                                    Comprados
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTabLaboratorio('formulados')}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-black ${tabLaboratorio === 'formulados' ? 'bg-violet-500 text-white' : 'text-gray-400'}`}
                                >
                                    Formulados
                                </button>
                            </div>
                        </div>

                        <LimitInput value={limiteLabs} onChange={handleLimit(setLimiteLabs)} />
                    </div>

                    <RankingTable
                        title={tabLaboratorio === 'comprados' ? 'Laboratorios comprados' : 'Laboratorios formulados'}
                        icon={<FaBuilding size={13} />}
                        items={labsActivos}
                        limit={limiteLabs}
                        tone={tabLaboratorio === 'comprados' ? 'green' : 'violet'}
                    />
                </section>
            </main>

            <BarraNave />
        </div>
    );
};

export default DetallesTop;
