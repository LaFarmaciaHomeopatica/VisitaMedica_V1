import { useState, useMemo, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameDay, addMonths, subMonths, startOfWeek, endOfWeek,
    addWeeks, subWeeks, parseISO,
} from 'date-fns';

export const ETIQUETAS_PREDEFINIDAS = [
    'Capacitación',
    'Congreso',
    'Reunión de Ciclo',
    'Lanzamiento',
    'Comercial',
    'Importante',
    'VIP',
];

export const normalizarEtiquetas = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) {
        return tags
            .map((item) => (typeof item === 'object' && item !== null ? (item.nombre || item.tag || '') : String(item)))
            .filter((t) => typeof t === 'string' && t.trim().length > 0);
    }
    if (typeof tags === 'string') {
        try {
            const parsed = JSON.parse(tags);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => (typeof item === 'object' && item !== null ? (item.nombre || item.tag || '') : String(item)))
                    .filter((t) => typeof t === 'string' && t.trim().length > 0);
            }
            return [parsed].filter(Boolean);
        } catch {
            return tags.split(',').map((s) => s.trim()).filter(Boolean);
        }
    }
    return [];
};

export const useMisVisitas = (visitasDB = [], eventosDB = [], doctores = []) => {
    const [mesActual, setMesActual] = useState(new Date());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [vistaSemanal, setVistaSemanal] = useState(false);
    
    // Modales
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [tipoNuevoModal, setTipoNuevoModal] = useState('visita');

    const [modalGestionVisitaAbierto, setModalGestionVisitaAbierto] = useState(false);
    const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);

    const [modalGestionEventoAbierto, setModalGestionEventoAbierto] = useState(false);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);

    const [busqueda, setBusqueda] = useState('');

    // Formulario para Crear Nuevas Visitas
    const formNuevaVisita = useForm({
        medico_id: '',
        fecha_programada: format(fechaSeleccionada, "yyyy-MM-dd'T'08:00"), 
        fecha_realizada: format(fechaSeleccionada, "yyyy-MM-dd'T'09:00"),   
        muestras: '',
        estado: 'programada', 
        comentario_muestra: '',
        comentarios: '',
    });

    // Formulario para Crear Nuevos Eventos / Actividades
    const formNuevoEvento = useForm({
        nombre_evento: '',
        fecha_programada: format(fechaSeleccionada, "yyyy-MM-dd'T'08:00"),
        fecha_fin_programada: format(fechaSeleccionada, "yyyy-MM-dd'T'09:00"),
        ubicacion: '',
        latitud: '',
        longitud: '',
        comentario: '',
        etiquetas: [],
    });

    // Formulario para Reportar/Gestionar Visita
    const formReporteVisita = useForm({
        estado: '',
        comentarios: '',
        muestras: '',
        comentario_muestra: '',
        fecha_programada: '',
        fecha_realizada: '',
        medico_id: '',
    });

    // Formulario para Reportar/Gestionar Evento / Actividad
    const formReporteEvento = useForm({
        nombre_evento: '',
        estado: '',
        comentario: '',
        ubicacion: '',
        latitud: '',
        longitud: '',
        fecha_programada: '',
        fecha_fin_programada: '',
        fecha_realizada: '',
        fecha_fin_real: '',
        etiquetas: [],
    });

    const handleSeleccionarFecha = (dia) => {
        setFechaSeleccionada(dia);
        const fechaInicio = format(dia, 'yyyy-MM-dd') + 'T08:00';
        const fechaFin = format(dia, 'yyyy-MM-dd') + 'T09:00';

        formNuevaVisita.setData({
            ...formNuevaVisita.data,
            fecha_programada: fechaInicio,
            fecha_realizada: fechaFin,
        });

        formNuevoEvento.setData({
            ...formNuevoEvento.data,
            fecha_programada: fechaInicio,
            fecha_fin_programada: fechaFin,
        });
    };

    // Procesar visitas de DB
    const visitas = useMemo(() => {
        return (visitasDB || []).map((v) => ({
            ...v,
            tipo: 'visita',
            fecha: v.fecha_programada ? parseISO(v.fecha_programada.replace(' ', 'T')) : new Date(),
            doctor: v.medico ? `${v.medico.nombre} ${v.medico.apellido || ''}`.trim() : 'Médico no asignado',
        }));
    }, [visitasDB]);

    // Procesar eventos de DB
    const eventos = useMemo(() => {
        return (eventosDB || []).map((e) => ({
            ...e,
            tipo: 'actividad',
            fecha: e.fecha_programada ? parseISO(e.fecha_programada.replace(' ', 'T')) : new Date(),
            titulo: e.nombre_evento || 'Actividad',
            etiquetas: normalizarEtiquetas(e.etiquetas),
        }));
    }, [eventosDB]);

    const itemsAgenda = useMemo(() => {
        const combined = [...visitas, ...eventos];
        combined.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
        return combined;
    }, [visitas, eventos]);

    // Apertura de modal de gestión de Evento / Actividad
    const abrirGestionEvento = (evento) => {
        setEventoSeleccionado(evento);
        formReporteEvento.setData({
            nombre_evento: evento.nombre_evento || '',
            estado: evento.estado || 'programado',
            comentario: evento.comentario || '',
            ubicacion: evento.ubicacion || '',
            latitud: evento.latitud ?? '',
            longitud: evento.longitud ?? '',
            fecha_programada: evento.fecha_programada?.slice(0, 16).replace(' ', 'T') || '',
            fecha_fin_programada: evento.fecha_fin_programada?.slice(0, 16).replace(' ', 'T') || '',
            fecha_realizada: evento.fecha_realizada?.slice(0, 16).replace(' ', 'T') || '',
            fecha_fin_real: evento.fecha_fin_real?.slice(0, 16).replace(' ', 'T') || '',
            etiquetas: normalizarEtiquetas(evento.etiquetas),
        });
        setModalGestionEventoAbierto(true);
    };

    // Apertura de modal de gestión de Visita
    const abrirGestionVisita = (visita) => {
        setVisitaSeleccionada(visita);
        formReporteVisita.setData({
            estado: visita.estado || '',
            comentarios: visita.comentarios || '',
            muestras: visita.muestras || '',
            comentario_muestra: visita.comentario_muestra || '',
            fecha_programada: visita.fecha_programada?.slice(0, 16).replace(' ', 'T') || '',
            fecha_realizada: visita.fecha_realizada?.slice(0, 16).replace(' ', 'T') || '',
            medico_id: visita.medico_id || '',
        });
        setModalGestionVisitaAbierto(true);
    };

    // 🎯 INTERCEPTOR CLAVE: CAPTURA LA URL AL LLEGAR A MISVISITAS
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const actividadIdFromUrl = params.get('actividad_id');
        const visitaIdFromUrl = params.get('visita_id');

        // 1. Caso Actividades / Eventos
        if (actividadIdFromUrl) {
            const lista = eventos.length > 0 ? eventos : (eventosDB || []);
            if (lista.length > 0) {
                const eventoACompletar = lista.find((e) => String(e.id) === String(actividadIdFromUrl));
                if (eventoACompletar) {
                    const fechaRaw = eventoACompletar.fecha_programada || eventoACompletar.fecha;
                    if (fechaRaw) {
                        const f = typeof fechaRaw === 'string' ? parseISO(fechaRaw.replace(' ', 'T')) : fechaRaw;
                        if (!isNaN(f)) {
                            setFechaSeleccionada(f);
                            setMesActual(f);
                        }
                    }
                    abrirGestionEvento(eventoACompletar);

                    // Limpia los query params sin recargar la página
                    const url = new URL(window.location.href);
                    url.searchParams.delete('actividad_id');
                    url.searchParams.delete('tab');
                    window.history.replaceState({}, '', url.pathname + url.search);
                }
            }
        }

        // 2. Caso Visitas
        if (visitaIdFromUrl) {
            const listaVisitas = visitas.length > 0 ? visitas : (visitasDB || []);
            if (listaVisitas.length > 0) {
                const visitaACompletar = listaVisitas.find((v) => String(v.id) === String(visitaIdFromUrl));
                if (visitaACompletar) {
                    const f = visitaACompletar.fecha;
                    if (f && !isNaN(f)) {
                        setFechaSeleccionada(f);
                        setMesActual(f);
                    }
                    abrirGestionVisita(visitaACompletar);

                    const url = new URL(window.location.href);
                    url.searchParams.delete('medico_id');
                    url.searchParams.delete('visita_id');
                    window.history.replaceState({}, '', url.pathname + url.search);
                }
            }
        }
    }, [eventos, eventosDB, visitas, visitasDB]);

    // Filtrar agenda por búsqueda
    const itemsFiltrados = useMemo(() => {
        const query = busqueda.toLowerCase().trim();
        if (!query) return itemsAgenda;

        return itemsAgenda.filter((item) => {
            if (item.tipo === 'visita') {
                const nombreDoctor = item.doctor?.toLowerCase() || '';
                const especialidad = item.medico?.especialidad?.toLowerCase() || '';
                const estado = item.estado ? item.estado.toLowerCase() : '';
                return nombreDoctor.includes(query) || especialidad.includes(query) || estado.includes(query);
            } else {
                const titulo = item.nombre_evento?.toLowerCase() || '';
                const comentario = item.comentario?.toLowerCase() || '';
                const estado = item.estado ? item.estado.toLowerCase() : '';
                const etiquetasStr = (item.etiquetas || []).join(' ').toLowerCase();
                return titulo.includes(query) || comentario.includes(query) || estado.includes(query) || etiquetasStr.includes(query);
            }
        });
    }, [busqueda, itemsAgenda]);

    const itemsDelDia = useMemo(() => {
        return itemsFiltrados.filter((item) => isSameDay(item.fecha, fechaSeleccionada));
    }, [itemsFiltrados, fechaSeleccionada]);

    const navegarSiguiente = () =>
        vistaSemanal ? setMesActual(addWeeks(mesActual, 1)) : setMesActual(addMonths(mesActual, 1));
    const navegarAnterior = () =>
        vistaSemanal ? setMesActual(subWeeks(mesActual, 1)) : setMesActual(subMonths(mesActual, 1));

    const diasAMostrar = useMemo(() => {
        const opciones = { weekStartsOn: 1 };
        const inicio = vistaSemanal ? startOfWeek(mesActual, opciones) : startOfMonth(mesActual);
        const fin = vistaSemanal ? endOfWeek(mesActual, opciones) : endOfMonth(mesActual);
        return eachDayOfInterval({ start: inicio, end: fin });
    }, [mesActual, vistaSemanal]);

    const abrirModalNuevo = (tipo = 'visita') => {
        const fechaInicio = format(fechaSeleccionada, 'yyyy-MM-dd') + 'T08:00';
        const fechaFin = format(fechaSeleccionada, 'yyyy-MM-dd') + 'T09:00';

        formNuevaVisita.setData({
            ...formNuevaVisita.data,
            fecha_programada: fechaInicio,
            fecha_realizada: fechaFin,
        });

        formNuevoEvento.setData({
            ...formNuevoEvento.data,
            fecha_programada: fechaInicio,
            fecha_fin_programada: fechaFin,
        });

        setTipoNuevoModal(tipo);
        setModalNuevoAbierto(true);
    };

    return {
        mesActual,
        fechaSeleccionada,
        setFechaSeleccionada,
        vistaSemanal,
        setVistaSemanal,
        modalNuevoAbierto,
        setModalNuevoAbierto,
        tipoNuevoModal,
        setTipoNuevoModal,
        modalGestionVisitaAbierto,
        setModalGestionVisitaAbierto,
        modalGestionEventoAbierto,
        setModalGestionEventoAbierto,
        visitaSeleccionada,
        setVisitaSeleccionada,
        eventoSeleccionado,
        setEventoSeleccionado,
        busqueda,
        setBusqueda,
        formNuevaVisita,
        formNuevoEvento,
        formReporteVisita,
        formReporteEvento,
        visitas,
        eventos,
        itemsAgenda,
        itemsDelDia,
        diasAMostrar,
        abrirGestionVisita,
        abrirGestionEvento,
        navegarSiguiente,
        navegarAnterior,
        handleSeleccionarFecha,
        abrirModalNuevo,
    };
};