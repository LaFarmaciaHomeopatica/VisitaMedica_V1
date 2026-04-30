import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import PanelAdmin from "./PanelAdmin";
import {
    FaUserPlus, FaMagnifyingGlass, FaChevronLeft, FaChevronRight, FaTrashCan, FaCircleExclamation
} from 'react-icons/fa6';

const GmedicosTemporales = ({
    auth,
    medicosTemporales = [],
    categorias = [],
    visitadores = [],
    tiposDocumento = []
}) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMedico, setSelectedMedico] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // --- FORMULARIO PARA PROMOCIÓN (Hacia tabla Medicos Oficial) ---
    const { data, setData, post, processing, errors, reset } = useForm({
        documento: '',
        nombre: '',
        apellido: '',
        especialidad: '',
        geolocalizacion: '',
        categoria_id: '',
        direccion_detalles: '',
        telefono_contacto: '',
        horario_atencion: '',
        visitador_id: '',
        fecha_inicio_relacion: new Date().toISOString().split('T')[0],
        tipo_documento_id: '',
    });

    // --- FILTRADO ---
    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return medicosTemporales.filter(m =>
            m.nombre_referencia?.toLowerCase().includes(term) ||
            m.documento?.toString().includes(term)
        );
    }, [medicosTemporales, searchTerm]);

    // --- PAGINACIÓN ---
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentItems = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage;
        return filteredItems.slice(lastIndex - itemsPerPage, lastIndex);
    }, [filteredItems, currentPage, itemsPerPage]);

    // --- ABRIR MODAL DE VALIDACIÓN ---
    const openPromoteModal = (m) => {
        setSelectedMedico(m);
        // Pre-cargamos lo que sabemos del Excel
        reset();
        setData({
            ...data,
            documento: m.documento,
            nombre: m.nombre_referencia.split(' ')[0] || '', // Intento de separar nombre
            apellido: m.nombre_referencia.split(' ').slice(1).join(' ') || '', // Intento de separar apellido
        });
        setIsModalOpen(true);
    };

    const handlePromote = (e) => {
        e.preventDefault();
        // Usamos el nombre exacto de la ruta definida en web.php
        post(route('GmedicosTemporales.promover', { id: selectedMedico.id }), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
            onError: (err) => {
                console.error("Errores de validación:", err);
            }
        });
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Validación de Médicos Nuevos" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                {/* CABECERA */}
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 px-6 py-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-2xl">
                            <FaCircleExclamation className="text-amber-600 w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Bandeja de Validación</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Médicos detectados en importaciones que no existen en el sistema</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md w-full relative">
                        <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="BUSCAR POR DOCUMENTO O NOMBRE..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                    </div>
                </div>

                {/* TABLA DE TEMPORALES */}
                <div className="flex-grow overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Documento</th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Nombre en Excel</th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Origen</th>
                                <th className="px-6 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentItems.map((m) => (
                                <tr key={m.id} className="hover:bg-amber-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-black text-slate-700">{m.documento}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-black text-slate-700 uppercase">{m.nombre_referencia}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase">{m.origen_datos}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => openPromoteModal(m)}
                                            className="bg-[#3D3FD8] text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
                                        >
                                            <FaUserPlus /> Completar Perfil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN (Igual que Gtransacciones) */}
                <div className="px-6 py-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Página {currentPage} de {totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-3 bg-slate-50 rounded-xl disabled:opacity-30"><FaChevronLeft className="w-3 h-3" /></button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="p-3 bg-slate-50 rounded-xl disabled:opacity-30"><FaChevronRight className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>

            {/* MODAL DE COMPLETAR PERFIL (OFICIALIZAR) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <form onSubmit={handlePromote} className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl p-10 overflow-y-auto max-h-[90vh]">

                        <div className="mb-8 text-center">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Oficializar Médico</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estás convirtiendo un registro temporal en un médico oficial del sistema</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* SECCIÓN IDENTIDAD */}
                            <div className="md:col-span-1 space-y-4">
                                <label className="text-[10px] font-black text-[#3D3FD8] uppercase tracking-widest border-b border-blue-100 block pb-2">Identidad</label>

                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo Doc.</label>
                                    <select value={data.tipo_documento_id} onChange={e => setData('tipo_documento_id', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-[11px] font-bold">
                                        <option value="">SELECCIONE...</option>
                                        {tiposDocumento.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                    {errors.tipo_documento_id && <p className="text-red-500 text-[8px] uppercase font-black mt-1">{errors.tipo_documento_id}</p>}
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Documento</label>
                                    <input type="text" value={data.documento} readOnly className="w-full bg-slate-100 border-none rounded-xl text-[11px] font-bold text-slate-500 cursor-not-allowed" />
                                </div>
                            </div>

                            {/* SECCIÓN DATOS PERSONALES */}
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                <label className="col-span-2 text-[10px] font-black text-[#3D3FD8] uppercase tracking-widest border-b border-blue-100 block pb-2">Información Profesional</label>

                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nombre(s)</label>
                                    <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-[11px] font-bold uppercase" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Apellido(s)</label>
                                    <input type="text" value={data.apellido} onChange={e => setData('apellido', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-[11px] font-bold uppercase" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Especialidad</label>
                                    <input type="text" value={data.especialidad} onChange={e => setData('especialidad', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl text-[11px] font-bold uppercase" placeholder="Ej: CARDIOLOGÍA" />
                                </div>
                            </div>

                            {/* SECCIÓN CONTACTO Y UBICACIÓN */}
                            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-[30px]">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Categoría</label>
                                    <select value={data.categoria_id} onChange={e => setData('categoria_id', e.target.value)} className="w-full border-none rounded-xl text-[11px] font-bold">
                                        <option value="">---</option>
                                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Visitador Asignado</label>
                                    <select value={data.visitador_id} onChange={e => setData('visitador_id', e.target.value)} className="w-full border-none rounded-xl text-[11px] font-bold">
                                        <option value="">---</option>
                                        {visitadores.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Dirección Detalles</label>
                                    <input type="text" value={data.direccion_detalles} onChange={e => setData('direccion_detalles', e.target.value)} className="w-full border-none rounded-xl text-[11px] font-bold uppercase" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Teléfono</label>
                                    <input type="text" value={data.telefono_contacto} onChange={e => setData('telefono_contacto', e.target.value)} className="w-full border-none rounded-xl text-[11px] font-bold" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Horario</label>
                                    <input type="text" value={data.horario_atencion} onChange={e => setData('horario_atencion', e.target.value)} className="w-full border-none rounded-xl text-[11px] font-bold" placeholder="L-V 8am-5pm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Geolocalización (Link o Coords)</label>
                                    <input type="text" value={data.geolocalizacion} onChange={e => setData('geolocalizacion', e.target.value)} className="w-full border-none rounded-xl text-[11px] font-bold" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <button type="submit" disabled={processing} className="flex-1 bg-[#3D3FD8] text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">
                                {processing ? 'PROCESANDO...' : 'GUARDAR Y ACTIVAR MÉDICO'}
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Descartar</button>
                        </div>
                    </form>
                </div>
            )}
        </PanelAdmin>
    );
};

export default GmedicosTemporales;