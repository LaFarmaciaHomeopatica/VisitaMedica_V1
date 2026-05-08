import React from 'react';

const TABS = [
    { id: 'todos', label: 'Todos' },
    { id: 'nuevos', label: 'Nuevos' },
    { id: 'modificados', label: 'Modificados' },
    { id: 'sin_cambios', label: 'Sin Cambios' },
];

function calcCambios(row, original) {
    if (!original) return { nombre: false, laboratorio: false };
    const cmp = (a, b) => a?.toString().trim().toLowerCase() === (b || '').toLowerCase();
    return {
        nombre: !cmp(row.nombre, original.nombre),
        laboratorio: !cmp(row.laboratorio, original.laboratorio),
    };
}

export default function ProductoImportPreviewModal({
    isOpen, onClose, onConfirm,
    previewData, productos,
    activeTab, setActiveTab,
}) {
    if (!isOpen) return null;

    const filasFiltradas = previewData.filter(row => {
        const original = productos.find(p => p.codigo?.toString().trim() === row.codigo?.toString().trim());
        const existe = !!original;
        const c = calcCambios(row, original);
        const modificado = c.nombre || c.laboratorio;

        if (activeTab === 'nuevos') return !existe;
        if (activeTab === 'modificados') return modificado;
        if (activeTab === 'sin_cambios') return existe && !modificado;
        return true;
    });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Cabecera */}
                <div className="p-4 border-b bg-white flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase">Revisión de Importación</h3>
                        <p className="text-[10px] text-slate-500 italic">Total cargado: {previewData.length} ítems</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 border-b px-4">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-[10px] font-bold uppercase transition-all border-b-2
                                ${activeTab === tab.id ? 'border-blue-500 text-blue-700 bg-white' : 'border-transparent text-slate-400 hover:bg-slate-100'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <div className="flex-1 overflow-auto p-4 bg-slate-50/30">
                    <table className="w-full text-[10px] text-left border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                        <thead className="sticky top-0 z-10 bg-slate-100 uppercase shadow-sm">
                            <tr>
                                <th className="px-4 py-3 font-bold text-slate-600 border-b">Acción</th>
                                <th className="px-4 py-3 font-bold text-slate-600 border-b">Código</th>
                                <th className="px-4 py-3 font-bold text-slate-600 border-b">Nombre</th>
                                <th className="px-4 py-3 font-bold text-slate-600 border-b">Laboratorio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filasFiltradas.map((row, i) => {
                                const original = productos.find(p => p.codigo?.toString().trim() === row.codigo?.toString().trim());
                                const existe = !!original;
                                const c = calcCambios(row, original);
                                const modificado = c.nombre || c.laboratorio;

                                return (
                                    <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${modificado ? 'bg-orange-50/30' : ''}`}>
                                        <td className="px-4 py-3">
                                            {modificado ? (
                                                <span className="text-[9px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded">MODIFICADO</span>
                                            ) : existe ? (
                                                <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded">SIN CAMBIOS</span>
                                            ) : (
                                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">NUEVO</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-500">{row.codigo}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className={c.nombre ? 'font-black text-orange-700' : 'text-slate-700'}>{row.nombre}</span>
                                                {c.nombre && <span className="text-[8px] text-slate-400 italic">Antiguo: {original.nombre}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className={c.laboratorio ? 'font-black text-orange-700' : 'text-slate-700'}>{row.laboratorio}</span>
                                                {c.laboratorio && <span className="text-[8px] text-slate-400 italic">Antiguo: {original.laboratorio}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t flex items-center justify-between">
                    <button onClick={onClose} className="px-6 py-2 text-slate-400 font-bold text-[10px] uppercase hover:bg-slate-50 rounded-lg">Cancelar</button>
                    <button onClick={onConfirm} className="px-10 py-3 rounded-xl font-black text-[10px] uppercase text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all">
                        Confirmar e Importar Todo
                    </button>
                </div>
            </div>
        </div>
    );
}