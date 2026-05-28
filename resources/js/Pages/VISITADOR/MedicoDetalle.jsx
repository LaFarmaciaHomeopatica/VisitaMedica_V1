import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BarraNave from './barranave';
// Importamos los iconos necesarios
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaPhoneFlip,
    FaLocationDot,
    FaCalendarCheck,
    FaBoxOpen,
    FaFileInvoiceDollar,
    FaFlask,
} from 'react-icons/fa6';

// Helpers de formateo
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
const fmtM = n => {
    n = n ?? 0;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
    return `$${fmt(n)}`;
};

// Subcomponente de KPI Card
function KpiCard({ label, value, icon, accent }) {
    return (
        <div 
            className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4 flex items-center gap-3.5 hover:shadow-md transition-shadow"
            style={{ borderTop: `4px solid ${accent}` }}
        >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
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

    if (!medico) return <div className="p-10 text-center font-bold text-[#5D8BF4]">Cargando...</div>;

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
        <div className="bg-[#F4F7FF] min-h-screen pb-20 font-sans text-gray-800">
            <Head title={`Perfil - ${medico.nombre} ${medico.apellido}`} />

            {/* Header Adaptado con estilo de ListadoMedicos pero tamaño compacto */}
            <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px] md:rounded-b-[35px]">
                <div className="max-w-[1440px] mx-auto p-3 md:p-4">
                    <div className="flex items-center gap-3 md:gap-6">

                        {/* Botón Regresar - Estilo ListadoMedicos (Azul suave) */}
                        <Link
                            href="/ListadoMedicos"
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors shrink-0 shadow-sm"
                        >
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        {/* Título - Estilo ListadoMedicos */}
                        <h1 className="hidden sm:block text-[10px] md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
                            Ficha Médica
                        </h1>

                        {/* Barra de Búsqueda - Estilo ListadoMedicos */}
                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-[10px] md:text-xs" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Buscar medicina, médicos..."
                                className="w-full bg-blue-50 border-none rounded-full py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner"
                            />
                        </div>

                    </div>
                </div>
            </header>

            <main className="px-3 md:px-6 mt-3">
                <div className="max-w-6xl mx-auto w-full">
                    <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">

                        {/* SECCIÓN IZQUIERDA: Avatar e Info Básica */}
                        <div className="w-full md:w-[22%] p-4 flex flex-col items-center justify-center bg-gray-50/30 border-b md:border-b-0 md:border-r border-gray-100">
                            <div className="w-16 h-16 rounded-full bg-[#5D8BF4] flex items-center justify-center text-white text-2xl font-black mb-2 shadow-sm">
                                {medico.nombre ? medico.nombre.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <h2 className="text-sm font-bold text-gray-800 text-center leading-tight">
                                {medico.nombre + ' ' + medico.apellido}
                            </h2>
                            <p className="mt-1 text-[#5D8BF4] text-[9px] font-bold uppercase bg-blue-50 px-3 py-0.5 rounded-full">
                                {medico.especialidad}
                            </p>

                            <button
                                onClick={() => setMostrarDetalles(!mostrarDetalles)}
                                className="mt-3 flex items-center gap-2 md:hidden bg-[#5D8BF4] text-white px-4 py-1.5 rounded-xl text-[10px] font-bold"
                            >
                                {mostrarDetalles ? 'Cerrar' : 'Info'}
                            </button>
                        </div>

                        {/* SECCIÓN DERECHA: Datos Detallados */}
                        <div className={`w-full md:w-[78%] p-5 md:flex items-center ${mostrarDetalles ? 'block' : 'hidden md:flex'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">

                                {/* Columna 1 */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Documento</p>
                                        <p className="text-xs font-semibold text-gray-700">{medico.tipo_documento?.nombre + ' ' + medico.documento || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ID Registro</p>
                                        <p className="text-xs font-semibold text-gray-700">#{medico.id}</p>
                                    </div>
                                </div>

                                {/* Columna 2 */}
                                <div className="space-y-3 border-l-0 lg:border-l lg:pl-6 border-gray-50">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Contacto Directo</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-semibold text-gray-800">{medico.telefono_contacto || '---'}</p>
                                            {medico.telefono_contacto && (
                                                <a href={`tel:${medico.telefono_contacto}`} className="text-green-500 hover:scale-110 transition-transform">
                                                    <FaPhoneFlip className="text-[10px]" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Horario de Atención</p>
                                        <p className="text-xs font-semibold text-gray-700">{medico.horario_atencion || 'No definido'}</p>
                                    </div>
                                </div>

                                {/* Columna 3 */}
                                <div className="border-l-0 lg:border-l lg:pl-6 border-gray-50 flex flex-col justify-center">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Dirección de Consultorio</p>
                                    <div className="flex items-start gap-2">
                                        <p className="text-xs font-semibold text-gray-700 leading-tight">
                                            {medico.direccion_detalles || 'Sin dirección registrada'}
                                        </p>
                                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#5D8BF4] shrink-0 hover:scale-110 transition-transform">
                                            <FaLocationDot className="text-[11px]" />
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section>

                    {/* ── SELECTOR DE PERÍODO ─────────────────────────── */}
                    <div className="flex flex-wrap items-center gap-2 mt-6 mb-4 px-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-2">Período:</p>
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
                                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                                    periodoActivo === p.key
                                        ? 'bg-[#5D8BF4] text-white border-[#5D8BF4] shadow-sm shadow-blue-100'
                                        : 'bg-white text-gray-400 border-gray-100 hover:text-gray-600 hover:border-gray-200'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* ── KPIs FINANCIEROS Y TRANSACCIONALES ────────────── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                        <KpiCard 
                            label="Val. Comprado" 
                            value={fmtM(txStats?.total_valor_comprado)} 
                            icon={<FaFileInvoiceDollar className="text-[#5D8BF4] text-lg" />}
                            accent="#5D8BF4" 
                        />
                        <KpiCard 
                            label="Val. Formulado" 
                            value={fmtM(txStats?.total_valor_formulado)} 
                            icon={<FaFileInvoiceDollar className="text-purple-500 text-lg" />}
                            accent="#8b5cf6" 
                        />
                        <KpiCard 
                            label="Unidades" 
                            value={fmt(txStats?.total_unidades)} 
                            icon={<FaBoxOpen className="text-amber-500 text-lg" />}
                            accent="#f59e0b" 
                        />
                        <KpiCard 
                            label="Transacciones" 
                            value={fmt(txStats?.total_transacciones)} 
                            icon={<FaCalendarCheck className="text-emerald-500 text-lg" />}
                            accent="#10b981" 
                        />
                    </div>

                    {/* ── TOP PRODUCTOS DE INTERÉS ─────────────────────── */}
                    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 mt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FaFlask className="text-[#5D8BF4] text-base" />
                            <h3 className="text-xs md:text-sm font-black uppercase text-gray-800 tracking-wider">Top Productos</h3>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-4">
                            Productos con mayor volumen de compra y formulación por el médico
                        </p>
                        
                        <div className="flex gap-4 mb-4 border-b border-gray-50 pb-2">
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase">
                                <span className="w-2 h-2 rounded bg-blue-500 inline-block" /> Comprado
                            </span>
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-purple-500 uppercase">
                                <span className="w-2 h-2 rounded bg-purple-500 inline-block" /> Formulado
                            </span>
                        </div>

                        {topProductos.length === 0 ? (
                            <div className="text-center py-12 text-gray-300 font-bold text-xs uppercase tracking-widest border border-dashed border-gray-100 rounded-[20px]">
                                Sin transacciones registradas en este período
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {topProductos.map((p, i) => {
                                    const maxC = Math.max(...topProductos.map(x => Number(x.valor_comprado)), 1);
                                    const maxF = Math.max(...topProductos.map(x => Number(x.valor_formulado)), 1);
                                    const valorComprado = Number(p.valor_comprado ?? 0);
                                    const valorFormulado = Number(p.valor_formulado ?? 0);
                                    const unidades = Number(p.unidades ?? 0);
                                    
                                    return (
                                        <div key={i} className="bg-gray-50/20 border border-gray-50 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-gray-700 truncate">{p.nombre}</p>
                                                    <p className="text-[9px] text-gray-400 font-semibold uppercase">{p.codigo} · {unidades} uds.</p>
                                                </div>
                                                <div className="flex gap-2 shrink-0 text-[10px] font-black">
                                                    <span className="text-blue-500">{fmtM(valorComprado)}</span>
                                                    <span className="text-purple-500">{fmtM(valorFormulado)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1 mt-2">
                                                {/* Barra comprado */}
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full bg-blue-500 shadow-inner transition-all duration-500"
                                                        style={{ width: `${(valorComprado / maxC) * 100}%` }} 
                                                    />
                                                </div>
                                                {/* Barra formulado */}
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full bg-purple-500 shadow-inner transition-all duration-500"
                                                        style={{ width: `${(valorFormulado / maxF) * 100}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <BarraNave />
        </div>
    );
};

export default MedicoDetalle;