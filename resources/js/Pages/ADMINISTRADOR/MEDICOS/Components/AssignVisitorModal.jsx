import React, { useState } from 'react';

export default function AssignVisitorModal({
    isOpen, onClose, onConfirm,
    visitadores, selectedIds, hasPreviousAssignment,
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVisitorId, setSelectedVisitorId] = useState(null);

    if (!isOpen) return null;

    const filtered = visitadores.filter(v =>
        v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.apellido.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirm = () => {
        if (!selectedVisitorId) return;
        onConfirm(selectedVisitorId);
        setSelectedVisitorId(null);
        setSearchTerm('');
    };

    const handleClose = () => {
        setSelectedVisitorId(null);
        setSearchTerm('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />
            <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100">

                <div className="p-8 pb-4 text-center">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Asignar Visitador</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        Vas a vincular {selectedIds.length} médicos seleccionados
                    </p>
                </div>

                <div className="px-6 pb-4">
                    <input
                        type="text"
                        placeholder="BUSCAR POR NOMBRE O APELLIDO..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    />
                </div>

                {hasPreviousAssignment && (
                    <div className="px-6 pb-4">
                        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
                            <div className="bg-amber-500 text-white p-1.5 rounded-lg shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-amber-800 uppercase">Vínculo existente detectado</p>
                                <p className="text-[9px] text-amber-700 font-bold mt-1 leading-tight uppercase">
                                    Uno o más médicos ya tienen visitador asignado. Revisa el historial antes de continuar.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-h-[250px] overflow-y-auto px-6 py-2 space-y-2 bg-slate-50/50">
                    {filtered.length > 0 ? filtered.map(v => (
                        <button key={v.id} onClick={() => setSelectedVisitorId(v.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200
                                ${selectedVisitorId === v.id ? 'bg-indigo-600 border-indigo-600 shadow-lg scale-[1.01]' : 'bg-white border-transparent hover:border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${selectedVisitorId === v.id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {v.nombre[0]}{v.apellido[0]}
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${selectedVisitorId === v.id ? 'text-white' : 'text-slate-700'}`}>{v.nombre} {v.apellido}</p>
                                    <p className={`text-[9px] uppercase font-black tracking-widest ${selectedVisitorId === v.id ? 'text-indigo-200' : 'text-slate-400'}`}>ID: {v.id}</p>
                                </div>
                            </div>
                            {selectedVisitorId === v.id && (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    )) : (
                        <div className="py-10 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No se encontraron resultados</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white space-y-3">
                    <button disabled={!selectedVisitorId} onClick={handleConfirm}
                        className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${selectedVisitorId ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                        Confirmar Asignación
                    </button>
                    <button onClick={handleClose} className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}