import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaUserDoctor, FaVideo, FaChevronRight } from 'react-icons/fa6';

const VisitasList = ({ logic }) => {
    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'efectiva': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
            case 'programada': return 'bg-amber-50 border-amber-100 text-amber-600';
            case 'no_contactado': return 'bg-rose-50 border-rose-100 text-rose-600';
            case 'reprogramada': return 'bg-blue-50 border-blue-100 text-blue-600';
            default: return 'bg-gray-50 border-gray-100 text-gray-600';
        }
    };

    return (
        <section className="lg:col-span-5 space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                {format(logic.fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
            </h3>
            <div className="space-y-3">
                {logic.visitasDelDia.length > 0 ? (
                    logic.visitasDelDia.map(v => (
                        <button key={v.id} onClick={() => logic.abrirGestion(v)} className={`w-full p-5 rounded-[28px] border-2 flex items-center justify-between transition-all hover:scale-[1.02] ${obtenerColorEstado(v.estado)}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm relative text-blue-500">
                                    <FaUserDoctor className="text-lg" />
                                    {v.modalidad === 'VIRTUAL' && <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-white"><FaVideo /></div>}
                                </div>
                                <div className="text-left">
                                    <h4 className="text-[13px] font-black uppercase">{v.doctor}</h4>
                                    <p className="text-[9px] font-bold uppercase opacity-60">{v.estado} • {v.modalidad}</p>
                                </div>
                            </div>
                            <FaChevronRight className="opacity-30 text-xs" />
                        </button>
                    ))
                ) : (
                    <div className="bg-white/40 border-2 border-dashed border-gray-100 rounded-[28px] py-12 text-center text-gray-400 text-[11px] italic">Sin actividades para este día.</div>
                )}
            </div>
        </section>
    );
};

export default VisitasList;