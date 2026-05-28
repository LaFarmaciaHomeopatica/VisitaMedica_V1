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

    const formNueva = useForm({
        medico_id: '',
        fecha_programada: format(fechaSeleccionada, "yyyy-MM-dd'T'HH:mm"), // 👈 usa el día seleccionado
        fecha_realizada: '',   // 👈 nuevo campo
        muestras: '',
        estado: 'programada', // 👈 fijo, no lo toca el usuario
        comentario_muestra: '',
        comentarios: '',


    });
    const handleSeleccionarFecha = (dia) => {
        setFechaSeleccionada(dia);
        const fechaFormato = format(dia, "yyyy-MM-dd") + 'T08:00';
        formNueva.setData({
            ...formNueva.data,
            fecha_programada: fechaFormato,
            fecha_realizada: fechaFormato, // 👈
        });
    };

    const formReporte = useForm({
        estado: '',
        comentarios: '',
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const medicoId = params.get('medico_id');
        if (medicoId) {
            const hoy = new Date();
            const fechaFormato = format(hoy, "yyyy-MM-dd") + 'T08:00';
            formNueva.setData({
                ...formNueva.data,
                medico_id: medicoId,
                fecha_programada: fechaFormato,
                fecha_realizada: fechaFormato,
            });
            setModalNuevoAbierto(true);

            // Limpiar la URL para evitar re-aperturas no deseadas
            const url = new URL(window.location.href);
            url.searchParams.delete('medico_id');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }, []);

    const visitas = useMemo(() => {
        return (visitasDB || []).map(v => ({
            ...v,
            fecha: parseISO(v.fecha_programada),
            doctor: v.medico?.nombre || 'Médico no asignado'
        }));
    }, [visitasDB]);

    const visitasFiltradas = useMemo(() => {
        const query = busqueda.toLowerCase();
        return visitas.filter(v =>
            v.doctor.toLowerCase().includes(query) ||
            v.estado.toLowerCase().includes(query)
        );
    }, [busqueda, visitas]);

    const visitasDelDia = visitasFiltradas.filter(v => isSameDay(v.fecha, fechaSeleccionada));

    const abrirGestion = (visita) => {
        setVisitaSeleccionada(visita);
        formReporte.setData('estado', visita.estado);
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
        visitaSeleccionada,
        formNueva, formReporte,
        visitas, visitasDelDia, diasAMostrar,
        abrirGestion, navegarSiguiente, navegarAnterior, handleSeleccionarFecha, abrirModalNuevo, // 👈 para abrir
        setModalNuevoAbierto, // se mantiene para cerrar
    };
};

