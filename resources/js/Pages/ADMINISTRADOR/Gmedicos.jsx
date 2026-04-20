import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PanelAdmin from './PanelAdmin';

const Gmedicos = ({ auth, medicos = [], visitadores = [] }) => {
    // --- ESTADOS DE MODALES ---
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMedico, setSelectedMedico] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // --- MANEJO DE FORMULARIO CON INERTIA ---
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: '',
        nombre: '',
        apellido: '',
        documento: '',
        especialidad: '',
        geolocalizacion: '',
        direccion_detalles: '',
        telefono_contacto: '',
        visitador_id: '',
        tipo_documento_id: 1, // Por defecto 1 o el que manejes
    });

    const [visitadorNombre, setVisitadorNombre] = useState('');

    // --- LÓGICA DE BÚSQUEDA DE VISITADOR ---
    useEffect(() => {
        if (data.visitador_id && visitadores.length > 0) {
            const v = visitadores.find(v => v.id.toString() === data.visitador_id.toString());
            setVisitadorNombre(v ? `${v.nombre} ${v.apellido}` : '');
        } else {
            setVisitadorNombre('');
        }
    }, [data.visitador_id, visitadores]);

    // --- MANEJADORES ---
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
            visitador_id: medico.visitador_id,
            tipo_documento_id: medico.tipo_documento_id,
        });
        setIsEditing(true);
        setIsFormModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('medicos.update', data.id), {
                onSuccess: () => setIsFormModalOpen(false),
            });
        } else {
            post(route('medicos.store'), {
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
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800">Directorio de Médicos</h2>
                            <p className="text-slate-500 text-sm">
                                {medicos.length} médicos encontrados en el sistema.
                            </p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="bg-[#3D3FD8] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:shadow-lg transition-all"
                        >
                            + Nuevo Médico
                        </button>
                    </div>

                    {/* Tabla de Datos */}
                    <div className="bg-white rounded-[35px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-slate-400 font-bold text-xs uppercase text-center">Médico</th>
                                        <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase text-center">Especialidad</th>
                                        <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase text-center">Visitador Asignado</th>
                                        <th className="px-6 py-5 text-slate-400 font-bold text-xs uppercase text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {medicos.length > 0 ? (
                                        medicos.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-8 py-5 text-center">
                                                    <span className="block font-bold text-slate-700">{m.nombre} {m.apellido}</span>
                                                    <span className="text-xs text-slate-400">ID: {m.documento}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">
                                                        {m.especialidad || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold text-[10px] border border-blue-100">
                                                        {/* Protección con encadenamiento opcional ?. */}
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
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                        <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-slate-400 font-medium">No se detectaron datos. Revisa la conexión con el controlador.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Formulario */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFormModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[35px] shadow-2xl p-8">
                        <form onSubmit={handleSubmit}>
                            <h3 className="text-2xl font-black text-slate-800 mb-6">{isEditing ? 'Editar' : 'Nuevo'} Médico</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Nombre" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="bg-slate-50 p-3 rounded-xl outline-none" required />
                                <input placeholder="Apellido" value={data.apellido} onChange={e => setData('apellido', e.target.value)} className="bg-slate-50 p-3 rounded-xl outline-none" required />
                                <div className="col-span-2 bg-blue-50 p-4 rounded-2xl">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase">ID Visitador Responsable</label>
                                    <input type="number" value={data.visitador_id} onChange={e => setData('visitador_id', e.target.value)} className="w-full bg-white border border-blue-100 p-2 rounded-lg" required />
                                    {visitadorNombre && <p className="text-xs text-blue-600 mt-2 font-bold italic">Confirmado: {visitadorNombre}</p>}
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 text-slate-400 font-bold">Cancelar</button>
                                <button type="submit" disabled={processing} className="flex-[2] bg-[#3D3FD8] text-white py-4 rounded-2xl font-bold">
                                    {processing ? 'Guardando...' : 'Guardar Médico'}
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