import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BarraNave from './barranave';
import BarraComparativa, { COLOR_COMPRADO, COLOR_FORMULADO, LeyendaCompradoFormulado } from '@/Components/BarraComparativa';
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaPhoneFlip,
    FaLocationDot,
    FaCalendarCheck,
    FaBoxOpen,
    FaFileInvoiceDollar,
    FaFlask,
    FaStethoscope,
} from 'react-icons/fa6';

// Helpers de formateo
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => {
    n = n ?? 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
    return `$${fmt(n)}`;
};

// KPI Card — glassmorphism coherente con el sistema
function KpiCard({ label, value, icon, gradient }) {
    return (
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] border border-white/40 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${gradient}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate">{label}</p>
                <p className="text-base font-black text-gray-800 leading-tight mt-0.5">{value}</p>
            </div>
        </div>
    );
}

const MedicoDetalle = ({ medico, periodoActivo = 'all', txStats, topProductos = [] }) => {
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [search, setSearch] = useState('');

    if (!medico) return (
        <div className="bg-[#E5F4FF] min-h-screen flex items-center justify-center font-sans">
            <p className="font-black text-[#1C85E8] text-sm uppercase tracking-widest">Cargando...</p>
        </div>
    );

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        router.get('/ListadoMedicos', { search: value }, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    const googleMapsUrl = medico.geolocalizacion
        ? `https://www.google.com/maps/search/?api=1&query=${medico.geolocalizacion}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(medico.direccion_detalles || '')}`;

    return (
        <div className="bg-[#E5F4FF] min-h-screen pb-24 font-sans text-gray-800">
            <Head title={`Perfil - ${medico.nombre} ${medico.apellido}`} />

            {/* ── Header glassmorphism — mismo sistema que panel/ListadoMedicos ── */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20 rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20">
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">

                        <Link
                            href="/ListadoMedicos"
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                        >
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        <div className="hidden md:flex flex-col min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1C85E8]/70 leading-none mb-0.5">
                                LFH Portal
                            </p>
                            <h1 className="text-xs md:text-sm font-black text-[#1C85E8] uppercase tracking-wider whitespace-nowrap">
                                Ficha Médica
                            </h1>
                        </div>

                        {/* Barra de búsqueda — idéntica a panel/ListadoMedicos */}
                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs md:text-sm" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Buscar médico, especialidad..."
                                className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700"
                            />
                        </div>

                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 md:px-6 mt-6 space-y-4">

                {/* ── Hero del médico ── */}
                <section className="bg-gradient-to-br from-[#1C85E8] via-[#02CFE3] to-[#24C765] p-6 rounded-[30px] shadow-lg text-white relative">

                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black border border-white/30 shrink-0">
                            {medico.nombre ? medico.nombre.charAt(0).toUpperCase() : 'M'}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 leading-none mb-0.5">
                                Ficha Médica
                            </p>
                            <h2 className="text-lg font-extrabold text-white leading-tight truncate">
                                {medico.nombre} {medico.apellido}
                            </h2>
                            <span className="inline-block mt-1 text-[9px] font-black uppercase bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
                                {medico.especialidad || 'General'}
                            </span>
                        </div>

                        {/* Botón móvil toggle detalles */}
                        <button
                            onClick={() => setMostrarDetalles(!mostrarDetalles)}
                            className="md:hidden bg-white/20 hover:bg-white/35 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/20 transition-all active:scale-95 shrink-0"
                        >
                            {mostrarDetalles ? 'Cerrar' : 'Info'}
                        </button>
                    </div>

                    {/* Datos detallados — frosted glass dentro del hero */}
                    <div className={`bg-white/90 backdrop-blur-md rounded-[20px] border border-white/50 mt-5 p-5 text-slate-800 ${mostrarDetalles ? 'block' : 'hidden md:block'}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                            {/* Columna 1 */}
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Documento</p>
                                    <p className="text-xs font-bold text-gray-700 mt-0.5">
                                        {(medico.tipo_documento?.nombre || '') + ' ' + (medico.documento || 'N/A')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">ID Registro</p>
                                    <p className="text-xs font-bold text-gray-700 mt-0.5">#{medico.id}</p>
                                </div>
                            </div>

                            {/* Columna 2 */}
                            <div className="space-y-3 sm:border-l sm:pl-5 border-gray-100">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Contacto Directo</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs font-bold text-gray-700">{medico.telefono_contacto || '---'}</p>
                                        {medico.telefono_contacto && (
                                            <a href={`tel:${medico.telefono_contacto}`} className="text-[#24C765] hover:scale-110 transition-transform">
                                                <FaPhoneFlip className="text-[11px]" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Horario de Atención</p>
                                    <p className="text-xs font-bold text-gray-700 mt-0.5">{medico.horario_atencion || 'No definido'}</p>
                                </div>
                            </div>

                            {/* Columna 3 */}
                            <div className="sm:border-l sm:pl-5 border-gray-100 flex flex-col justify-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Dirección de Consultorio</p>
                                <div className="flex items-start gap-2 mt-0.5">
                                    <p className="text-xs font-bold text-gray-700 leading-tight flex-1">
                                        {medico.direccion_detalles || 'Sin dirección registrada'}
                                    </p>
                                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                                        className="text-[#1C85E8] shrink-0 hover:scale-110 transition-transform mt-0.5">
                                        <FaLocationDot className="text-sm" />
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ── Selector de período ── */}
                <div className="flex flex-wrap items-center gap-2 px-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-1">Período:</p>
                    {[
                        { key: 'all', label: 'Todo' },
                        { key: '2y',  label: '2 años' },
                        { key: '1y',  label: '1 año' },
                        { key: '6m',  label: '6 meses' },
                        { key: '3m',  label: '3 meses' },
                    ].map(p => (
                        <button
                            key={p.key}
                            onClick={() => router.get(
                                `/MedicoDetalle/${medico.id}`,
                                p.key !== 'all' ? { periodo: p.key } : {},
                                { preserveScroll: true }
                            )}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border active:scale-95 ${
                                periodoActivo === p.key
                                    ? 'bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] text-white border-transparent shadow-sm shadow-blue-100'
                                    : 'bg-white/80 backdrop-blur-md text-gray-400 border-white/40 hover:text-[#1C85E8] hover:border-[#1C85E8]/30'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="bg-blue-50/80 border border-blue-200 text-blue-700 text-[10px] font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider text-center max-w-md mx-auto">
                    💡 La formulación no está registrada en Odoo (valores en $0)
                </div>

                {/* ── KPIs ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <KpiCard
                        label="Val. Comprado"
                        value={fmtM(txStats?.total_valor_comprado)}
                        icon={<FaFileInvoiceDollar className="text-[#1C85E8] text-lg" />}
                        gradient="bg-[#1C85E8]/10"
                    />
                    <KpiCard
                        label="Val. Formulado"
                        value={fmtM(txStats?.total_valor_formulado)}
                        icon={<FaFileInvoiceDollar className="text-[#02CFE3] text-lg" />}
                        gradient="bg-[#02CFE3]/10"
                    />
                    <KpiCard
                        label="Unidades"
                        value={fmt(txStats?.total_unidades)}
                        icon={<FaBoxOpen className="text-amber-500 text-lg" />}
                        gradient="bg-amber-50"
                    />
                    <KpiCard
                        label="Transacciones"
                        value={fmt(txStats?.total_transacciones)}
                        icon={<FaCalendarCheck className="text-[#24C765] text-lg" />}
                        gradient="bg-[#24C765]/10"
                    />
                </div>

                {/* ── Top Productos ── */}
                <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-white/40 shadow-sm p-6">

                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-[#1C85E8]/10 flex items-center justify-center">
                            <FaFlask className="text-[#1C85E8] text-sm" />
                        </div>
                        <h3 className="text-xs md:text-sm font-black uppercase text-gray-800 tracking-wider">
                            Top Productos
                        </h3>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-4 pl-1">
                        Productos con mayor volumen de compra y formulación
                    </p>

                    {/* Leyenda */}
                    <LeyendaCompradoFormulado className="mb-4 border-b border-gray-100 pb-3" />

                    {topProductos.length === 0 ? (
                        <div className="text-center py-14 bg-blue-50/30 rounded-[20px] border border-dashed border-gray-200 text-gray-400 text-xs italic font-bold uppercase tracking-widest">
                            Sin transacciones registradas en este período
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {topProductos.map((p, i) => {
                                const valorComprado  = Number(p.valor_comprado  ?? 0);
                                const valorFormulado = Number(p.valor_formulado ?? 0);
                                const unidades       = Number(p.unidades        ?? 0);

                                return (
                                    <div
                                        key={i}
                                        className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-[20px] p-4 flex flex-col justify-between hover:shadow-md transition-shadow duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold text-gray-700 truncate">{p.nombre}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">
                                                    {p.codigo} · {fmt(unidades)} uds.
                                                </p>
                                            </div>
                                            <div className="flex gap-2 shrink-0 text-[10px] font-black">
                                                <span style={{ color: COLOR_COMPRADO }}>{fmtM(valorComprado)}</span>
                                                <span style={{ color: COLOR_FORMULADO }}>{fmtM(valorFormulado)}</span>
                                            </div>
                                        </div>

                                        <BarraComparativa comprado={valorComprado} formulado={valorFormulado} height="h-2" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </main>

            <BarraNave />
        </div>
    );
};

export default MedicoDetalle;