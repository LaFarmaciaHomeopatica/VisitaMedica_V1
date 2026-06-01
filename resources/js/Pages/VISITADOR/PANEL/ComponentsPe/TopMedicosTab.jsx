import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@inertiajs/react';
import {
    FaBuilding,
    FaCartShopping,
    FaChevronRight,
    FaCircleInfo,
    FaCrown,
    FaDollarSign,
    FaFlask,
    FaXmark,
} from 'react-icons/fa6';

const colorPuesto = (index) => {
    if (index === 0) return 'bg-amber-400/20 text-amber-600 border border-amber-400/30';
    if (index === 1) return 'bg-slate-300/30 text-slate-600';
    if (index === 2) return 'bg-orange-300/20 text-orange-700';
    return 'bg-gray-100 text-gray-500';
};

const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

const datoSeguro = (valor, fallback = 'Sin dato') => valor || fallback;

const StatPill = ({ icon, value, label, tone = 'green' }) => {
    const tones = {
        green: 'bg-[#24C765]/10 text-[#24C765] border-[#24C765]/20',
        violet: 'bg-violet-50 text-violet-600 border-violet-200',
    };

    return (
        <div className={`${tones[tone]} px-2.5 py-1 rounded-xl border flex items-center gap-1 font-black text-[11px]`}>
            {icon}
            {value}
            <span className="font-medium text-[9px] opacity-70">{label}</span>
        </div>
    );
};

