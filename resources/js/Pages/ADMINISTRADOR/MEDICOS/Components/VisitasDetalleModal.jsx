import React from 'react';
import { FaXmark, FaCalendarCheck, FaUserDoctor } from 'react-icons/fa6';

export default function VisitasDetalleModal({ isOpen, onClose, medico, nombreMes }) {
    if (!isOpen || !medico) return null;

    const resumen = medico.visitas_resumen || { total: medico.visitas_count || 0, estados: {} };
    const estadosEntries = Object.entries(resumen.estados || {}).filter(([_, count]) => count > 0);

    const getBadgeStyle = (estado) => {
        const est = (estado || '').toLowerCase();
        if (est.includes('efectiv') || est.includes('realizad') || est.includes('completad')) {
            return 'bg-emerald-50 border-emerald-200 text-emerald-700';
        }
        if (est.includes('cancelad') || est.includes('anulad')) {
            return 'bg-rose-50 border-rose-200 text-rose-700';
        }
        if (est.includes('programad') || est.includes('pendient')) {
            return 'bg-blue-50 border-blue-200 text-blue-700';
        }
        if (est.includes('reagendad') || est.includes('pospuest')) {
            return 'bg-amber-50 border-amber-200 text-amber-700';
        }
        return 'bg-slate-50 border-slate-200 text-slate-700';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
                {/* Header Modal */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                            <FaUserDoctor className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wide">
                                {medico.nombre}
                            </h3>
                            <p className="text-[11px] text-blue-100 font-medium">
                                Documento: {medico.documento || 'N/A'} {nombreMes ? `• Mes: ${nombreMes}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                    >
                        <FaXmark className="w-4 h-4" />
                    </button>
                </div>

                {/* Body Modal */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <FaCalendarCheck className="text-blue-600" />
                            Total Visitas Registradas
                        </span>
                        <span className="text-sm font-black px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {resumen.total} {resumen.total === 1 ? 'visita' : 'visitas'}
                        </span>
                    </div>

                    {estadosEntries.length > 0 ? (
                        <div className="space-y-2.5">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                                Desglose por Estado (Mes Seleccionado):
                            </p>
                            {estadosEntries.map(([estado, count]) => (
                                <div
                                    key={estado}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${getBadgeStyle(estado)} transition-all hover:scale-[1.01]`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-wide">
                                        {estado}
                                    </span>
                                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-white/80 shadow-xs border border-current">
                                        {count} {count === 1 ? 'visita' : 'visitas'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-xs font-medium text-slate-500">
                                No se encontraron visitas registradas para este médico en el mes seleccionado.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
