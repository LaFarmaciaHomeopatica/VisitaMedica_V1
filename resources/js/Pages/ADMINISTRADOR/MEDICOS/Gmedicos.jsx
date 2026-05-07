import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import * as XLSX from 'xlsx';
import MedicoViewModal from "./Components/MedicoViewModal";

const Gmedicos = ({ auth, medicos = [], visitadores = [], tiposDocumento = [], categorias = [] }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const [duplicatesFound, setDuplicatesFound] = useState([]);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    // --- ESTADOS PARA BÚSQUEDA, PAGINACIÓN Y SELECCIÓN ---
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isExportConfirmModalOpen, setIsExportConfirmModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('todos'); // 'todos', 'nuevos', 'modificados', 'sin_cambios'

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    // Este estado guardará temporalmente los IDs que el usuario decida MANTENER
    const [tempSelectedIds, setTempSelectedIds] = useState([]);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedMedico, setSelectedMedico] = useState(null);


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
        categoria_id: '',
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

    // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
    const filteredMedicos = medicos.filter(m => {
        const term = searchTerm.toLowerCase();
        const categoria = m.categoria?.nombre?.toLowerCase() || "sin categoria";
        // Datos básicos del médico
        const nombreCompleto = `${m.nombre} ${m.apellido}`.toLowerCase();
        const documento = m.documento?.toString().toLowerCase() || "";

        // Especialidad (si es nula usamos 'general' para que coincida con la tabla)
        const especialidad = (m.especialidad || 'general').toLowerCase();

        // Lógica del Visitador (coincide con el texto 'Sin asignar' de tu tabla)
        const nombreVisitador = m.visitador
            ? `${m.visitador.nombre} ${m.visitador.apellido || ''}`.toLowerCase()
            : "sin asignar";

        // Retorna true si el término coincide con cualquiera de estos campos
        return (
            nombreCompleto.includes(term) ||
            documento.includes(term) ||
            especialidad.includes(term) ||
            nombreVisitador.includes(term) ||
            categoria.includes(term)
        );
    });

    // Cálculos de paginación basados en los resultados filtrados
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredMedicos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredMedicos.length / (itemsPerPage || 1));

    // --- LÓGICA DE SELECCIÓN ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const idsOnPage = currentItems.map(m => m.id);
            setSelectedIds(prev => [...new Set([...prev, ...idsOnPage])]);
        } else {
            const idsOnPage = currentItems.map(m => m.id);
            setSelectedIds(prev => prev.filter(id => !idsOnPage.includes(id)));
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // --- LÓGICA DE EXPORTACIÓN ---
    const handleOpenExportConfirm = () => {
        setIsExportConfirmModalOpen(true);
    };

    const executeExport = () => {
        // Si hay seleccionados, pasamos los IDs, si no, exporta todo (depende de tu controlador)
        const idsParam = selectedIds.length > 0 ? `?ids=${selectedIds.join(',')}` : '';
        window.location.href = route('Gmedicos.exportar') + idsParam;
        setIsExportConfirmModalOpen(false);
    };

    const handleImportClick = () => { fileInputRef.current.click(); };
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

            // --- NORMALIZACIÓN AVANZADA ---
            const headers = dataRaw[0].map(h => {
                if (!h) return '';
                return h.toString()
                    .trim()
                    .toLowerCase()
                    .normalize("NFD") // Separa tildes de las letras
                    .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes
                    .replace(/\s+/g, '_') // Convierte espacios en guiones bajos
                    .replace(/contacto$/, '_contacto'); // Parche por si la columna solo dice 'telefono'
            });

            const rows = dataRaw.slice(1).map(row => {
                let obj = {};
                headers.forEach((h, i) => {
                    if (h) {
                        // Mapeo manual para asegurar compatibilidad si el Excel varía
                        let finalKey = h;
                        if (h === 'telefono' || h === 'celular') finalKey = 'telefono_contacto';

                        if (h === 'detalles_direccion' || h === 'direccion' || h === 'dir')
                            finalKey = 'direccion_detalles';


                        obj[finalKey] = row[i];

                    }
                });
                console.log("Fila procesada:", obj); // <--- AÑADE ESTO
                return obj;
            });

            // Creamos un Set de documentos existentes para detectar duplicados rápido
            const docsExistentes = new Set(medicos.map(m => m.documento?.toString().trim()));

            const duplicados = [];
            const filasParaProcesar = rows.map(row => {
                const docValue = (row.documento || row.DOCUMENTO)?.toString().trim();

                // Buscamos si el médico ya existe en la base de datos
                const original = medicos.find(m => m.documento?.toString().trim() === docValue);
                const existe = !!original;

                if (existe) {
                    duplicados.push(row);
                }

                // COMPARACIÓN DE CAMBIOS (Para las alertas de color naranja)
                const valNombreExcel = String(row.nombre || "").trim().toUpperCase();
                const valNombreDB = String(original?.nombre || "").trim().toUpperCase();

                const valApellidoExcel = String(row.apellido || "").trim().toUpperCase();
                const valApellidoDB = String(original?.apellido || "").trim().toUpperCase();

                const valEspExcel = String(row.especialidad || "").trim().toUpperCase();
                const valEspDB = String(original?.especialidad || "").trim().toUpperCase();

                // NUEVO: Comparación de Categoría
                const valCatExcel = String(row.categoria || "").trim().toUpperCase();
                const valCatDB = String(original?.categoria?.nombre || "").trim().toUpperCase();

                const valTelExcel = String(row.telefono_contacto || "").trim().toUpperCase();
                const valTelDB = String(original?.telefono_contacto || "").trim().toUpperCase();

                const valGeolocalizacionExcel = String(row.geolocalizacion || "").trim().toUpperCase();
                const valGeolocalizacionDB = String(original?.geolocalizacion || "").trim().toUpperCase();

                const valDireccionDetallesExcel = String(row.direccion_detalles || "").trim().toUpperCase();
                const valDireccionDetallesDB = String(original?.direccion_detalles || "").trim().toUpperCase();

                const valHorarioAtencionExcel = String(row.horario_atencion || "").trim().toUpperCase();
                const valHorarioAtencionDB = String(original?.horario_atencion || "").trim().toUpperCase();

                const valVisitadorExcel = String(row.visitador_id || "").trim().toUpperCase();
                const valVisitadorDB = String(original?.visitador_id || "").trim().toUpperCase();

                const valFechaInicioRelacionExcel = String(row.fecha_inicio_relacion || "").trim().toUpperCase();
                const valFechaInicioRelacionDB = String(original?.fecha_inicio_relacion || "").trim().toUpperCase();

                const esModificado = existe && (
                    valNombreExcel !== valNombreDB ||
                    valApellidoExcel !== valApellidoDB ||
                    valEspExcel !== valEspDB ||
                    valCatExcel !== valCatDB ||
                    valTelExcel !== valTelDB ||
                    valGeolocalizacionExcel !== valGeolocalizacionDB ||
                    valDireccionDetallesExcel !== valDireccionDetallesDB ||
                    valHorarioAtencionExcel !== valHorarioAtencionDB ||
                    valVisitadorExcel !== valVisitadorDB ||
                    valFechaInicioRelacionExcel !== valFechaInicioRelacionDB
                );

                return {
                    ...row,
                    _status: !existe ? 'nuevo' : (esModificado ? 'modificado' : 'sin_cambios'),
                    _original: original // Guardamos el original para mostrar el "Actual: ..."
                };
            });

            setDuplicatesFound(duplicados);
            setPreviewData(filasParaProcesar);
            setIsPreviewModalOpen(true);
        };
        reader.readAsBinaryString(file);
    };

    const handleProcessImport = () => {
        if (duplicatesFound.length > 0) { setIsWarningModalOpen(true); }
        else { executeServerImport(); }
    };

    const executeServerImport = () => {
        if (!selectedFile) return;

        // Mostrar un loader simple para que el usuario sepa que el archivo se está subiendo
        router.post(route('Gmedicos.importar'), {
            archivo: selectedFile
        }, {
            forceFormData: true,
            onSuccess: () => {
                // Limpieza de estados
            },
            // IMPORTANTE: Evita procesar estados grandes aquí
            preserveState: false,
            preserveScroll: true
        });
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsFormModalOpen(true);
    };

    const openEditModal = (medico) => {
        console.log("1. Datos originales del médico:", medico); // <--- LOG AQUÍ
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
            categoria_id: medico.categoria_id || '',
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


    // Estados para la asignación
    const [isAssignVisitorModalOpen, setIsAssignVisitorModalOpen] = useState(false);
    const [selectedVisitorId, setSelectedVisitorId] = useState(null);


    // Lógica de filtrado en tiempo real (va antes del return)
    const filteredVisitadores = visitadores.filter(v =>
        v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.apellido.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Abrir el modal
    const handleOpenAssignVisitor = () => {
        if (selectedIds.length === 0) return;

        const medicosConConflicto = medicosSeleccionadosData.filter(m => m.visitador_id !== null);

        if (medicosConConflicto.length > 0) {
            setTempSelectedIds([...selectedIds]); // Clonamos la selección actual
            setIsReviewModalOpen(true);
        } else {
            // Si ninguno tiene visitador, vamos directo al modal que ya tenías
            setSelectedVisitorId(null);
            setSearchTerm("");
            setIsAssignVisitorModalOpen(true);
        }
    };

    // Función para quitar un médico de la lista temporal
    const toggleMedicoInTempList = (id) => {
        setTempSelectedIds(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    // Al confirmar en el modal de revisión, pasamos al de asignación
    const proceedToAssignment = () => {
        setSelectedIds(tempSelectedIds); // Actualizamos la selección global con lo que el usuario dejó
        setIsReviewModalOpen(false);
        setSelectedVisitorId(null);
        setSearchTerm("");
        setIsAssignVisitorModalOpen(true);
    };

    // Ejecutar la vinculación
    const executeAssignVisitor = () => {
        if (!selectedVisitorId) return;

        router.post(route('medicos.vincular-visitador'), {
            medico_ids: selectedIds,
            visitador_id: selectedVisitorId
        }, {
            onSuccess: () => {
                setIsAssignVisitorModalOpen(false);
                setSelectedIds([]); // Limpiar selección de la tabla
                setSelectedVisitorId(null);
                setSearchTerm(""); // Limpiar buscador
            },
            preserveScroll: true
        });
    };
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [hasVisitorAssigned, setHasVisitorAssigned] = useState(false);
    // Filtramos los objetos completos de los médicos seleccionados
    const medicosSeleccionadosData = medicos.filter(m => selectedIds.includes(m.id));

    const handleOpenDeleteModal = () => {
        if (selectedIds.length === 0) return;

        // Verificamos si al menos uno de los médicos seleccionados tiene visitador
        const selectedMedicos = medicos.filter(m => selectedIds.includes(m.id));
        const assigned = selectedMedicos.some(m => m.visitador_id !== null);

        setHasVisitorAssigned(assigned);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = () => {
        router.post(route('medicos.eliminar-masivo'), {
            ids: selectedIds
        }, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedIds([]);
            }
        });
    };

    const openViewModal = (medico) => {
        setSelectedMedico(medico);
        setIsViewModalOpen(true);
    };

    // Detecta si alguno de los médicos que se van a reasignar ya tiene un visitador
    const hasPreviousAssignment = medicosSeleccionadosData.some(m => m.visitador_id !== null);



    return (
        <PanelAdmin>
            <Head title="Directorio de Médicos" />

            <div className="w-full min-h-screen flex flex-col bg-white">
                <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 w-full">
                    {/* BARRA DE BÚSQUEDA */}
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o documento..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">

                        {/* BOTÓN ELIMINAR (NUEVO) */}
                        <button
                            onClick={handleOpenDeleteModal}
                            disabled={selectedIds.length === 0}
                            className={`${selectedIds.length > 0 ? 'bg-red-600 text-white shadow-red-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} px-4 py-2 rounded-lg font-bold text-[10px] uppercase border border-red-100 hover:opacity-90 transition-all shadow-sm flex items-center gap-2`}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar {selectedIds.length > 0 && `(${selectedIds.length})`}
                        </button>

                        <button
                            onClick={handleOpenAssignVisitor}
                            disabled={selectedIds.length === 0}
                            className={`${selectedIds.length > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} px-4 py-2 rounded-lg font-bold text-[10px] uppercase border border-indigo-100 hover:opacity-90 transition-all shadow-sm flex items-center gap-2`}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Vincular Visitador
                        </button>
                        <button
                            onClick={handleOpenExportConfirm}
                            className={`${selectedIds.length > 0 ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'} px-4 py-2 rounded-lg font-bold text-[10px] uppercase border border-emerald-100 hover:opacity-90 transition-all shadow-sm`}
                        >

                            Exportar {selectedIds.length > 0 && `(${selectedIds.length})`}
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

                {/* PAGINADOR EN LA PARTE SUPERIOR */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                            <input
                                type="checkbox"
                                checked={currentItems.length > 0 && currentItems.every(m => selectedIds.includes(m.id))}
                                onChange={handleSelectAll}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Todo</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Mostrar</span>
                            <input
                                type="number"
                                value={itemsPerPage === 0 ? '' : itemsPerPage}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setItemsPerPage(val === '' ? 0 : parseInt(val, 10));
                                    setCurrentPage(1);
                                }}
                                className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">registros</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <div className="flex items-center gap-2 px-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Página</span>
                            <input
                                type="number"
                                value={currentPage}
                                min="1"
                                max={totalPages}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val >= 1 && val <= totalPages) setCurrentPage(val);
                                }}
                                className="w-10 text-center bg-white border border-slate-200 rounded-lg text-[10px] font-black text-blue-600 p-1"
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">de {totalPages || 1}</span>
                        </div>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
                        >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-grow w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100 text-center w-10">Sel.</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Nombre Completo</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Documento</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Especialidad</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Categoría</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">Visitador</th>
                                    <th className="px-6 py-4 text-slate-500 font-bold text-[10px] uppercase text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentItems.map((m) => (
                                    <tr key={m.id} className={`${selectedIds.includes(m.id) ? 'bg-blue-50/50' : 'hover:bg-blue-50/30'} transition-colors group`}>
                                        <td className="px-6 py-3 border-r border-slate-50 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(m.id)}
                                                onChange={() => handleSelectOne(m.id)}
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
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

                                        <td className="px-6 py-3 border-r border-slate-50">
                                            {m.categoria ? (
                                                <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 uppercase">
                                                    {m.categoria.nombre}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-slate-300 italic">N/A</span>
                                            )}
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
                                            <button
                                                onClick={() => openViewModal(m)} // <--- Esta es la función que creamos antes
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                title="Ver detalles completo"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
            {/* --- MODAL CONFIRMACIÓN EXPORTACIÓN --- */}
            {
                isExportConfirmModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsExportConfirmModalOpen(false)}></div>
                        <div className="relative bg-white w-full max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase">Confirmar Exportación</h3>
                                </div>
                                <button onClick={() => setIsExportConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                            </div>

                            {/* Mensaje de validación si no hay selección */}
                            {selectedIds.length === 0 && (
                                <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center gap-3">
                                    <span className="text-xl">⚠️</span>
                                    <div>
                                        <p className="text-amber-800 text-[10px] font-black uppercase">No hay médicos seleccionados</p>
                                        <p className="text-amber-600 text-[9px] font-bold uppercase">Debes seleccionar al menos un registro en la tabla principal para exportar.</p>
                                    </div>
                                </div>
                            )}

                            {/* Contenido: Tabla (Se mantiene igual pero vacía o con placeholder si no hay selección) */}
                            <div className="flex-1 overflow-auto p-2 bg-white">
                                {selectedIds.length > 0 ? (
                                    <table className="w-full text-[9px] text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100 uppercase">
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Tipo Documento</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Documento</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Nombre</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Apellido</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Especialidad</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Categoría</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Teléfono</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Geolocalización</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Detalles Dirección</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Horario Atención</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Visitador Asignado</th>
                                                <th className="px-2 py-2 font-bold text-slate-600 border border-slate-200">Fecha Inicio Relación</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {medicos.filter(m => selectedIds.includes(m.id)).map((m, i) => (
                                                <tr key={m.id || i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.tipo_documento?.nombre || 'N/A'}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.documento}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.nombre}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.apellido}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.especialidad}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">
                                                        {m.categoria ? (
                                                            <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 uppercase">
                                                                {m.categoria.nombre}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] text-slate-300 italic">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.telefono_contacto}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap font-mono text-[8px]">{m.geolocalizacion}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.direccion_detalles}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.horario_atencion}</td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">
                                                        {m.visitador ? `${m.visitador.nombre} ${m.visitador.apellido}` : 'Sin asignar'}
                                                    </td>
                                                    <td className="px-2 py-1 border border-slate-100 text-slate-600 whitespace-nowrap">{m.fecha_inicio_relacion}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-12 text-slate-300">
                                        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Esperando selección...</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                <span className="text-slate-500 text-[10px] font-bold uppercase">
                                    {selectedIds.length} Médicos listos para descargar
                                </span>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => setIsExportConfirmModalOpen(false)}
                                        className="flex-1 md:flex-none px-6 py-2 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-200 rounded-xl transition-all"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        onClick={executeExport}
                                        disabled={selectedIds.length === 0}
                                        className={`flex-1 md:flex-none px-8 py-2 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg 
                            ${selectedIds.length === 0
                                                ? 'bg-slate-300 text-white cursor-not-allowed shadow-none'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                                            }`}
                                    >
                                        Generar Archivo .XLSX
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* --- MODAL PREVISUALIZACIÓN CORREGIDO --- */}
            {isPreviewModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsPreviewModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase">Sincronización de Médicos</h3>
                                <p className="text-[10px] text-slate-500 italic">Total: {previewData.length} registros</p>
                            </div>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-2 text-xl">✕</button>
                        </div>

                        <div className="flex bg-slate-50 border-b border-slate-200 px-4">
                            {['todos', 'nuevos', 'modificados', 'sin_cambios'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-[10px] font-bold uppercase transition-all border-b-2 ${activeTab === tab ? 'border-blue-500 text-blue-700 bg-white shadow-sm' : 'border-transparent text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-auto p-4 bg-slate-50/30">
                            <table className="w-full text-[10px] text-left border-collapse bg-white rounded-lg shadow-sm">
                                <thead className="sticky top-0 bg-slate-100 uppercase z-20 shadow-sm">
                                    <tr>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Estado</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Documento</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Nombre</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Apellido</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Especialidad</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Categoría</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Telefono</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Geolocalización</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Dirección Detalles</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Horario Atención</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Visitador</th>
                                        <th className="px-3 py-2 font-bold text-slate-600 border-b">Fecha Inicio Relación</th>
                                    </tr>
                                </thead><tbody>
                                    {previewData
                                        .filter(row => {
                                            // Calculamos el estado rápidamente para el filtro
                                            const docExcel = (row.documento || row.DOCUMENTO || row.Documento)?.toString().trim();
                                            const original = medicos.find(m => m.documento?.toString().trim() === docExcel);
                                            const existe = !!original;

                                            // Lógica de detección de cambios (idéntica a la de abajo para coherencia)
                                            const nombreCambio = existe && String(row.nombre || row.NOMBRE || "").trim().toUpperCase() !== String(original?.nombre || "").trim().toUpperCase();
                                            const apellidoCambio = existe && String(row.apellido || row.APELLIDO || "").trim().toUpperCase() !== String(original?.apellido || "").trim().toUpperCase();
                                            const espCambio = existe && String(row.especialidad || row.ESPECIALIDAD || "").trim().toUpperCase() !== String(original?.especialidad || "").trim().toUpperCase();

                                            // ... puedes simplificar esto uniendo todas las condiciones en una sola variable para el filtro
                                            const esModificado = existe && (
                                                nombreCambio || apellidoCambio || espCambio ||
                                                (existe && String(row.categoria || row.CATEGORIA || "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== String(original?.categoria?.nombre || "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) ||
                                                (existe && String(row.telefono_contacto || row.TELEFONO_CONTACTO || "").trim().toUpperCase() !== String(original?.telefono_contacto || "").trim().toUpperCase())
                                                // Agrega aquí el resto si quieres un filtro 100% estricto
                                            );

                                            if (activeTab === 'nuevos') return !existe;
                                            if (activeTab === 'modificados') return esModificado;
                                            if (activeTab === 'sin_cambios') return existe && !esModificado;
                                            return true;
                                        })
                                        .map((row, i) => {
                                            // --- AQUÍ MANTENEMOS TODO TU CÓDIGO ORIGINAL DE MAPEADO ---
                                            const docExcel = (row.documento || row.DOCUMENTO || row.Documento)?.toString().trim();
                                            const original = medicos.find(m => m.documento?.toString().trim() === docExcel);
                                            const existe = !!original;
                                            const nombreExcel = row.nombre || row.NOMBRE || "---";
                                            const apellidoExcel = row.apellido || row.APELLIDO || "---";
                                            const especialidadExcel = row.especialidad || row.ESPECIALIDAD || "---";
                                            const categoriaExcel = row.categoria || row.CATEGORIA || "---";
                                            const telExcel = row.telefono_contacto || row.TELEFONO_CONTACTO || "---";

                                            const nombreCambio = existe && String(nombreExcel).trim().toUpperCase() !== String(original?.nombre).trim().toUpperCase();
                                            const apellidoCambio = existe && String(apellidoExcel).trim().toUpperCase() !== String(original?.apellido).trim().toUpperCase();
                                            const espCambio = existe && String(especialidadExcel).trim().toUpperCase() !== String(original?.especialidad).trim().toUpperCase();
                                            const catCambio = existe && String(categoriaExcel).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== String(original?.categoria?.nombre || "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                            const telCambio = existe && String(telExcel).trim().toUpperCase() !== String(original?.telefono_contacto).trim().toUpperCase();
                                            const geolocalizacionCambio = existe && String(row.geolocalizacion || "").trim().toUpperCase() !== String(original?.geolocalizacion || "").trim().toUpperCase();
                                            const direccionDetallesCambio = existe && String(row.direccion_detalles || "").trim().toUpperCase() !== String(original?.direccion_detalles || "").trim().toUpperCase();
                                            const horarioAtencionCambio = existe && String(row.horario_atencion || "").trim().toUpperCase() !== String(original?.horario_atencion || "").trim().toUpperCase();
                                            const visitadorCambio = existe && String(row.visitador_id || "").trim().toUpperCase() !== String(original?.visitador_id || "").trim().toUpperCase();
                                            const fechaInicioRelacionCambio = existe && String(row.fecha_inicio_relacion || "").trim().toUpperCase() !== String(original?.fecha_inicio_relacion || "").trim().toUpperCase();

                                            const esModificado = existe && (nombreCambio || apellidoCambio || espCambio || catCambio || telCambio || geolocalizacionCambio || direccionDetallesCambio || horarioAtencionCambio || visitadorCambio || fechaInicioRelacionCambio);

                                            return (
                                                <tr key={i} className={`border-b border-slate-50 transition-all ${esModificado ? 'bg-orange-50' : !existe ? 'bg-emerald-50' : 'bg-white'}`}>
                                                    <td className="px-3 py-2">
                                                        {esModificado ? <span className="bg-orange-600 text-white px-2 py-1 rounded text-[8px] font-black shadow-sm">● MODIFICADO</span> : existe ? <span className="text-slate-400 font-bold text-[8px] uppercase">[ SIN CAMBIOS ]</span> : <span className="bg-emerald-600 text-white px-2 py-1 rounded text-[8px] font-black shadow-sm">● NUEVO</span>}
                                                    </td>
                                                    <td className="px-3 py-2 font-mono text-slate-500">{docExcel}</td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={nombreCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{nombreExcel}</span>
                                                            {nombreCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original.nombre}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={apellidoCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{apellidoExcel}</span>
                                                            {apellidoCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original.apellido}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={espCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{especialidadExcel}</span>
                                                            {espCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original.especialidad}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={catCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{categoriaExcel}</span>
                                                            {catCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original?.categoria?.nombre || 'N/A'}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={telCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{telExcel}</span>
                                                            {telCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original?.telefono_contacto || 'N/A'}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={geolocalizacionCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{String(row.geolocalizacion || "").trim()}</span>
                                                            {geolocalizacionCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original?.geolocalizacion || 'N/A'}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={direccionDetallesCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{String(row.direccion_detalles || "").trim()}</span>
                                                            {direccionDetallesCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original?.direccion_detalles || 'N/A'}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={horarioAtencionCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{String(row.horario_atencion || "").trim()}</span>
                                                            {horarioAtencionCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original?.horario_atencion || 'N/A'}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={visitadorCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{String(row.visitador_id || "").trim()}</span>
                                                            {visitadorCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original?.visitador?.nombre || 'N/A'}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex flex-col">
                                                            <span className={fechaInicioRelacionCambio ? 'font-black text-orange-700' : 'text-slate-700'}>{String(row.fecha_inicio_relacion || "").trim()}</span>
                                                            {fechaInicioRelacionCambio && <span className="text-[8px] text-orange-400 italic">Actual: {original?.fecha_inicio_relacion || 'N/A'}</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 bg-white border-t flex gap-3">
                            <button onClick={() => setIsPreviewModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl">Cancelar</button>
                            <button onClick={handleProcessImport} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg">Confirmar Importación</button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- MODAL DE ADVERTENCIA (DUPLICADOS) --- */}
            {
                isWarningModalOpen && (
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
                )
            }
            {/* --- MODAL FORMULARIO --- */}
            {
                isFormModalOpen && (
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
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Categoría del Médico</label>
                                        <select
                                            value={data.categoria_id}
                                            onChange={e => setData('categoria_id', e.target.value)}
                                            className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Sin Categoría / Seleccionar...</option>
                                            {categorias.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                            ))}
                                        </select>
                                        {errors.categoria_id && <div className="text-red-500 text-[9px] mt-1 font-bold">{errors.categoria_id}</div>}
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
                )
            }



            {/*modal de vinculación de medicos a visitadores*/}

            {/* Modal para asignar visitador */}
            {isAssignVisitorModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop con Blur */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => setIsAssignVisitorModalOpen(false)}
                    ></div>

                    <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">

                        {/* Cabecera */}
                        <div className="p-8 pb-4 text-center">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Asignar Visitador</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                Vas a vincular {selectedIds.length} médicos seleccionados
                            </p>
                        </div>

                        {/* Buscador */}
                        <div className="px-6 pb-4">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="BUSCAR POR NOMBRE O APELLIDO..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                                />
                                <div className="absolute right-4 top-3.5 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* NUEVA ALERTA DE ADVERTENCIA */}
                        {hasPreviousAssignment && (
                            <div className="px-6 pb-4">
                                <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="bg-amber-500 text-white p-1.5 rounded-lg shadow-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-tight">
                                            Atención: Vínculo existente detectado
                                        </p>
                                        <p className="text-[9px] text-amber-700 font-bold mt-1 leading-tight uppercase">
                                            Uno o más médicos ya tienen un visitador asignado. Cualquier cambio sin tener en cuenta el vínculo actual podría generar errores en el historial.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Listado con scroll */}
                        <div className="max-h-[250px] overflow-y-auto px-6 py-2 space-y-2 bg-slate-50/50">
                            {filteredVisitadores.length > 0 ? (
                                filteredVisitadores.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVisitorId(v.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 
                                ${selectedVisitorId === v.id
                                                ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100 scale-[1.01]'
                                                : 'bg-white border-transparent hover:border-slate-200 shadow-sm'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors
                                    ${selectedVisitorId === v.id ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {v.nombre[0]}{v.apellido[0]}
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-bold ${selectedVisitorId === v.id ? 'text-white' : 'text-slate-700'}`}>
                                                    {v.nombre} {v.apellido}
                                                </p>
                                                <p className={`text-[9px] uppercase font-black tracking-widest ${selectedVisitorId === v.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                    ID: {v.id}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedVisitorId === v.id && (
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="py-10 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No se encontraron resultados</p>
                                </div>
                            )}
                        </div>

                        {/* Acciones Finales */}
                        <div className="p-6 bg-white space-y-3">
                            <button
                                disabled={!selectedVisitorId}
                                onClick={executeAssignVisitor}
                                className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all
                        ${selectedVisitorId
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                            >
                                Confirmar Asignación
                            </button>
                            <button
                                onClick={() => {
                                    setIsAssignVisitorModalOpen(false);
                                    setSearchTerm("");
                                }}
                                className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )} {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 flex flex-col border border-slate-100">

                        {/* Icono de Alerta */}
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 uppercase text-center">¿Confirmar eliminación?</h3>

                        {/* LISTA DE MÉDICOS Y VISITADORES */}
                        <div className="mt-6 max-h-[200px] overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                            {medicosSeleccionadosData.map((medico) => (
                                <div key={medico.id} className="flex flex-col p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-700">
                                        {medico.nombre} {medico.apellido}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Visitador:</span>
                                        {medico.visitador ? (
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                {medico.visitador.nombre} {medico.visitador.apellido}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium text-slate-400 italic">Sin asignar</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 text-center">
                            {hasVisitorAssigned && (
                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl inline-block w-full">
                                    <p className="text-[10px] text-amber-700 font-black uppercase flex items-center justify-center gap-2">
                                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                        Atención: Hay visitadores vinculados
                                    </p>
                                </div>
                            )}

                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                                "Recuerda que el médico tiene un historial"
                            </p>
                        </div>

                        {/* Acciones */}
                        <div className="mt-8 flex flex-col gap-3">
                            <button
                                onClick={executeDelete}
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all"
                            >
                                Eliminar {selectedIds.length} Registro(s)
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isReviewModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100">

                        <div className="p-8 pb-4 text-center">
                            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Revisar Selección</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                Selecciona los médicos que realmente deseas reasignar
                            </p>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto px-6 py-2 space-y-2 bg-slate-50/50">
                            {medicosSeleccionadosData.map((medico) => {
                                const hasVisitor = medico.visitador_id !== null;
                                const isSelected = tempSelectedIds.includes(medico.id);

                                return (
                                    <div
                                        key={medico.id}
                                        onClick={() => toggleMedicoInTempList(medico.id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-white border-indigo-500 shadow-sm' : 'bg-slate-100 border-transparent opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                                                {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{medico.nombre} {medico.apellido}</p>
                                                {hasVisitor ? (
                                                    <p className="text-[9px] font-black text-amber-600 uppercase">
                                                        Vínculo actual: {medico.visitador?.nombre} {medico.visitador?.apellido}
                                                    </p>
                                                ) : (
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sin visitador previo</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-white space-y-3">
                            <button
                                disabled={tempSelectedIds.length === 0}
                                onClick={proceedToAssignment}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
                            >
                                Continuar con {tempSelectedIds.length} Médicos
                            </button>
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 transition-colors"
                            >
                                Cancelar todo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MedicoViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                medico={selectedMedico}
            />

        </PanelAdmin >
    );
};

export default Gmedicos;