import { useState, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameDay, addMonths, subMonths, startOfWeek, endOfWeek,
    addWeeks, subWeeks, parseISO
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
        fecha_programada: format(new Date(), 'yyyy-MM-dd'),
        hora: '08:00',
        modalidad: 'PRESENCIAL',
        tipo: 'VISITA'
    });

    const formReporte = useForm({
        estado: '',
        comentarios: '',
    });

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

    return {
        mesActual, fechaSeleccionada, setFechaSeleccionada,
        vistaSemanal, setVistaSemanal,
        modalNuevoAbierto, setModalNuevoAbierto,
        modalGestionAbierto, setModalGestionAbierto,
        busqueda, setBusqueda,
        visitaSeleccionada,
        formNueva, formReporte,
        visitas, visitasDelDia, diasAMostrar,
        abrirGestion, navegarSiguiente, navegarAnterior
    };
};

