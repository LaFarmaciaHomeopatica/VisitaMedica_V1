import React from 'react';
import { FaCircleCheck, FaCircleXmark, FaClock } from 'react-icons/fa6';

const ModalGestionarVisita = ({ logic }) => {
    if (!logic.modalGestionAbierto || !logic.visitaSeleccionada) return null;

    const handleActualizar = () => {
        logic.formReporte.post(route('visitas.marcarEfectiva', logic.visitaSeleccionada.id), {
            onSuccess: () => logic.setModalGestionAbierto(false)
        });
    };

    const opciones = [
        { id: 'efectiva', label: 'Efectiva', icon: FaCircleCheck, color: 'text-green-500' },
        { id: 'no_contactado', label: 'No contactado', icon: FaCircleXmark, color: 'text-orange-500' },
        { id: 'reprogramada', label: 'Reprogramar', icon: FaClock, color: 'text-blue-500' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => logic.setModalGestionAbierto(false)} />
            <div className="relative bg-white w-full max-w-md rounded-[35px] p-7 shadow-2xl animate-in zoom-in-95">
                <h2 className="text-lg font-black uppercase text-gray-900">Gestionar Visita</h2>
                <p className="text-xs text-blue-500 font-bold mb-6">{logic.visitaSeleccionada.doctor}</p>

                <div className="space-y-4">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Resultado de la visita</label>
                    <div className="grid grid-cols-1 gap-2">
                        {opciones.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => logic.formReporte.setData('estado', opt.id)}
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${logic.formReporte.data.estado === opt.id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent text-gray-400'}`}
                            >
                                <opt.icon className={`text-lg ${logic.formReporte.data.estado === opt.id ? opt.color : 'text-gray-300'}`} />
                                <span className="text-xs font-bold">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleActualizar}
                        disabled={logic.formReporte.processing}
                        className="w-full py-4 bg-[#5D8BF4] text-white rounded-2xl font-black text-[10px] tracking-widest mt-4"
                    >
                        {logic.formReporte.processing ? 'GUARDANDO...' : 'FINALIZAR REPORTE'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalGestionarVisita;