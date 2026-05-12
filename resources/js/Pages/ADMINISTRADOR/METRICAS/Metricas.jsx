import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';

const Metricas = ({ auth, filtros, stats, grafico, tabla, medicos }) => {
    // Estados locales para los filtros
    const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio);
    const [fechaFin, setFechaFin] = useState(filtros.fecha_fin);
    const [medicoId, setMedicoId] = useState(filtros.medico_seleccionado || '');

    // Función para disparar la actualización de la calculadora
    const aplicarFiltros = () => {
        router.get(route('Metricas.index'), {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            medico_documento: medicoId
        }, { preserveState: true });
    };

    return (
        <PanelAdmin user={auth.user}>
            <Head title="Métricas de Desempeño" />

            <div className="py-6 px-4 mx-auto max-w-7xl">
                {/* Header y Título */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Calculadora de Métricas</h2>
                    <button
                        onClick={() => router.visit(route('transacciones.index'))}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                        + Importar Nuevo Excel
                    </button>
                </div>

                {/* Barra de Filtros */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha Inicio</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha Fin</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Filtrar por Médico</label>
                        <select
                            value={medicoId}
                            onChange={(e) => setMedicoId(e.target.value)}
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Todos los Médicos</option>
                            {medicos.map(m => (
                                <option key={m.documento} value={m.documento}>{m.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={aplicarFiltros}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition shadow-md"
                    >
                        CALCULAR MÉTRICAS
                    </button>
                </div>

                {/* Tarjetas de KPI */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Unidades Compradas" value={stats.compradas} color="blue" />
                    <StatCard title="Unidades Formuladas" value={stats.formuladas} color="purple" />
                    <StatCard title="Valor Formulado" value={`$${new Intl.NumberFormat().format(stats.valor_formulado)}`} color="green" />
                    <StatCard title="% Efectividad" value={`${stats.efectividad}%`} color="orange" />
                </div>

                {/* Placeholder para Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[300px] flex items-center justify-center text-slate-400 italic">
                        [Aquí irá el Gráfico de Tendencia con los datos de: {grafico.length} puntos de fecha]
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[300px] flex items-center justify-center text-slate-400 italic">
                        [Aquí irá el Top Productos]
                    </div>
                </div>

                {/* Tabla de Desglose */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700">Desglose por Entidad y Producto</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-bold">
                                    <th className="p-4">Médico / Producto</th>
                                    <th className="p-4 text-center">U. Compradas</th>
                                    <th className="p-4 text-center">U. Formuladas</th>
                                    <th className="p-4 text-center">Valor Formulado</th>
                                    <th className="p-4 text-center">Efectividad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tabla.length > 0 ? tabla.map((row, idx) => (
                                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50 transition">
                                        <td className="p-4 text-sm">
                                            <div className="font-bold text-blue-900">{row.medico_documento}</div>
                                            <div className="text-xs text-slate-500">Cód: {row.producto_codigo}</div>
                                        </td>
                                        <td className="p-4 text-center font-medium">{row.compradas}</td>
                                        <td className="p-4 text-center font-medium">{row.formuladas}</td>
                                        <td className="p-4 text-center font-bold text-green-700">
                                            ${new Intl.NumberFormat().format(row.valor_f)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${row.compradas > 0 && (row.formuladas / row.compradas) > 0.7 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {row.compradas > 0 ? ((row.formuladas / row.compradas) * 100).toFixed(1) : 0}%
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-slate-400 italic">
                                            No hay datos cargados para este periodo. Por favor, importe un archivo Excel.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PanelAdmin>
    );
};

// Sub-componente para las tarjetas de estadísticas
const StatCard = ({ title, value, color }) => {
    const colors = {
        blue: "border-blue-500 text-blue-600",
        purple: "border-purple-500 text-purple-600",
        green: "border-green-500 text-green-600",
        orange: "border-orange-500 text-orange-600"
    };

    return (
        <div className={`bg-white p-5 rounded-xl shadow-sm border-t-4 ${colors[color]} border-x border-b border-slate-200`}>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black mt-2 text-slate-800">{value}</p>
        </div>
    );
};

export default Metricas;