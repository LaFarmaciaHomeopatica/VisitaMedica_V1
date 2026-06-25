import React from 'react';

const TABS = ['todos', 'nuevos', 'modificados', 'sin_cambios'];

const cmp = (a, b) => String(a || '').trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
    String(b || '').trim().toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function normalizeFecha(val) {
    if (!val) return '';
    return val.toString().trim()
        .replace('T', ' ')
        .replace(/\.000000Z$/, '')
        .replace(/Z$/, '')
        .trim();
}

function calcCambios(row, original) {
    if (!original) return {};
    return {
        nombre: !cmp(row.nombre, original.nombre),
        apellido: !cmp(row.apellido, original.apellido),
        especialidad: !cmp(row.especialidad, original.especialidad),
        categoria: !cmp(row.categoria, original.categoria?.nombre),
        telefono_contacto: !cmp(row.telefono_contacto, original.telefono_contacto),
        geolocalizacion: !cmp(row.geolocalizacion, original.geolocalizacion),
        direccion_detalles: !cmp(row.direccion_detalles, original.direccion_detalles),
        horario_atencion: !cmp(row.horario_atencion, original.horario_atencion),
        // ✅ CORREGIDO: compara nombre vs nombre
        visitador_id: !cmp(
            row.visitador_asignado,
            original?.visitador
                ? `${original.visitador.nombre} ${original.visitador.apellido}`
                : ''
        ),
        fecha_inicio_relacion: normalizeFecha(row.fecha_inicio_relacion) !== normalizeFecha(original.fecha_inicio_relacion),
    };
}

function CeldaCambio({ valor, cambio, actual }) {
    return (
        <td className="px-3 py-2">
            <div className="flex flex-col">
                <span className={cambio ? 'font-black text-orange-700' : 'text-slate-700'}>{valor || '---'}</span>
                {cambio && <span className="text-[8px] text-orange-400 italic">Actual: {actual || 'N/A'}</span>}
            </div>
        </td>
    );
}

export default function ImportPreviewModal({ isOpen, onClose, onConfirm, previewData, activeTab, setActiveTab }) {
    if (!isOpen) return null;

    const filasFiltradas = previewData.filter(row => {
        if (activeTab === 'todos') return true;
        if (activeTab === 'nuevos') return row._status === 'nuevo';
        if (activeTab === 'modificados') return row._status === 'modificado';
        if (activeTab === 'sin_cambios') return row._status === 'sin_cambios';
        return true;
    });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase">Sincronización de Médicos</h3>
                        <p className="text-[10px] text-slate-500 italic">Total: {previewData.length} registros</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-2 text-xl">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 border-b border-slate-200 px-4">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-[10px] font-bold uppercase transition-all border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-700 bg-white shadow-sm' : 'border-transparent text-slate-400 hover:bg-slate-100'}`}>
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-auto p-4 bg-slate-50/30">
                    <table className="w-full text-[10px] text-left border-collapse bg-white rounded-lg shadow-sm">
                        <thead className="sticky top-0 bg-slate-100 uppercase z-20 shadow-sm">
                            <tr>
                                {['Estado', 'Documento', 'Nombre', 'Apellido', 'Especialidad', 'Categoría', 'Teléfono',
                                    'Geolocalización', 'Dirección Detalles', 'Horario Atención', 'Visitador', 'Fecha Inicio'].map(h => (
                                        <th key={h} className="px-3 py-2 font-bold text-slate-600 border-b">{h}</th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filasFiltradas.map((row, i) => {
                                const original = row._original;
                                const existe = !!original;
                                const c = calcCambios(row, original);
                                const esModificado = row._status === 'modificado';
                                const docExcel = (row.documento || row.DOCUMENTO)?.toString().trim();

                                return (
                                    <tr key={i} className={`border-b border-slate-50 transition-all ${esModificado ? 'bg-orange-50' : !existe ? 'bg-emerald-50' : 'bg-white'}`}>
                                        <td className="px-3 py-2">
                                            {esModificado
                                                ? <span className="bg-orange-600 text-white px-2 py-1 rounded text-[8px] font-black">● MODIFICADO</span>
                                                : existe
                                                    ? <span className="text-slate-400 font-bold text-[8px] uppercase">[ SIN CAMBIOS ]</span>
                                                    : <span className="bg-emerald-600 text-white px-2 py-1 rounded text-[8px] font-black">● NUEVO</span>
                                            }
                                        </td>
                                        <td className="px-3 py-2 font-mono text-slate-500">{docExcel}</td>
                                        <CeldaCambio valor={row.nombre} cambio={c.nombre} actual={original?.nombre} />
                                        <CeldaCambio valor={row.apellido} cambio={c.apellido} actual={original?.apellido} />
                                        <CeldaCambio valor={row.especialidad} cambio={c.especialidad} actual={original?.especialidad} />
                                        <CeldaCambio valor={row.categoria} cambio={c.categoria} actual={original?.categoria?.nombre} />
                                        <CeldaCambio valor={row.telefono_contacto} cambio={c.telefono_contacto} actual={original?.telefono_contacto} />
                                        <CeldaCambio valor={row.geolocalizacion} cambio={c.geolocalizacion} actual={original?.geolocalizacion} />
                                        <CeldaCambio valor={row.direccion_detalles} cambio={c.direccion_detalles} actual={original?.direccion_detalles} />
                                        <CeldaCambio valor={row.horario_atencion} cambio={c.horario_atencion} actual={original?.horario_atencion} />
                                        {/* ✅ CORREGIDO: muestra el nombre del visitador desde el Excel */}
                                        <CeldaCambio
                                            valor={row.visitador_asignado || ''}
                                            cambio={c.visitador_id}
                                            actual={original?.visitador
                                                ? `${original.visitador.nombre} ${original.visitador.apellido}`
                                                : 'Sin asignar'}
                                        />
                                        <CeldaCambio valor={String(row.fecha_inicio_relacion || '')} cambio={c.fecha_inicio_relacion} actual={original?.fecha_inicio_relacion} />
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-white border-t flex gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg">Confirmar Importación</button>
                </div>
            </div>
        </div>
    );
}