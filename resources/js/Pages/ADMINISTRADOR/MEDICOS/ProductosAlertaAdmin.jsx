import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import { 
    FaArrowLeft, FaMagnifyingGlass, FaFileMedical, 
    FaArrowUp, FaArrowDown, FaMinus, FaCrown, 
    FaPhone, FaClock, FaLocationDot, FaCalendarDays, FaSpinner
} from 'react-icons/fa6';



const fmt = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));

function RendimientoBadge({ tendencia, diferencia }) {
    const isUp = tendencia === 'subio';
    const isDown = tendencia === 'bajo';
    let color = '#94a3b8';
    let Icon = FaMinus;
    let labelDiferencia = diferencia;

    if (isUp) {
        color = '#10b981';
        Icon = FaArrowUp;
        labelDiferencia = `+${diferencia}`;
    } else if (isDown) {
        color = '#ef4444';
        Icon = FaArrowDown;
    }

    return (
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border"
              style={{ color, background: `${color}12`, borderColor: `${color}30` }}>
            <Icon className="text-[7px]" />
            {labelDiferencia}
        </span>
    );
}

export default function ProductosAlertaAdmin({ 
    auth, 
    medico = {}, 
    productosAlertas = [], 
    mesActualLabel = '',
    mesSeleccionadoLabel = '',
    mesQuery = '',
    puestoReal = null,
    documentoBase, // <-- NUEVO
})  {
    const [search, setSearch] = useState('');
    const [cargandoMes, setCargandoMes] = useState(false);

    const productosFiltrados = productosAlertas.filter(prod => 
        (prod.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
        (prod.laboratorio || '').toLowerCase().includes(search.toLowerCase()) ||
        (prod.codigo || '').includes(search)
    );

  const handleMesChange = (e) => {
    const nuevoMes = e.target.value;
    if (!nuevoMes) return;

    setCargandoMes(true);
    router.get(
        route('Gmedicos.alertasPorDocumento', documentoBase ?? medico.documento),
        { mes: nuevoMes },
        { preserveState: true, replace: true, onFinish: () => setCargandoMes(false) }
    );
};

    const geoCoords = (() => {
        if (!medico?.geolocalizacion) return null;
        const [lat, lng] = medico.geolocalizacion.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    })();

    return (
        <PanelAdmin user={auth?.user}>
            <Head title={`Alertas Críticas · ${medico?.nombre || 'Médico'}`} />

            {/* ── OVERLAY: carga al cambiar el mes de comparación ── */}
            {cargandoMes && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-3">
                        <FaSpinner className="text-3xl text-blue-500 animate-spin" />
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                            Actualizando comparativa…
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full min-h-screen bg-white pb-12">

                {/* ── HEADER ADMINISTRATIVO ──────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <Link href={route('Gmedicos.showPorDocumento', documentoBase ?? medico?.documento)}
      className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition mb-3">
    <FaArrowLeft className="text-[8px]" /> Volver al Perfil del Médico
</Link>
                    
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-0.5 rounded inline-block mb-1">
                                Panel de Alertas 
                            </p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase">
                                {medico?.nombre} {medico?.apellido}
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {medico?.tipo_documento?.nombre ?? 'Doc.'}: {medico?.documento || '—'}
                                {medico?.especialidad && (
                                    <span className="ml-2 text-blue-500 font-bold uppercase">· {medico.especialidad}</span>
                                )}
                            </p>
                        </div>

                        {/* CONTENEDOR DEL SELECTOR Y ETIQUETA DE PERÍODO */}
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            {/* Selector interactivo de Mes Histórico */}
                            <div className="relative flex items-center bg-[#F8FAFC] border border-slate-200 rounded-full px-3 py-1 shadow-sm hover:border-blue-400 transition-colors">
                                <FaCalendarDays className="text-blue-500 text-[10px] mr-2" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Comparar contra:</span>
                                <input
                                    type="month"
                                    value={mesQuery}
                                    onChange={handleMesChange}
                                    className="bg-transparent border-none text-[10px] font-black text-slate-700 uppercase outline-none cursor-pointer focus:ring-0 p-0 tracking-tight"
                                    style={{ colorScheme: 'light' }}
                                />
                            </div>

                            {/* Indicador de visualización actual de la comparativa */}
                            <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-3 py-2 rounded-full border border-blue-200 uppercase tracking-wider">
                                Evolución: {mesSeleccionadoLabel} ➔ {mesActualLabel}
                            </span>

                           
                        </div>
                    </div>

                    {/* Fila de Contacto Directo */}
                    {(medico?.telefono_contacto || medico?.horario_atencion || medico?.direccion_detalles || geoCoords) && (
                        <div className="flex flex-wrap gap-5 mt-3 pt-3 border-t border-slate-50">
                            {medico?.telefono_contacto && (
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                    <FaPhone className="text-blue-400" /> {medico.telefono_contacto}
                                </div>
                            )}
                            {medico?.horario_atencion && (
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                    <FaClock className="text-amber-400" /> {medico.horario_atencion}
                                </div>
                            )}
                            {medico?.direccion_detalles && (
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                    <FaLocationDot className="text-rose-400" /> {medico.direccion_detalles}
                                </div>
                            )}
                            {geoCoords && (
                                <a href={`https://www.google.com/maps/search/?api=1&query=${geoCoords.lat},${geoCoords.lng}`}
                                   target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-1.5 text-[9px] text-blue-500 hover:text-blue-700 font-bold transition">
                                    <FaLocationDot className="text-blue-400" />
                                    {geoCoords.lat.toFixed(5)}, {geoCoords.lng.toFixed(5)}
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* ── CONTENIDO PRINCIPAL ── */}
                <div className="px-8 pt-7 space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="relative w-full sm:max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                <FaMagnifyingGlass className="text-xs" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filtrar por producto, laboratorio o código de barras..."
                                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700"
                            />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                            <FaFileMedical className="text-sm text-blue-500" /> 
                            Resultado: {productosFiltrados.length} Productos bajo supervisión
                        </h3>
                    </div>

                    {/* ── TABLA DE ALERTAS CRÍTICAS ── */}
                    {productosFiltrados.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-blue-600">
                                        <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Detalles del Producto</th>
                                        
                                        {/* Columnas de Formulación dinámicas */}
                                        <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center bg-blue-700/30">Formulado {mesSeleccionadoLabel}</th>
                                        <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center bg-blue-700/30">Formulado {mesActualLabel} (Actual)</th>
                                        <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center bg-blue-700/50">Evolución Formulación</th>
                                        
                                        {/* Columnas Comerciales dinámicas */}
                                        <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center bg-emerald-700/20">Comprado {mesSeleccionadoLabel}</th>
                                        <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center bg-emerald-700/20">Comprado {mesActualLabel} (Actual)</th>
                                        <th className="px-6 py-3 text-white text-[9px] font-black uppercase text-center bg-emerald-700/40">Evolución Comercial</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {productosFiltrados.map((prod) => (
                                        <tr key={prod.codigo} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="px-6 py-3 border-r border-slate-100 max-w-xs">
                                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate">{prod.nombre}</p>
                                                <div className="flex gap-2 mt-0.5 text-[9px] font-bold text-slate-400 uppercase">
                                                    <span>COD: {prod.codigo}</span>
                                                    <span>·</span>
                                                    <span className="text-blue-600 font-black">{prod.laboratorio}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Renderizado de Formulación Histórica vs Actual */}
                                            <td className="px-6 py-3 border-r border-slate-100 text-center text-[10px] text-slate-600 font-bold bg-slate-50/30">
                                                {fmt(prod.formulado_mes_seleccionado)} u.
                                            </td>
                                            <td className="px-6 py-3 border-r border-slate-100 text-center text-[11px] text-slate-800 font-black bg-slate-50/30">
                                                {fmt(prod.formulado_mes_actual)} u.
                                            </td>
                                            <td className="px-6 py-3 border-r border-slate-100 text-center bg-slate-50/60">
                                                <RendimientoBadge tendencia={prod.formulado_tendencia} diferencia={prod.formulado_diferencia} />
                                            </td>
                                            
                                            {/* Renderizado Comercial Histórico vs Actual */}
                                            <td className="px-6 py-3 border-r border-slate-100 text-center text-[10px] text-slate-600 font-bold bg-emerald-50/10">
                                                {fmt(prod.comprado_mes_seleccionado)} u.
                                            </td>
                                            <td className="px-6 py-3 border-r border-slate-100 text-center text-[11px] text-slate-800 font-black bg-emerald-50/10">
                                                {fmt(prod.comprado_mes_actual)} u.
                                            </td>
                                            <td className="px-6 py-3 text-center bg-emerald-50/20">
                                                <RendimientoBadge tendencia={prod.comprado_tendencia} diferencia={prod.comprado_diferencia} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-[11px]">
                            <FaFileMedical className="text-4xl text-slate-200 mb-2 mx-auto block" />
                            No se detectaron transacciones ni variaciones críticas en el período seleccionado.
                        </div>
                    )}
                </div>
            </div>
        </PanelAdmin>
    );
}