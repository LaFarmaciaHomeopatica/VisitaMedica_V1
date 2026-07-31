import React from 'react';

export default function MedicoFormModal({
    isOpen, onClose,
    isEditing, data, setData, errors,
    processing, onSubmit,
    tiposDocumento,
    visitadorNombre,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
                <form onSubmit={onSubmit} className="max-h-[90vh] overflow-y-auto p-6">
                    <h3 className="text-lg font-black text-slate-800 mb-4 uppercase">
                        {isEditing ? 'Editar' : 'Nuevo'} Médico
                    </h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <input 
        placeholder="Nombre Completo" 
        value={data.nombre} 
        onChange={e => setData('nombre', e.target.value)}
        className="col-span-1 md:col-span-2 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
        required 
    />

    {/* Solo el Input de Documento a ancho completo */}
    <input 
        placeholder="Documento / Cédula / RUC" 
        type="text" 
        value={data.documento} 
        onChange={e => setData('documento', e.target.value)}
        className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
        required 
    />

    {/* Muestra el mensaje de error si el documento ya existe o falla otra regla */}
    {errors.documento && (
        <div className="col-span-1 md:col-span-2 text-red-500 text-[11px] w-full mt-1 font-bold pl-1">
            {errors.documento}
        </div>
    )}

    <input 
        placeholder="Teléfono" 
        value={data.telefono_contacto} 
        onChange={e => setData('telefono_contacto', e.target.value)}
        className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" 
    />
    
    <input 
        placeholder="Horario" 
        value={data.horario_atencion} 
        onChange={e => setData('horario_atencion', e.target.value)}
        className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" 
    />

    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
        <input 
            placeholder="Dirección" 
            value={data.direccion_detalles} 
            onChange={e => setData('direccion_detalles', e.target.value)}
            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" 
        />
        <input 
            placeholder="Geo (Lat, Long)" 
            value={data.geolocalizacion} 
            onChange={e => setData('geolocalizacion', e.target.value)}
            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" 
        />
    </div>

    <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded-2xl flex gap-3">
        <div className="flex-1">
            <label className="text-[9px] font-black text-blue-600 uppercase block mb-1 tracking-widest">ID Visitador</label>
            <input 
                type="number" 
                value={data.visitador_id} 
                onChange={e => setData('visitador_id', e.target.value)}
                className="w-full p-2 rounded-lg border border-blue-200 text-sm outline-none" 
            />
            {visitadorNombre && <p className="text-[9px] text-blue-600 mt-1 font-bold italic tracking-tighter">{visitadorNombre}</p>}
        </div>
        <div className="flex-1">
            <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Fecha Inicio</label>
            <input 
                type="date" 
                value={data.fecha_inicio_relacion} 
                onChange={e => setData('fecha_inicio_relacion', e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none" 
            />
        </div>
    </div>
</div>

                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose}
                            className="flex-1 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 py-3 rounded-xl transition-all">
                            Cancelar
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-[2] bg-[#3D3FD8] text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                            {processing ? 'Guardando...' : 'Confirmar Médico'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}