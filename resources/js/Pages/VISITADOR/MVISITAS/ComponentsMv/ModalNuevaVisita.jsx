import React from 'react';

const ModalNuevaVisita = ({ logic, doctores }) => {
    if (!logic.modalNuevoAbierto) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        logic.formNueva.post(route('visitas.store'), {
            onSuccess: () => {
                logic.setModalNuevoAbierto(false);
                logic.formNueva.reset();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => logic.setModalNuevoAbierto(false)} />
            <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-md rounded-[35px] p-7 shadow-2xl animate-in zoom-in-95">
                <h2 className="text-lg font-black uppercase mb-4">Programar Visita</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seleccionar Doctor</label>
                        <select
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1"
                            value={logic.formNueva.data.medico_id}
                            onChange={e => logic.formNueva.setData('medico_id', e.target.value)}
                            required
                        >
                            <option value="">-- Elige un médico --</option>
                            {doctores.map(doc => <option key={doc.id} value={doc.id}>{doc.nombre}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fecha</label>
                            <input
                                type="date"
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold"
                                value={logic.formNueva.data.fecha_programada}
                                onChange={e => logic.formNueva.setData('fecha_programada', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Modalidad</label>
                            <select
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold"
                                value={logic.formNueva.data.modalidad}
                                onChange={e => logic.formNueva.setData('modalidad', e.target.value)}
                            >
                                <option value="PRESENCIAL">Presencial</option>
                                <option value="VIRTUAL">Virtual</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={logic.formNueva.processing}
                        className="w-full bg-[#5D8BF4] text-white rounded-2xl py-4 text-[10px] font-black tracking-widest shadow-lg"
                    >
                        {logic.formNueva.processing ? 'PROCESANDO...' : 'GUARDAR EN AGENDA'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ModalNuevaVisita;