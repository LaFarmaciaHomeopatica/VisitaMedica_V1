import React, { useState, useEffect, useRef } from 'react'; // Agregamos useRef
import { Head, useForm, router } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';

const Gmedicos = ({ auth, medicos = [], visitadores = [], tiposDocumento = [] }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null); // Referencia para el input de archivo oculto

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
        archivo: null, // Campo para la importación
    });

    const [visitadorNombre, setVisitadorNombre] = useState('');

    useEffect(() => {
        if (data.visitador_id && visitadores.length > 0) {
            const v = visitadores.find(v => v.id.toString() === data.visitador_id.toString());
            setVisitadorNombre(v ? `${v.nombre} ${v.apellido}` : 'Visitador no encontrado');
        } else {
            setVisitadorNombre('');
        }
    }, [data.visitador_id, visitadores]);

    // --- NUEVAS FUNCIONES DE EXCEL ---
    const handleExport = () => {
        window.location.href = route('Gmedicos.exportar');
    };

    const handleImportClick = () => {
        fileInputRef.current.click(); // Abre el selector de archivos
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Usamos router.post para enviar el archivo de forma independiente
            // al estado 'data' del formulario principal.
            router.post(route('Gmedicos.importar'), {
                archivo: file
            }, {
                forceFormData: true,
                onSuccess: () => {
                    alert("¡Importación exitosa!");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                },
                onError: (err) => {
                    console.log("Errores detallados:", err);
                    alert("Error: " + (err.archivo || "No se pudo procesar el archivo"));
                }
            });
        }
    };
    // --------------------------------

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
        if (isEditing) {
            put(route('Gmedicos.update', data.id), {
                onSuccess: () => setIsFormModalOpen(false),
            });
        } else {
            post(route('Gmedicos.store'), {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    reset();
                },
            });
        }
    };

    return (
        <PanelAdmin>
            <Head title="Directorio de Médicos" />

            <div className="py-2">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800">Directorio de Médicos</h2>
                            <p className="text-slate-500 text-sm">{medicos.length} médicos registrados.</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* BOTONES DE EXCEL */}
                            <button
                                onClick={handleExport}
                                className="bg-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl font-bold text-xs hover:bg-emerald-200 transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Exportar
                            </button>

                            <button
                                onClick={handleImportClick}
                                className="bg-amber-100 text-amber-700 px-4 py-3 rounded-2xl font-bold text-xs hover:bg-amber-200 transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Importar
                            </button>

                            {/* INPUT DE ARCHIVO OCULTO */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                            />

                            <button
                                onClick={openCreateModal}
                                className="bg-[#3D3FD8] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:shadow-lg transition-all"
                            >
                                + Nuevo Médico
                            </button>
                        </div>
                    </div>

                    {/* RESTO DE LA TABLA (IGUAL QUE TU CÓDIGO) */}
                    <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-slate-400 font-bold text-xs uppercase text-center">Médico</th>
                                        <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase text-center">Especialidad</th>
                                        <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase text-center">Visitador</th>
                                        <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {medicos.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-8 py-5 text-center">
                                                <span className="block font-bold text-slate-700">{m.nombre} {m.apellido}</span>
                                                <span className="text-xs text-slate-400">
                                                    {m.tipo_documento?.nombre || 'Doc'}: {m.documento}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">
                                                    {m.especialidad || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold text-[10px] border border-blue-100">
                                                    {m.visitador ? `${m.visitador.nombre} ${m.visitador.apellido}` : 'Sin Visitador'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <button onClick={() => openEditModal(m)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            </div>

            {/* MODAL (IGUAL QUE TU CÓDIGO) */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-3xl rounded-[35px] shadow-2xl overflow-hidden">
                        <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto p-8">
                            <h3 className="text-2xl font-black text-slate-800 mb-6">{isEditing ? 'Editar' : 'Registrar'} Médico</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información Personal</h4>
                                    <input placeholder="Nombre" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-transparent focus:border-blue-400" required />
                                    <input placeholder="Apellido" value={data.apellido} onChange={e => setData('apellido', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-transparent focus:border-blue-400" required />

                                    <div className="flex gap-2">
                                        <select
                                            value={data.tipo_documento_id}
                                            onChange={e => setData('tipo_documento_id', e.target.value)}
                                            className="w-1/3 bg-slate-50 p-3 rounded-xl outline-none border border-transparent focus:border-blue-400 text-sm font-bold text-slate-600"
                                            required
                                        >
                                            <option value="" disabled>Tipo</option>
                                            {tiposDocumento.map(tipo => (
                                                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                            ))}
                                        </select>
                                        <div className="w-2/3">
                                            <input
                                                placeholder="Documento"
                                                type="number"
                                                value={data.documento}
                                                onChange={e => setData('documento', e.target.value)}
                                                className={`w-full bg-slate-50 p-3 rounded-xl outline-none border ${errors.documento ? 'border-red-500' : 'border-transparent'} focus:border-blue-400`}
                                                required
                                            />
                                            {errors.documento && (
                                                <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase animate-pulse">
                                                    {errors.documento}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información Profesional</h4>
                                    <input placeholder="Especialidad" value={data.especialidad} onChange={e => setData('especialidad', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-transparent focus:border-blue-400" />
                                    <input placeholder="Teléfono" value={data.telefono_contacto} onChange={e => setData('telefono_contacto', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-transparent focus:border-blue-400" />
                                    <input placeholder="Horario Atentación" value={data.horario_atencion} onChange={e => setData('horario_atencion', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-transparent focus:border-blue-400" />
                                </div>

                                <div className="col-span-1 md:col-span-2 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ubicación</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input placeholder="Dirección Detallada" value={data.direccion_detalles} onChange={e => setData('direccion_detalles', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-transparent focus:border-blue-400" />
                                        <input placeholder="Geolocalización" value={data.geolocalizacion} onChange={e => setData('geolocalizacion', e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-transparent focus:border-blue-400" />
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2 bg-blue-50/50 p-6 rounded-[25px] border border-blue-100">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-blue-500 uppercase ml-1">ID Visitador (Opcional)</label>
                                            <input
                                                type="number"
                                                value={data.visitador_id}
                                                onChange={e => setData('visitador_id', e.target.value)}
                                                className="w-full bg-white border border-blue-200 p-3 rounded-xl mt-1 outline-none focus:ring-2 ring-blue-200"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Inicio (Opcional)</label>
                                            <input
                                                type="date"
                                                value={data.fecha_inicio_relacion}
                                                onChange={e => setData('fecha_inicio_relacion', e.target.value)}
                                                className="w-full bg-white border border-blue-200 p-3 rounded-xl mt-1 outline-none"
                                            />
                                        </div>
                                    </div>
                                    {visitadorNombre && <p className="mt-2 text-xs font-bold text-blue-600 italic">✓ {visitadorNombre}</p>}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 text-slate-400 font-bold">Cancelar</button>
                                <button type="submit" disabled={processing} className="flex-[2] bg-[#3D3FD8] text-white py-4 rounded-2xl font-bold">
                                    {processing ? 'Guardando...' : isEditing ? 'Actualizar Médico' : 'Guardar Médico'}
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