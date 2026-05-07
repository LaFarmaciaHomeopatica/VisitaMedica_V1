import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid
} from 'recharts';

const GInicio = () => {
    const [periodo, setPeriodo] = useState('mes');
    const [busqueda, setBusqueda] = useState('');
    const [sujetoSeleccionado, setSujetoSeleccionado] = useState(null);
    const [topLimit, setTopLimit] = useState(5);

    const datos = {
        dia: {
            medicos: [
                { nombre: 'Dr. Perez', ventas: 5, compras: 2, productoEstrella: 'Arnica Comp.', especialidad: 'General', tipo: 'Formulador', activo: true, ultimaVisita: '10:00 AM', zona: 'Norte' },
                { nombre: 'Dra. Gomez', ventas: 8, compras: 3, productoEstrella: 'Passiflora Gotas', especialidad: 'Pediatría', tipo: 'Comprador', activo: true, ultimaVisita: '09:30 AM', zona: 'Sur' },
                { nombre: 'Dr. Casa', ventas: 0, compras: 0, productoEstrella: 'Ninguno', especialidad: 'Urología', tipo: 'Formulador', activo: false, ultimaVisita: 'Hace 3 días', zona: 'Este' },
            ],
            visitadores: [
                { nombre: 'Martinez', asignadas: 8, cumplidas: 6, faltantes: 2, zona: 'Norte', ultimaVisita: 'Dr. Perez', eficiencia: 75 },
                { nombre: 'Lopez', asignadas: 6, cumplidas: 6, faltantes: 0, zona: 'Sur', ultimaVisita: 'Dra. Gomez', eficiencia: 100 }
            ],
            alertas: [{ id: 1, msg: 'Reporte matutino pendiente: Lopez', tipo: 'advertencia' }]
        }
        // Nota: En un entorno real, 'semana' y 'mes' vendrían del backend
    };

    const dataActual = datos[periodo] || datos['dia'];

    // --- LÓGICA DE BÚSQUEDA ---
    const resultadosBusqueda = useMemo(() => {
        if (!busqueda) return { medicos: [], visitadores: [] };
        return {
            medicos: dataActual.medicos.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase())),
            visitadores: dataActual.visitadores.filter(v => v.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        };
    }, [busqueda, dataActual]);

    // --- DATOS PARA GRÁFICAS (CORREGIDO) ---
    const compradores = useMemo(() =>
        [...dataActual.medicos].sort((a, b) => b.compras - a.compras).slice(0, topLimit),
        [dataActual, topLimit]);

    const formuladores = useMemo(() =>
        [...dataActual.medicos].sort((a, b) => b.ventas - a.ventas).slice(0, topLimit),
        [dataActual, topLimit]);

    // --- VISTA: DASHBOARD GENERAL ---
    const renderDashboardGeneral = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CardKPI
                    title="Médicos Activos / Inactivos"
                    value={`${dataActual.medicos.filter(m => m.activo).length} | ${dataActual.medicos.filter(m => !m.activo).length}`}
                    color="text-blue-600"
                    trend="Estado de red"
                />
                <CardKPI
                    title="Visitas Totales"
                    value={dataActual.visitadores.reduce((acc, v) => acc + v.cumplidas, 0)}
                    color="text-indigo-600"
                    trend="Realizadas"
                />
                <CardKPI
                    title="Alertas"
                    value={dataActual.alertas.length}
                    color="text-rose-600"
                    trend="Pendientes"
                />
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 w-fit">
                <span className="text-sm font-bold text-slate-500">Ajustar Top:</span>
                <input
                    type="number" min="1" max="50"
                    value={topLimit}
                    onChange={(e) => setTopLimit(Number(e.target.value))}
                    className="w-20 p-2 border-2 border-slate-100 rounded-lg font-black text-indigo-600 outline-none focus:border-indigo-300"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title={`Top ${topLimit} Compradores`} color="bg-orange-500">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={compradores}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="compras" fill="#f97316" radius={[10, 10, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title={`Top ${topLimit} Formuladores`} color="bg-violet-500">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={formuladores}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="ventas" fill="#8b5cf6" radius={[10, 10, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-black text-slate-700 uppercase tracking-tighter">Ranking Médico: Producto más formulado</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {formuladores.map((med, idx) => (
                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50">
                            <div>
                                <p className="font-bold text-slate-800">{med.nombre}</p>
                                <p className="text-xs text-slate-500 font-medium">{med.especialidad}</p>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                                    {med.productoEstrella}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // --- VISTA: DETALLE (MÉDICO O VISITADOR) ---
    const renderVistaSujeto = () => (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <button
                onClick={() => setSujetoSeleccionado(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-black text-xs hover:bg-indigo-600 transition-colors"
            >
                ← VOLVER AL DASHBOARD
            </button>

            <div className="bg-white p-8 rounded-[2.5rem] border-4 border-indigo-500 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                    <div>
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-md uppercase mb-2 inline-block">
                            {sujetoSeleccionado.tipo ? 'Perfil Profesional' : 'Métricas del Visitador'}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter leading-none">{sujetoSeleccionado.nombre}</h1>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Estado</p>
                        <p className={`text-lg font-black ${sujetoSeleccionado.activo !== false ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {sujetoSeleccionado.activo !== false ? '● ACTIVO' : '○ INACTIVO'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sujetoSeleccionado.asignadas !== undefined ? (
                        <>
                            <MetricBlock label="Visitas Completadas" value={sujetoSeleccionado.cumplidas} color="text-emerald-600" />
                            <MetricBlock label="Visitas Faltantes" value={sujetoSeleccionado.faltantes} color="text-rose-600" />
                            <MetricBlock label="Zona de Trabajo" value={sujetoSeleccionado.zona} color="text-slate-700" />
                            <MetricBlock label="Efectividad" value={`${sujetoSeleccionado.eficiencia}%`} color="text-indigo-600" />
                            <div className="col-span-full mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 font-bold text-indigo-800 text-center">
                                Última visita realizada: <span className="underline">{sujetoSeleccionado.ultimaVisita}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <MetricBlock label="Fórmulas Totales" value={sujetoSeleccionado.ventas} color="text-indigo-600" />
                            <MetricBlock label="Compras Totales" value={sujetoSeleccionado.compras} color="text-orange-600" />
                            <MetricBlock label="Especialidad" value={sujetoSeleccionado.especialidad} color="text-slate-700" />
                            <MetricBlock label="Producto Estrella" value={sujetoSeleccionado.productoEstrella} color="text-violet-600" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <PanelAdmin>
            <Head title={`Admin - ${periodo.toUpperCase()}`} />
            <div className="w-full min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">

                {/* BUSCADOR INTELIGENTE */}
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1 max-w-2xl relative group">
                        <input
                            type="text"
                            placeholder="Buscar médico o visitador..."
                            className="w-full bg-white border-2 border-slate-200 py-4 pl-12 pr-6 rounded-2xl shadow-sm focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        {busqueda && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                                {resultadosBusqueda.medicos.map((m, i) => (
                                    <button key={`m-${i}`} onClick={() => { setSujetoSeleccionado(m); setBusqueda('') }} className="w-full p-4 text-left hover:bg-indigo-50 flex justify-between border-b border-slate-50 last:border-0">
                                        <span className="font-bold text-slate-700">{m.nombre} (Médico)</span>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase self-center">Ver Perfil</span>
                                    </button>
                                ))}
                                {resultadosBusqueda.visitadores.map((v, i) => (
                                    <button key={`v-${i}`} onClick={() => { setSujetoSeleccionado(v); setBusqueda('') }} className="w-full p-4 text-left hover:bg-emerald-50 flex justify-between border-b border-slate-50 last:border-0">
                                        <span className="font-bold text-slate-700">{v.nombre} (Visitador)</span>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase self-center">Ver Métricas</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl self-start">
                        {['dia', 'semana', 'mes'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriodo(p)}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${periodo === p ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {p === 'dia' ? 'Hoy' : p}
                            </button>
                        ))}
                    </div>
                </div>

                {sujetoSeleccionado ? renderVistaSujeto() : renderDashboardGeneral()}

            </div>
        </PanelAdmin>
    );
};

// --- COMPONENTES AUXILIARES ---
const MetricBlock = ({ label, value, color }) => (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-center text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <p className={`text-2xl font-black ${color} break-words`}>{value}</p>
    </div>
);

const CardKPI = ({ title, value, color, trend }) => (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h2 className={`text-4xl font-black ${color} tracking-tighter`}>{value}</h2>
        <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md">{trend}</div>
    </div>
);

const ChartContainer = ({ title, children, color }) => (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <span className={`w-2 h-8 ${color} rounded-full`}></span>
            {title}
        </h3>
        {children}
    </div>
);

export default GInicio;