const DetailBlock = ({ type, title, productName, productCode, laboratory, quantity }) => {
    const isFormula = type === 'formula';
    const tone = isFormula
        ? 'bg-violet-50 border-violet-200 text-violet-700'
        : 'bg-sky-50 border-sky-200 text-sky-700';

    return (
        <div className={`rounded-2xl border p-3 ${tone}`}>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                {isFormula ? <FaFlask size={12} /> : <FaCartShopping size={12} />}
                {title}
            </div>

            <h4 className="mt-2 text-sm font-black text-gray-800 leading-snug">
                {datoSeguro(productName)}
            </h4>

            <div className="mt-3 divide-y divide-white/70 rounded-xl bg-white/65 border border-white overflow-hidden text-[11px]">
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-gray-400 font-bold uppercase">Codigo</span>
                    <span className="font-black text-gray-700 text-right">{datoSeguro(productCode)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-gray-400 font-bold uppercase">Unidades</span>
                    <span className="font-black text-gray-700 text-right">{quantity ?? 0}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-gray-400 font-bold uppercase">Laboratorio</span>
                    <span className="font-black text-gray-700 text-right truncate max-w-[55%]">{datoSeguro(laboratory)}</span>
                </div>
            </div>
        </div>
    );
};

const LabBlock = ({ type, title, laboratory, quantity, products }) => {
    const isFormula = type === 'formula';
    const tone = isFormula
        ? 'bg-violet-500 text-white border-violet-400'
        : 'bg-[#24C765] text-white border-[#24C765]';

    return (
        <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider opacity-90">
                        <FaBuilding size={12} />
                        {title}
                    </div>
                    <p className="mt-1 text-sm font-black leading-tight truncate">{datoSeguro(laboratory)}</p>
                </div>
                <p className="text-right text-[11px] font-bold opacity-90 shrink-0">
                    <span className="block text-sm font-black">{quantity ?? 0}</span>
                    {products ?? 0} prod.
                </p>
            </div>
        </div>
    );
};

const TopMedicoModal = ({ medicoTop, medicoLocal, onClose }) => {
    if (!medicoTop) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 flex items-end sm:items-center justify-center bg-gray-950/45 px-3 py-4"
            style={{ zIndex: 9999 }}
        >
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white shadow-2xl border border-white">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-[#24C765] uppercase tracking-widest">
                            Detalle del medico
                        </p>
                        <h3 className="mt-1 text-base font-black text-gray-800 leading-tight truncate">
                            {medicoTop.nombre}
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold">
                            {medicoTop.especialidad || 'General'} - Doc: {medicoTop.documento}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center shrink-0"
                        aria-label="Cerrar detalle"
                    >
                        <FaXmark size={16} />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <StatPill
                            icon={<FaDollarSign size={10} />}
                            value={formatCOP(medicoTop.total_comprado)}
                            label="compra"
                        />
                        <StatPill
                            icon={<FaFlask size={10} />}
                            value={formatCOP(medicoTop.total_formulado)}
                            label="formula"
                            tone="violet"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <DetailBlock
                            title="Producto mas comprado"
                            type="compra"
                            productName={medicoTop.producto_mas_comprado}
                            productCode={medicoTop.producto_mas_comprado_codigo}
                            laboratory={medicoTop.producto_mas_comprado_laboratorio}
                            quantity={medicoTop.cantidad_mas_comprado}
                        />
                        <DetailBlock
                            title="Producto mas formulado"
                            type="formula"
                            productName={medicoTop.producto_mas_formulado}
                            productCode={medicoTop.producto_mas_formulado_codigo}
                            laboratory={medicoTop.producto_mas_formulado_laboratorio}
                            quantity={medicoTop.cantidad_mas_formulado}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <LabBlock
                            title="Laboratorio mas comprado"
                            type="compra"
                            laboratory={medicoTop.laboratorio_mas_comprado}
                            quantity={medicoTop.cantidad_laboratorio_mas_comprado}
                            products={medicoTop.productos_laboratorio_mas_comprado}
                        />
                        <LabBlock
                            title="Laboratorio mas formulado"
                            type="formula"
                            laboratory={medicoTop.laboratorio_mas_formulado}
                            quantity={medicoTop.cantidad_laboratorio_mas_formulado}
                            products={medicoTop.productos_laboratorio_mas_formulado}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Link
                            href={`/TopMedicosDetalle/${medicoTop.documento}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs text-white font-black hover:bg-gray-800"
                        >
                            Ver detalle top <FaChevronRight size={9} />
                        </Link>

                        {medicoLocal && (
                            <Link
                                href={`/MedicoDetalle/${medicoLocal.id}`}
                                className="inline-flex items-center gap-2 px-2 py-2 text-xs text-[#1C85E8] hover:underline font-black"
                            >
                                Historial completo <FaChevronRight size={9} />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const TopMedicosTab = ({ topMedicos = [], medicos = [] }) => {
    const [limite, setLimite] = useState(5);
    const [filtro, setFiltro] = useState('compra');
    const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);

    const handleLimite = (e) => {
        const valor = parseInt(e.target.value, 10);
        if (isNaN(valor) || valor < 1) return setLimite('');
        setLimite(valor);
    };

    const listaMostrada = useMemo(() => {
        const sorted = [...topMedicos].sort((a, b) => {
            if (filtro === 'compra') return (b.total_comprado || 0) - (a.total_comprado || 0);
            return (b.total_formulado || 0) - (a.total_formulado || 0);
        });
        return sorted.slice(0, limite || 0);
    }, [topMedicos, filtro, limite]);

    const medicoLocalModal = medicoSeleccionado
        ? medicos.find(m => m.documento === medicoSeleccionado.documento)
        : null;

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 mb-3">
                <h3 className="text-xs font-black text-[#24C765] uppercase tracking-widest">
                    Top {limite || '?'} Medicos
                </h3>

                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Mostrar
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={topMedicos.length}
                        value={limite}
                        onChange={handleLimite}
                        className="w-14 text-center text-sm font-black text-[#24C765] bg-[#24C765]/10 border border-[#24C765]/30 rounded-xl py-1.5 px-2 outline-none focus:ring-2 focus:ring-[#24C765]/40 transition-all"
                    />
                </div>
            </div>

            <div className="flex gap-2 mb-4 px-1">
                <button
                    type="button"
                    onClick={() => setFiltro('compra')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all duration-200
                        ${filtro === 'compra'
                            ? 'bg-[#24C765] text-white border-[#24C765] shadow-md shadow-[#24C765]/30'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#24C765]/40 hover:text-[#24C765]'
                        }`}
                >
                    <FaCartShopping size={10} />
                    Mayor Compra
                </button>

                <button
                    type="button"
                    onClick={() => setFiltro('formula')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all duration-200
                        ${filtro === 'formula'
                            ? 'bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-400/30'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-violet-400/40 hover:text-violet-500'
                        }`}
                >
                    <FaFlask size={10} />
                    Mayor Formulacion
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {listaMostrada.map((medicoTop, index) => {
                    const medicoLocal = medicos.find(m => m.documento === medicoTop.documento);

                    return (
                        <div
                            key={medicoTop.documento}
                            role="button"
                            tabIndex={0}
                            onClick={() => setMedicoSeleccionado(medicoTop)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setMedicoSeleccionado(medicoTop);
                                }
                            }}
                            className="bg-white/90 backdrop-blur-md px-3.5 py-3 rounded-[22px] shadow-md border-2 border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#24C765]/40"
                        >
                            <div className="flex gap-3 items-center">
                                <div className={`w-10 h-10 flex flex-col items-center justify-center rounded-2xl shrink-0 font-black text-xs ${colorPuesto(index)}`}>
                                    {index === 0 && <FaCrown size={13} className="mb-0.5" />}
                                    #{index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                                        {medicoTop.nombre}
                                    </h4>
                                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-tight mt-0.5">
                                        {medicoTop.especialidad || 'General'}
                                    </p>
                                    <p className="text-[10px] text-gray-300 mt-0.5">
                                        Doc: {medicoTop.documento}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <StatPill
                                        icon={<FaDollarSign size={9} />}
                                        value={formatCOP(medicoTop.total_comprado)}
                                        label="compra"
                                    />

                                    <StatPill
                                        icon={<FaFlask size={9} />}
                                        value={formatCOP(medicoTop.total_formulado)}
                                        label="formula"
                                        tone="violet"
                                    />

                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setMedicoSeleccionado(medicoTop);
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                                    >
                                        <FaCircleInfo size={10} />
                                        Detalles
                                    </button>

                                    <Link
                                        href={`/TopMedicosDetalle/${medicoTop.documento}`}
                                        onClick={(event) => event.stopPropagation()}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-[#24C765] text-white hover:bg-[#1fae58] transition-colors"
                                    >
                                        Top <FaChevronRight size={7} />
                                    </Link>

                                    {medicoLocal && (
                                        <Link
                                            href={`/MedicoDetalle/${medicoLocal.id}`}
                                            onClick={(event) => event.stopPropagation()}
                                            className="text-[10px] text-[#1C85E8] hover:underline font-bold tracking-tight px-1 flex items-center gap-0.5"
                                        >
                                            Historial <FaChevronRight size={7} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {topMedicos.length === 0 && (
                <div className="text-center py-16 bg-white/50 rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                    Sin datos de transacciones registrados este mes.
                </div>
            )}

            <TopMedicoModal
                medicoTop={medicoSeleccionado}
                medicoLocal={medicoLocalModal}
                onClose={() => setMedicoSeleccionado(null)}
            />
        </>
    );
};

export default TopMedicosTab;
