import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import * as XLSX from 'xlsx';

const Gmedicos = ({ auth, medicos = [], visitadores = [], tiposDocumento = [] }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // --- NUEVOS ESTADOS PARA DUPLICADOS ---
    const [duplicatesFound, setDuplicatesFound] = useState([]);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: '',
        nombre: '',
        apellido: '',
        documento: '',
        especialidad: '',
        geolocalizacion: '',
        direccion_detalles: '',
        telefono_contacto: '',
        horario_atencion: '',
        visitador_id: '',
        fecha_inicio_relacion: '',
        tipo_documento_id: '',
    });

    const [visitadorNombre, setVisitadorNombre] = useState('');

    useEffect(() => {
        if (data.visitador_id && visitadores.length > 0) {
            const v = visitadores.find(v => v.id.toString() === data.visitador_id.toString());
            setVisitadorNombre(v ? `${v.nombre} ${v.apellido}` : 'No encontrado');
        } else {
            setVisitadorNombre('');
        }
    }, [data.visitador_id, visitadores]);

    const handleExport = () => { window.location.href = route('Gmedicos.exportar'); };
    const handleImportClick = () => { fileInputRef.current.click(); };

    // ... dentro de Gmedicos ...

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const dataRaw = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // 1. Limpiamos y normalizamos los encabezados
            const headers = dataRaw[0].map(h => h ? h.toString().trim().toLowerCase() : '');

            // 2. Procesamos las filas
            const rows = dataRaw.slice(1).map(row => {
                let obj = {};
                headers.forEach((h, i) => {
                    if (h) obj[h] = row[i];
                });
                return obj;
            });

            // 3. Normalizamos la lista de documentos existentes (Base de Datos)
            const docsExistentes = medicos.map(m =>
                m.documento ? m.documento.toString().trim() : ''
            );

            // 4. Buscamos duplicados comparando de forma segura
            const duplicados = rows.filter(row => {
                // Buscamos el campo 'documento' sin importar si el Excel lo llamó 'documento ' o 'Documento'
                const docValue = row.documento || row.DOCUMENTO || row.Documento;
                if (!docValue) return false;

                const docExcelClean = docValue.toString().trim();
                return docsExistentes.includes(docExcelClean);
            });

            console.log("Total filas:", rows.length);
            console.log("Duplicados encontrados:", duplicados.length);

            setDuplicatesFound(duplicados);
            setPreviewData(rows);
            setIsPreviewModalOpen(true);
        };
        reader.readAsBinaryString(file);
    };

    // ... resto del componente ...

    // Función que decide si mostrar advertencia o procesar directo
    const handleProcessImport = () => {
        if (duplicatesFound.length > 0) {
            setIsWarningModalOpen(true);
        } else {
            executeServerImport();
        }
    };

    const executeServerImport = () => {
        if (!selectedFile) return;
        router.post(route('Gmedicos.importar'), { archivo: selectedFile }, {
            forceFormData: true,
            onSuccess: () => {
                alert("¡Base de datos actualizada correctamente!");
                setIsPreviewModalOpen(false);
                setIsWarningModalOpen(false); // Cerramos el aviso si estaba abierto
                setPreviewData([]);
                setDuplicatesFound([]);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        });
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsFormModalOpen(true);
    };

    const openEditModal = (medico) => {
        clearErrors();
        setData({
            id: medico.id,
            nombre: medico.nombre,
            apellido: medico.apellido,
            documento: medico.documento,
            especialidad: medico.especialidad || '',
            geolocalizacion: medico.geolocalizacion || '',
            direccion_detalles: medico.direccion_detalles || '',
            telefono_contacto: medico.telefono_contacto || '',
            horario_atencion: medico.horario_atencion || '',
            visitador_id: medico.visitador_id || '',
            tipo_documento_id: medico.tipo_documento_id || '',
            fecha_inicio_relacion: medico.fecha_inicio_relacion ? medico.fecha_inicio_relacion.substring(0, 10) : '',
        });
        setIsEditing(true);
        setIsFormModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        isEditing
            ? put(route('Gmedicos.update', data.id), { onSuccess: () => setIsFormModalOpen(false) })
            : post(route('Gmedicos.store'), { onSuccess: () => { setIsFormModalOpen(false); reset(); } });
    };

    return (
        <PanelAdmin>
            <Head title="Directorio de Médicos" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 w-full">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-tight">Directorio de Médicos</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{medicos.length} registros en total</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleExport} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase border border-emerald-100 hover:bg-emerald-100 transition-colors">
                            Exportar
                        </button>
                        <button onClick={handleImportClick} className="bg-amber-50 text-amber-600 px-4 py-2 rounded-lg font-bold text-[10px] uppercase border border-amber-100 hover:bg-amber-100 transition-colors">
                            Importar
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
                        <button onClick={openCreateModal} className="bg-[#3D3FD8] text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all">
                            + Nuevo Médico
                        </button>
                    </div>
                </div>

                <div className="flex-grow w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">ID</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Nombre Completo</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Documento</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Especialidad</th>
                                    <th className="px-4 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Teléfono / Horario</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Visitador</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {medicos.map((m) => (
                                    <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-3 text-[11px] font-mono text-slate-400 border-r border-slate-50">{m.id}</td>
                                        <td className="px-6 py-3 border-r border-slate-50">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase leading-none">{m.nombre} {m.apellido}</span>
                                        </td>
                                        <td className="px-6 py-3 border-r border-slate-50">
                                            <span className="text-[10px] text-slate-600 font-medium">{m.tipo_documento?.nombre || 'DOC'}: {m.documento}</span>
                                        </td>
                                        <td className="px-6 py-3 border-r border-slate-50">
                                            <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 uppercase tracking-tighter">
                                                {m.especialidad || 'GENERAL'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-r border-slate-50">
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-[10px] text-slate-700 font-bold">{m.telefono_contacto || '---'}</span>
                                                <span className="text-[9px] text-slate-400 italic font-medium">{m.horario_atencion || 'Sin horario'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 border-r border-slate-50">
                                            {m.visitador ? (
                                                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-tight">
                                                    {m.visitador.nombre}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-slate-300 italic">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                onClick={() => openEditModal(m)}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- MODAL PREVISUALIZACIÓN --- */}
            {isPreviewModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsPreviewModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="text-lg font-black text-slate-800 uppercase">Previsualización Excel</h3>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>
                        <div className="flex-1 overflow-auto p-2">
                            <table className="w-full text-[9px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 uppercase">
                                        {previewData.length > 0 && Object.keys(previewData[0]).map(key => (
                                            <th key={key} className="px-2 py-1 font-bold text-slate-600 border border-slate-200">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 50).map((row, i) => {
                                        // 1. Verificamos si esta fila específica es un duplicado
                                        const docValor = (row.documento || row.DOCUMENTO || row.Documento)?.toString().trim();
                                        const esDuplicado = medicos.some(m => m.documento?.toString().trim() === docValor);

                                        return (
                                            <tr
                                                key={i}
                                                className={`${esDuplicado ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                                                {Object.values(row).map((val, j) => (
                                                    <td
                                                        key={j}
                                                        className={`px-2 py-1 border border-slate-100 whitespace-nowrap ${esDuplicado ? 'text-red-700 font-bold' : 'text-slate-600'}`}>
                                                        {/* 2. Si es duplicado, le ponemos un pequeño aviso visual */}
                                                        {j === 0 && esDuplicado && <span className="mr-1">⚠️</span>}
                                                        {val || '---'}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-200">
                            <button onClick={() => setIsPreviewModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl">Cancelar</button>
                            <button onClick={handleProcessImport} className={`flex-1 ${duplicatesFound.length > 0 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white py-2 rounded-xl font-bold text-xs uppercase shadow-lg transition-all`}>
                                {duplicatesFound.length > 0
                                    ? `Atención: ${duplicatesFound.length} duplicados encontrados`
                                    : `Cargar ${previewData.length} médicos al sistema`
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DE ADVERTENCIA (DUPLICADOS) --- */}
            {isWarningModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-red-900/40 backdrop-blur-md"></div>
                    <div className="relative bg-white w-full max-w-md rounded-[30px] shadow-2xl p-8 text-center">
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">MÉDICOS YA EXISTENTES</h3>
                        <p className="text-slate-500 text-sm mb-6 uppercase font-bold tracking-tighter">
                            Se detectaron <span className="text-red-600 font-black">{duplicatesFound.length} documentos</span> que ya están en el sistema.
                            ¿Deseas actualizar su información con los datos del Excel?
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={executeServerImport}
                                className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-900 transition-all tracking-widest"
                            >
                                SÍ, SOBREESCRIBIR DATOS
                            </button>
                            <button
                                onClick={() => setIsWarningModalOpen(false)}
                                className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all tracking-widest"
                            >
                                CANCELAR Y REVISAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL FORMULARIO --- */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
                        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto p-6">
                            <h3 className="text-lg font-black text-slate-800 mb-4 uppercase">{isEditing ? 'Editar' : 'Nuevo'} Médico</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input placeholder="Nombre" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                                <input placeholder="Apellido" value={data.apellido} onChange={e => setData('apellido', e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                                <div className="flex gap-2">
                                    <select value={data.tipo_documento_id} onChange={e => setData('tipo_documento_id', e.target.value)} className="w-1/3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold" required>
                                        <option value="" disabled>Tipo</option>
                                        {tiposDocumento.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                    <input placeholder="Documento" type="number" value={data.documento} onChange={e => setData('documento', e.target.value)} className="w-2/3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" required />
                                </div>
                                <input placeholder="Especialidad" value={data.especialidad} onChange={e => setData('especialidad', e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                                <input placeholder="Teléfono" value={data.telefono_contacto} onChange={e => setData('telefono_contacto', e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                                <input placeholder="Horario" value={data.horario_atencion} onChange={e => setData('horario_atencion', e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                                <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-3">
                                    <input placeholder="Dirección" value={data.direccion_detalles} onChange={e => setData('direccion_detalles', e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                                    <input placeholder="Geo (Lat, Long)" value={data.geolocalizacion} onChange={e => setData('geolocalizacion', e.target.value)} className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-sm" />
                                </div>
                                <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded-2xl flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black text-blue-600 uppercase block mb-1 tracking-widest">ID Visitador</label>
                                        <input type="number" value={data.visitador_id} onChange={e => setData('visitador_id', e.target.value)} className="w-full p-2 rounded-lg border border-blue-200 text-sm outline-none" />
                                        {visitadorNombre && <p className="text-[9px] text-blue-600 mt-1 font-bold italic tracking-tighter">{visitadorNombre}</p>}
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Fecha Inicio</label>
                                        <input type="date" value={data.fecha_inicio_relacion} onChange={e => setData('fecha_inicio_relacion', e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 py-3 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" disabled={processing} className="flex-[2] bg-[#3D3FD8] text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                    {processing ? 'Guardando...' : 'Confirmar Médico'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PanelAdmin>
    );
};

export default Gmedicos;