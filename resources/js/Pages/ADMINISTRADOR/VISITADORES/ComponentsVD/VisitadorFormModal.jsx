// resources/js/Pages/ADMINISTRADOR/VISITADORES/ComponentsVD/VisitadorFormModal.jsx
import React from 'react';

const VisitadorFormModal = ({ isOpen, onClose, isEditing, form, ui, tiposDocumento }) => {
    if (!isOpen) return null;

    const { data, setData, errors, processing, post, put } = form;
    const { userName, isSearching } = ui;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gvisitadores.update', data.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('Gvisitadores.store'), {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <h3 className="text-xl font-black text-slate-800 mb-6 uppercase">
                        {isEditing ? 'Actualizar Visitador' : 'Nuevo Visitador'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* ID Usuario Sistema */}
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black text-blue-500 uppercase mb-2">ID Usuario Sistema *</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={data.usuario_id}
                                    onChange={e => setData('usuario_id', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={isEditing}
                                    required
                                />
                                {isSearching && <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
                            </div>
                            <div className="mt-2 text-[10px] font-bold uppercase">
                                <span className={userName.includes('no encontrado') ? 'text-rose-500' : 'text-blue-700'}>
                                    {userName || "Esperando ID..."}
                                </span>
                            </div>
                            {errors.usuario_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.usuario_id}</p>}
                        </div>

                        {/* Zona Asignada */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Zona Asignada</label>
                            <select value={data.zona_id} onChange={e => setData('zona_id', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none" required>
                                <option value="">Seleccione...</option>
                                <option value="1">Zona 1 - Norte</option>
                                <option value="2">Zona 2 - Sur</option>
                                <option value="3">Zona 3 - Centro</option>
                            </select>
                            {errors.zona_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.zona_id}</p>}
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nombre</label>
                            <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm uppercase outline-none" required />
                            {errors.nombre && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.nombre}</p>}
                        </div>

                        {/* Apellido */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Apellido</label>
                            <input type="text" value={data.apellido} onChange={e => setData('apellido', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm uppercase outline-none" required />
                            {errors.apellido && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.apellido}</p>}
                        </div>

                        {/* Tipo de Documento */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo de Documento</label>
                            <select value={data.tipo_documento_id} onChange={e => setData('tipo_documento_id', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none" required>
                                <option value="">Seleccione...</option>
                                {tiposDocumento.map(tipo => (<option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>))}
                            </select>
                            {errors.tipo_documento_id && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.tipo_documento_id}</p>}
                        </div>

                        {/* Número Documento */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Número Documento</label>
                            <input type="text" value={data.documento} onChange={e => setData('documento', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none" required />
                            {errors.documento && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.documento}</p>}
                        </div>

                        {/* Estado del Visitador */}
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Estado del Visitador</label>
                            <select
                                value={data.estado}
                                onChange={e => setData('estado', e.target.value)}
                                className={`w-full border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all ${data.estado === 'habilitado' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                                required
                            >
                                <option value="Habilitado">Habilitado</option>
                                <option value="Inhabilitado">Inhabilitado</option>
                            </select>
                            {errors.estado && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.estado}</p>}
                        </div>

                        {/* Meta de Visitas Mensual */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Meta de Visitas Mensual</label>
                            <input type="number" value={data.meta_visitas || ''} onChange={e => setData('meta_visitas', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none" />
                            {errors.meta_visitas && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.meta_visitas}</p>}
                        </div>

                        {/* Meta de Ventas Mensual */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Meta de Ventas Mensual</label>
                            <input type="number" value={data.meta_dinero || ''} onChange={e => setData('meta_dinero', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none" />
                            {errors.meta_dinero && <p className="text-rose-500 text-[9px] font-black mt-1 uppercase">{errors.meta_dinero}</p>}
                        </div>

                       {/* 🗓️ SELECTOR DE SEMANAS INTERACTIVO SIN DESFASES VISUALES */}
<div className="md:col-span-2 bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Definir Meta por Semana Específica
            </h4>
        </div>
        {data.fecha_meta && (
            <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase">
                Semana Seleccionada
            </span>
        )}
    </div>

    {/* Selector de Mes Base */}
    <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">1. Selecciona el Mes Base</label>
        <input 
            type="month" 
            value={data.mes_visual || ''} // 👈 CONTROLADO: Ya no se salta de mes solo
            onChange={e => {
                const mes = e.target.value; // Ejemplo: "2026-07"
                if (!mes) return;
                
                // Seteamos el mes visual fijo y limpiamos fechas viejas para obligar a elegir semana
                setData(prev => ({
                    ...prev,
                    mes_visual: mes,
                    fecha_meta: `${mes}-01`, // Temporal para que la malla sepa qué mes dibujar
                    fecha_fin_meta: ''
                }));
            }} 
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
        />
    </div>

    {/* 📊 SELECTOR VISUAL DE SEMANAS */}
    {data.mes_visual && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">2. Haz clic en la semana deseada</label>
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                {/* Cabecera L-D */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-300 uppercase mb-2">
                    <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                </div>
                
                {/* Malla de Semanas */}
                <div className="space-y-1">
                    {(() => {
                        // Usamos estrictamente mes_visual para armar el calendario
                        const [year, month] = data.mes_visual.split('-').map(Number);
                        const primerDiaMes = new Date(year, month - 1, 1);

                        let startDayIndex = primerDiaMes.getDay() - 1; // Ajuste a Lunes (0)
                        if (startDayIndex === -1) startDayIndex = 6;

                        // Generar los 42 días de la matriz
                        const totalDias = [];
                        const fechaIterar = new Date(year, month - 1, 1);
                        fechaIterar.setDate(fechaIterar.getDate() - startDayIndex);

                        for (let i = 0; i < 42; i++) {
                            totalDias.push(new Date(fechaIterar));
                            fechaIterar.setDate(fechaIterar.getDate() + 1);
                        }

                        // Agrupar en semanas
                        const semanas = [];
                        for (let i = 0; i < totalDias.length; i += 7) {
                            semanas.push(totalDias.slice(i, i + 7));
                        }

                        return semanas.map((semana, sIndex) => {
                            const lunesSemana = semana[0].toISOString().split('T')[0];
                            const domingoSemana = semana[6].toISOString().split('T')[0];
                            
                            // Comparamos contra el rango guardado real para mantener el color azul activo
                            const esSemanaSeleccionada = data.fecha_meta === lunesSemana;

                            // Mostrar solo semanas que toquen el mes visual seleccionado
                            const tieneDiasDelMes = semana.some(d => d.getMonth() === month - 1);
                            if (!tieneDiasDelMes) return null;

                            return (
                                <div 
                                    key={`sem-${sIndex}`}
                                    onClick={() => {
                                        // Guardamos las fechas operativas pero SIN tocar mes_visual
                                        setData(prev => ({
                                            ...prev,
                                            fecha_meta: lunesSemana,
                                            fecha_fin_meta: domingoSemana
                                        }));
                                    }}
                                    className={`grid grid-cols-7 gap-1 p-1 rounded-xl cursor-pointer transition-all group
                                        ${esSemanaSeleccionada ? 'bg-blue-600 shadow-md scale-[1.02]' : 'hover:bg-slate-100'}`}
                                >
                                    {semana.map((dia, dIndex) => {
                                        const esDelMesActual = dia.getMonth() === month - 1;
                                        return (
                                            <span 
                                                key={`d-${sIndex}-${dIndex}`}
                                                className={`h-8 flex items-center justify-center text-[11px] font-bold rounded-lg
                                                    ${esSemanaSeleccionada ? 'text-white' : esDelMesActual ? 'text-slate-700' : 'text-slate-300'}`}
                                            >
                                                {dia.getDate()}
                                            </span>
                                        );
                                    })}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Resumen de Selección */}
            {data.fecha_fin_meta && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
                    <div className="text-[10px] font-bold text-blue-700 uppercase">
                        Rango Registrado:
                    </div>
                    <div className="text-[11px] font-black text-blue-800">
                        {new Date(data.fecha_meta + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        <span className="mx-2 text-blue-300">➔</span>
                        {new Date(data.fecha_fin_meta + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                </div>
            )}
        </div>
    )}
</div>

                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing || (!isEditing && (!userName || userName.includes('no encontrado')))}
                            className="flex-[2] py-4 bg-[#3D3FD8] text-white rounded-2xl font-black text-[11px] uppercase shadow-lg hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all"
                        >
                            {processing ? 'GUARDANDO...' : isEditing ? 'CONFIRMAR CAMBIOS' : 'REGISTRAR VISITADOR'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VisitadorFormModal;