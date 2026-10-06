import { useState, useRef, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import Swal from 'sweetalert2';

const pad = (n) => String(n).padStart(2, '0');

export const COLORES_ESTADO = {
    programado: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
    realizado: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
    cancelado: 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 line-through opacity-70',
};

export const ETIQUETA_ESTADO = {
    programado: 'Programado',
    realizado: 'Realizado',
    cancelado: 'Cancelado',
};

export const ETIQUETAS_PREDEFINIDAS = [];

export const normalizarEtiquetas = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) {
        return tags
            .map((item) => {
                if (typeof item === 'object' && item !== null) {
                    return item.nombre || item.name || item.tag || '';
                }
                return String(item ?? '').trim();
            })
            .filter((t) => typeof t === 'string' && t.trim().length > 0);
    }
    if (typeof tags === 'string') {
        try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) {
                return normalizarEtiquetas(parsed);
            }
            return [parsed].filter(Boolean);
        } catch {
            return tags.split(',').map((s) => s.trim()).filter(Boolean);
        }
    }
    return [];
};

// Date -> 'YYYY-MM-DDTHH:mm' (formato input datetime-local)
export const aInput = (d) => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}`;
};

// 'YYYY-MM-DD HH:mm' (servidor) -> Date local
export const parseFecha = (s) => (s ? new Date(String(s).replace(' ', 'T')) : null);

// 'YYYY-MM-DD HH:mm' (servidor) -> 'YYYY-MM-DDTHH:mm'
export const servidorAInput = (s) => (s ? String(s).replace(' ', 'T').slice(0, 16) : '');

// 'YYYY-MM-DDTHH:mm' -> 'YYYY-MM-DD HH:mm:00'
export const inputAServidor = (s) => (s ? `${s.replace('T', ' ')}:00`.slice(0, 19) : null);

// Estado inicial para formulario de Visitas
const formVisitaVacio = (dia) => {
    const inicio = dia ? new Date(dia) : new Date();
    inicio.setHours(9, 0, 0, 0);

    return {
        id: null,
        medico_id: '',
        visitador_id: '',
        fecha_programada: aInput(inicio),
        fecha_realizada: '',
        estado: 'sin programar',
        muestras: '',
        comentario_muestra: '',
        comentarios: '',
    };
};

// Estado inicial para formulario de Eventos/Actividades
const formEventoVacio = (dia) => {
    const inicio = dia ? new Date(dia) : new Date();
    inicio.setHours(9, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setHours(10, 0, 0, 0);

    return {
        todos: false,
        visitadores_ids: [],
        visitador_id: '',
        nombre_evento: '',
        comentario: '',
        ubicacion: '',
        latitud: '',
        longitud: '',
        fecha_programada: aInput(inicio),
        fecha_fin_programada: aInput(fin),
        fecha_realizada: '',
        fecha_fin_real: '',
        estado: 'programado',
        etiquetas: [],
    };
};

export const useEventoForm = () => {
    // 1. Estado de Modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tipoModal, setTipoModal] = useState('visita'); // 'visita' | 'actividad'
    const [isEditing, setIsEditing] = useState(false);

    // Modales de detalle
    const [selectedVisita, setSelectedVisita] = useState(null);
    const [isVisitaDetalleOpen, setIsVisitaDetalleOpen] = useState(false);

    const [selectedEvento, setSelectedEvento] = useState(null);
    const [isEventoDetalleOpen, setIsEventoDetalleOpen] = useState(false);

    const [deleting, setDeleting] = useState(false);
    const [aviso, setAviso] = useState(null);
    const timer = useRef(null);

    // 2. Forms de Inertia
    const visitaForm = useForm(formVisitaVacio());
    const eventoForm = useForm(formEventoVacio());

    // 3. Médicos filtrados por visitador para el form de visita
    const [medicosFiltradosPorVisitador, setMedicosFiltradosPorVisitador] = useState([]);
    const [loadingMedicos, setLoadingMedicos] = useState(false);

    useEffect(() => {
        if (!visitaForm.data.visitador_id) {
            setMedicosFiltradosPorVisitador([]);
            return;
        }

        let cancelado = false;
        setLoadingMedicos(true);

        fetch(route('Gvisitas.medicosPorVisitador', visitaForm.data.visitador_id))
            .then((res) => res.json())
            .then((medicos) => {
                if (!cancelado) setMedicosFiltradosPorVisitador(medicos || []);
            })
            .catch(() => {
                if (!cancelado) setMedicosFiltradosPorVisitador([]);
            })
            .finally(() => {
                if (!cancelado) setLoadingMedicos(false);
            });

        return () => {
            cancelado = true;
        };
    }, [visitaForm.data.visitador_id]);

    const mostrarAviso = (tipo, texto) => {
        setAviso({ tipo, texto });
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setAviso(null), 5000);
    };

    // Apertura para Crear (desde un día o botón general)
    const openCreate = (dia) => {
        const fechaBase = dia instanceof Date ? dia : undefined;

        visitaForm.clearErrors();
        visitaForm.setData(formVisitaVacio(fechaBase));

        eventoForm.clearErrors();
        eventoForm.setData(formEventoVacio(fechaBase));

        setIsEditing(false);
        setSelectedVisita(null);
        setSelectedEvento(null);
        setIsModalOpen(true);
    };

    // Apertura para Editar Visita
    const openEditVisita = (visita) => {
        setIsVisitaDetalleOpen(false);
        visitaForm.clearErrors();
        visitaForm.setData({
            id: visita.id,
            medico_id: visita.medico_id || '',
            visitador_id: visita.visitador_id || '',
            fecha_programada: servidorAInput(visita.fecha_programada),
            fecha_realizada: servidorAInput(visita.fecha_realizada),
            estado: visita.estado || 'sin programar',
            muestras: visita.muestras || '',
            comentario_muestra: visita.comentario_muestra || '',
            comentarios: visita.comentarios || '',
        });
        setTipoModal('visita');
        setIsEditing(true);
        setSelectedVisita(visita);
        setIsModalOpen(true);
    };

    // Apertura para Editar Evento / Actividad
    const openEditEvento = (evento) => {
        setIsEventoDetalleOpen(false);
        eventoForm.clearErrors();
        eventoForm.setData({
            todos: false,
            visitadores_ids: [],
            visitador_id: String(evento.visitador_id || ''),
            nombre_evento: evento.nombre_evento || '',
            comentario: evento.comentario || '',
            ubicacion: evento.ubicacion || '',
            latitud: evento.latitud ?? '',
            longitud: evento.longitud ?? '',
            fecha_programada: servidorAInput(evento.fecha_programada),
            fecha_fin_programada: servidorAInput(evento.fecha_fin_programada),
            fecha_realizada: servidorAInput(evento.fecha_realizada),
            fecha_fin_real: servidorAInput(evento.fecha_fin_real),
            estado: evento.estado || 'programado',
            etiquetas: normalizarEtiquetas(evento.etiquetas),
        });
        setTipoModal('actividad');
        setIsEditing(true);
        setSelectedEvento(evento);
        setIsModalOpen(true);
    };

    // Apertura de modales de detalle
    const openVisitaDetalle = (visita) => {
        setSelectedVisita(visita);
        setIsVisitaDetalleOpen(true);
    };

    const openEventoDetalle = (evento) => {
        setSelectedEvento(evento);
        setIsEventoDetalleOpen(true);
    };

    // Manejador de cambio de fecha en Visita
    const handleVisitaFechaChange = (val) => {
        let nuevaFechaRealizada = visitaForm.data.fecha_realizada;
        if (val) {
            const fechaSolo = val.split('T')[0];
            if (visitaForm.data.fecha_realizada) {
                const hora = visitaForm.data.fecha_realizada.split('T')[1] || '00:00';
                nuevaFechaRealizada = `${fechaSolo}T${hora}`;
            } else {
                nuevaFechaRealizada = val;
            }
        }
        visitaForm.setData((prev) => ({
            ...prev,
            fecha_programada: val,
            fecha_realizada: nuevaFechaRealizada,
        }));
    };

    // Manejador de cambio de médico en Visita
    const handleVisitaMedicoChange = (nuevoMedicoId) => {
        visitaForm.setData('medico_id', nuevoMedicoId);
    };

    // Submit de Visita
    const handleVisitaSubmit = (e) => {
        if (e) e.preventDefault();
        const editando = isEditing && selectedVisita?.id;

        if (editando) {
            visitaForm.put(route('Gvisitas.update', selectedVisita.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    visitaForm.reset();
                    mostrarAviso('ok', 'Visita médica actualizada correctamente.');
                },
                onError: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de validación',
                        text: 'Verifique los campos obligatorios del formulario de visita.',
                        confirmButtonColor: '#3D3FD8',
                    });
                },
            });
        } else {
            visitaForm.post(route('Gvisitas.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    visitaForm.reset();
                    mostrarAviso('ok', 'Visita médica programada correctamente.');
                },
                onError: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de validación',
                        text: 'Verifique los campos obligatorios del formulario de visita.',
                        confirmButtonColor: '#3D3FD8',
                    });
                },
            });
        }
    };

    // Submit de Evento / Actividad
    const handleEventoSubmit = (e) => {
        if (e) e.preventDefault();
        const editando = isEditing && selectedEvento?.id;
        const paraTodos = eventoForm.data.todos;

        eventoForm.transform((d) => {
            const base = {
                nombre_evento: d.nombre_evento,
                comentario: d.comentario || null,
                ubicacion: d.ubicacion || null,
                latitud: d.latitud === '' ? null : d.latitud,
                longitud: d.longitud === '' ? null : d.longitud,
                fecha_programada: inputAServidor(d.fecha_programada),
                fecha_fin_programada: inputAServidor(d.fecha_fin_programada),
                estado: d.estado,
                etiquetas: normalizarEtiquetas(d.etiquetas),
            };

            return editando
                ? {
                      ...base,
                      visitador_id: d.visitador_id,
                      fecha_realizada: inputAServidor(d.fecha_realizada),
                      fecha_fin_real: inputAServidor(d.fecha_fin_real),
                  }
                : {
                      ...base,
                      todos: d.todos,
                      visitadores_ids: d.todos ? [] : d.visitadores_ids,
                  };
        });

        const opciones = {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                eventoForm.reset();
                mostrarAviso(
                    'ok',
                    editando
                        ? 'Actividad actualizada.'
                        : paraTodos
                        ? 'Actividad asignada a todos los visitadores.'
                        : 'Actividad asignada correctamente.'
                );
            },
            onError: () => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    text: 'Verifique los campos del formulario de actividad.',
                    confirmButtonColor: '#4f46e5',
                });
            },
        };

        if (editando) {
            eventoForm.put(route('Geventos.update', selectedEvento.id), opciones);
        } else {
            eventoForm.post(route('Geventos.store'), opciones);
        }
    };

    // Eliminar Visita
    const handleDeleteVisita = (visita) => {
        if (!visita) return;
        setDeleting(true);
        router.delete(route('Gvisitas.destroy', visita.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsVisitaDetalleOpen(false);
                setSelectedVisita(null);
                mostrarAviso('ok', 'Visita eliminada correctamente.');
            },
            onFinish: () => setDeleting(false),
        });
    };

    // Eliminar Evento / Actividad
    const handleDeleteEvento = (evento) => {
        if (!evento) return;
        setDeleting(true);
        router.delete(route('Geventos.destroy', evento.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEventoDetalleOpen(false);
                setSelectedEvento(null);
                mostrarAviso('ok', 'Actividad eliminada correctamente.');
            },
            onFinish: () => setDeleting(false),
        });
    };

    // Drag & Drop: Mover visita o actividad a otro día en el calendario
    const handleItemMove = (item, deltaDias, tipo) => {
        const desplazar = (valor) => {
            const d = parseFecha(valor);
            if (!d) return null;
            d.setDate(d.getDate() + deltaDias);
            return inputAServidor(aInput(d));
        };

        if (tipo === 'visita') {
            router.put(
                route('Gvisitas.update', item.id),
                {
                    visitador_id: item.visitador_id,
                    medico_id: item.medico_id,
                    fecha_programada: desplazar(item.fecha_programada),
                    fecha_realizada: item.fecha_realizada ? desplazar(item.fecha_realizada) : null,
                    estado: item.estado,
                    muestras: item.muestras || '',
                    comentario_muestra: item.comentario_muestra || '',
                    comentarios: item.comentarios || '',
                },
                {
                    preserveScroll: true,
                    onSuccess: () => mostrarAviso('ok', 'Visita médica reprogramada.'),
                    onError: (errs) => mostrarAviso('error', Object.values(errs)[0] || 'No se pudo reprogramar la visita.'),
                }
            );
        } else {
            router.put(
                route('Geventos.update', item.id),
                {
                    visitador_id: item.visitador_id,
                    nombre_evento: item.nombre_evento,
                    comentario: item.comentario,
                    ubicacion: item.ubicacion,
                    latitud: item.latitud,
                    longitud: item.longitud,
                    fecha_programada: desplazar(item.fecha_programada),
                    fecha_fin_programada: desplazar(item.fecha_fin_programada),
                    fecha_realizada: item.fecha_realizada ? desplazar(item.fecha_realizada) : null,
                    fecha_fin_real: item.fecha_fin_real ? desplazar(item.fecha_fin_real) : null,
                    estado: item.estado,
                    etiquetas: normalizarEtiquetas(item.etiquetas),
                },
                {
                    preserveScroll: true,
                    onSuccess: () => mostrarAviso('ok', 'Actividad reprogramada.'),
                    onError: (errs) => mostrarAviso('error', Object.values(errs)[0] || 'No se pudo reprogramar la actividad.'),
                }
            );
        }
    };

    return {
        // Modal principal de creación/edición
        isModalOpen,
        setIsModalOpen,
        tipoModal,
        setTipoModal,
        isEditing,

        // Visita Form Props
        visitaData: visitaForm.data,
        setVisitaData: visitaForm.setData,
        visitaErrors: visitaForm.errors,
        visitaProcessing: visitaForm.processing,
        onVisitaSubmit: handleVisitaSubmit,
        medicosFiltradosPorVisitador,
        loadingMedicos,
        onVisitaFechaChange: handleVisitaFechaChange,
        onVisitaMedicoChange: handleVisitaMedicoChange,

        // Actividad Form Props
        eventoData: eventoForm.data,
        setEventoData: eventoForm.setData,
        eventoErrors: eventoForm.errors,
        eventoProcessing: eventoForm.processing,
        onEventoSubmit: handleEventoSubmit,

        // Detalle de Visita
        selectedVisita,
        isVisitaDetalleOpen,
        setIsVisitaDetalleOpen,
        openVisitaDetalle,
        openEditVisita,
        handleDeleteVisita,

        // Detalle de Actividad
        selectedEvento,
        isEventoDetalleOpen,
        setIsEventoDetalleOpen,
        openEventoDetalle,
        openEditEvento,
        handleDeleteEvento,

        // Acciones generales
        openCreate,
        handleItemMove,
        deleting,
        aviso,
        setAviso,
    };
};