import { useState, useMemo, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameDay, addMonths, subMonths, startOfWeek, endOfWeek,
    addWeeks, subWeeks, parseISO,
} from 'date-fns';

export const useMisVisitas = (visitasDB, doctores) => {
    const [mesActual, setMesActual] = useState(new Date());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [vistaSemanal, setVistaSemanal] = useState(false);
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [modalGestionAbierto, setModalGestionAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);

    // Formulario para Crear Nuevas Visitas
    const formNueva = useForm({
        medico_id: '',
        fecha_programada: format(fechaSeleccionada, "yyyy-MM-dd'T'HH:mm"), 
        fecha_realizada: '',   
        muestras: '',
        estado: 'programada', 
        comentario_muestra: '',
        comentarios: '',
    });

    // Formulario para Reportar/Gestionar Visita
    const formReporte = useForm({
        estado: '',
        comentarios: '',
        muestras: '',
        comentario_muestra: '',
        fecha_programada: '',
        fecha_realizada: '',
        medico_id: '',
    });

    const handleSeleccionarFecha = (dia) => {
        setFechaSeleccionada(dia);
        const fechaFormato = format(dia, "yyyy-MM-dd") + 'T08:00';
        formNueva.setData({
            ...formNueva.data,
            fecha_programada: fechaFormato,
            fecha_realizada: fechaFormato, 
        });
    };

    // Procesar visitas provenientes de la Base de Datos
    const visitas = useMemo(() => {
        return (visitasDB || []).map(v => ({
            ...v,
            fecha: parseISO(v.fecha_programada),
            doctor: v.medico ? `${v.medico.nombre} ${v.medico.apellido}` : 'Médico no asignado'
        }));
    }, [visitasDB]);

    // 1️⃣ EFFECT ORIGINAL: Captura cuando vienes desde el botón de "Agendar" (pasa médico)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const medicoId = params.get('medico_id');
        const visitaId = params.get('visita_id'); 
        
        if (medicoId && !visitaId) {
            const hoy = new Date();
            const fechaFormato = format(hoy, "yyyy-MM-dd") + 'T08:00';
            formNueva.setData({
                ...formNueva.data,
                medico_id: medicoId,
                fecha_programada: fechaFormato,
                fecha_realizada: fechaFormato,
            });
            setModalNuevoAbierto(true);

            const url = new URL(window.location.href);
            url.searchParams.delete('medico_id');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, []);

    // 2️⃣ ✨ EFFECT OPTIMIZADO: Intercepta el botón "Ejecutar" y enfoca el calendario
useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const visitaIdFromUrl = params.get('visita_id');

    if (visitaIdFromUrl && visitas.length > 0) {
        const visitaACompletar = visitas.find(v => String(v.id) === String(visitaIdFromUrl));
        
        if (visitaACompletar) {
            // 📍 NUEVO: Extraemos la fecha real de la visita (objeto Date que ya generó tu useMemo)
            const fechaVisita = visitaACompletar.fecha; 

            // 📍 NUEVO: Movemos el foco visual del calendario a ese día y mes exactos
            setFechaSeleccionada(fechaVisita);
            setMesActual(fechaVisita);

            // Seteamos los estados del modal
            setVisitaSeleccionada(visitaACompletar);
            setModalGestionAbierto(true);

            // Sincronizamos el formReporte
            formReporte.setData({
                estado: visitaACompletar.estado || '',
                comentarios: visitaACompletar.comentarios || '',
                muestras: visitaACompletar.muestras || '',
                comentario_muestra: visitaACompletar.comentario_muestra || '',
                fecha_programada: visitaACompletar.fecha_programada?.slice(0, 16) || '',
                fecha_realizada: visitaACompletar.fecha_realizada?.slice(0, 16) || '',
                medico_id: visitaACompletar.medico_id || '',
            });

            // Limpieza estricta de la URL
            const url = new URL(window.location.href);
            url.searchParams.delete('medico_id');
            url.searchParams.delete('visita_id');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }
}, [visitasDB]);

   const visitasFiltradas = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    
    // Si no hay nada escrito, devolvemos todo de golpe
    if (!query) return visitas;

    return visitas.filter(v => {
        // 1. Obtener el nombre del doctor que realmente se muestra
        const nombreDoctor = v.medico 
            ? `${v.medico.nombre} ${v.medico.apellido}`.toLowerCase()
            : 'médico desconocido médico no asignado'; // Incluimos ambas variantes por seguridad

        // 2. Obtener la especialidad (si existe en tu relación)
        const especialidad = v.medico?.especialidad 
            ? v.medico.especialidad.toLowerCase() 
            : '';

        // 3. Obtener el estado
        const estado = v.estado ? v.estado.toLowerCase() : '';

        // El registro pasa si coincide con el doctor, la especialidad o el estado
        return nombreDoctor.includes(query) || 
               especialidad.includes(query) || 
               estado.includes(query);
    });
}, [busqueda, visitas]);

    const visitasDelDia = visitasFiltradas.filter(v => isSameDay(v.fecha, fechaSeleccionada));

    const abrirGestion = (visita) => {
        setVisitaSeleccionada(visita);
        formReporte.setData({
            estado: visita.estado || '',
            comentarios: visita.comentarios || '',
            muestras: visita.muestras || '',
            comentario_muestra: visita.comentario_muestra || '',
            fecha_programada: visita.fecha_programada?.slice(0, 16) || '',
            fecha_realizada: visita.fecha_realizada?.slice(0, 16) || '',
            medico_id: visita.medico_id || '',
        });
        setModalGestionAbierto(true);
    };

    const navegarSiguiente = () => vistaSemanal ? setMesActual(addWeeks(mesActual, 1)) : setMesActual(addMonths(mesActual, 1));
    const navegarAnterior = () => vistaSemanal ? setMesActual(subWeeks(mesActual, 1)) : setMesActual(subMonths(mesActual, 1));

    const diasAMostrar = useMemo(() => {
        const opciones = { weekStartsOn: 1 };
        const inicio = vistaSemanal ? startOfWeek(mesActual, opciones) : startOfMonth(mesActual);
        const fin = vistaSemanal ? endOfWeek(mesActual, opciones) : endOfMonth(mesActual);
        return eachDayOfInterval({ start: inicio, end: fin });
    }, [mesActual, vistaSemanal]);

    const abrirModalNuevo = () => {
        const fechaFormato = format(fechaSeleccionada, "yyyy-MM-dd") + 'T08:00';
        formNueva.setData({
            ...formNueva.data,
            fecha_programada: fechaFormato,
            fecha_realizada: fechaFormato,
        });
        setModalNuevoAbierto(true);
    };

    return {
        mesActual, fechaSeleccionada, setFechaSeleccionada,
        vistaSemanal, setVistaSemanal,
        modalNuevoAbierto, setModalNuevoAbierto,
        modalGestionAbierto, setModalGestionAbierto,
        busqueda, setBusqueda,
        visitaSeleccionada, setVisitaSeleccionada,
        formNueva, formReporte,
        visitas, visitasDelDia, diasAMostrar,
        abrirGestion, navegarSiguiente, navegarAnterior, handleSeleccionarFecha, abrirModalNuevo,
    };
};