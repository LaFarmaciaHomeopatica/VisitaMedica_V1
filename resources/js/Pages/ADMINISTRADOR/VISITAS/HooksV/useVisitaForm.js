import { useState, useMemo, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export const useVisitaForm = (visitas, medicos) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedVisita, setSelectedVisita] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: null,
        medico_id: '',
        visitador_id: '',
        fecha_programada: '',
        fecha_realizada: '',
        estado: 'sin programar',
        muestras: '', // <--- AGREGAR ESTO
        comentario_muestra: '', // <--- AGREGAR ESTO
        comentarios: '',
    });

    // Alerta de errores de validación
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'ERROR DE VALIDACIÓN',
                text: 'Por favor verifique los campos marcados en rojo.',
                confirmButtonColor: '#3D3FD8',
            });
        }
    }, [errors]);

    // Médicos filtrados según el visitador seleccionado
    const medicosFiltradosPorVisitador = useMemo(() => {
        if (!data.visitador_id) return [];
        return medicos.filter(m => String(m.visitador_id) === String(data.visitador_id));
    }, [data.visitador_id, medicos]);

    // Sincronización de fecha_realizada al cambiar fecha_programada
    const handleFechaProgramadaChange = (val) => {
        let nuevaFechaRealizada = data.fecha_realizada;
        if (val) {
            const fechaSolo = val.split('T')[0];
            if (data.fecha_realizada) {
                const hora = data.fecha_realizada.split('T')[1] || '00:00';
                nuevaFechaRealizada = `${fechaSolo}T${hora}`;
            } else {
                nuevaFechaRealizada = val;
            }
        }
        setData(prev => ({
            ...prev,
            fecha_programada: val,
            fecha_realizada: nuevaFechaRealizada,
        }));
    };

    // Alerta de médico con visita duplicada
    const handleMedicoChange = (nuevoMedicoId) => {
        setData('medico_id', nuevoMedicoId);
        const medicoYaAsignado = visitas.find(v =>
            v.medico_id == nuevoMedicoId &&
            v.estado === 'programada' &&
            v.id !== data.id
        );
        if (medicoYaAsignado) {
            Swal.fire({
                icon: 'info',
                title: 'AVISO',
                text: 'ESTE MÉDICO YA TIENE UNA VISITA PROGRAMADA PENDIENTE.',
                confirmButtonColor: '#3D3FD8',
            });
        }
    };

    // Acciones
    // En useVisitaForm.js, asegúrate de que esto esté así:
    const openCreateModal = () => {
        clearErrors();
        setIsEditing(false);
        reset(); // Esto resetea a los valores iniciales del useForm

        // Aseguramos que los campos de productos estén vacíos por si acaso
        setData({
            ...data, // Mantenemos la estructura
            id: null,
            medico_id: '',
            visitador_id: '',
            fecha_programada: '',
            fecha_realizada: '',
            estado: 'sin programar',
            muestras: '', // <--- Vital que esté vacío al crear
            comentario_muestra: '',
            comentarios: '',
        });
        setIsModalOpen(true);
    };
    const openEditModal = (visita) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: visita.id,
            medico_id: visita.medico_id,
            visitador_id: visita.visitador_id,
            fecha_programada: visita.fecha_programada
                ? visita.fecha_programada.replace(' ', 'T').substring(0, 16)
                : '',
            fecha_realizada: visita.fecha_realizada
                ? visita.fecha_realizada.replace(' ', 'T').substring(0, 16)
                : '',
            estado: visita.estado,
            muestras: visita.muestras || '', // <--- AGREGAR ESTO
            comentario_muestra: visita.comentario_muestra || '', // <--- AGREGAR ESTO
            comentarios: visita.comentarios || '',
        });
        setIsModalOpen(true);
    };
    const openViewModal = (visita) => {
        setSelectedVisita(visita);
        setIsViewModalOpen(true);
    };

    const openDeleteModal = (visitaId) => {
        setData('id', visitaId);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Opcional: Log para depurar si el valor de muestras está llegando antes de enviar
        // console.log("Enviando muestras:", data.muestras);

        if (isEditing) {
            put(route('Gvisitas.update', data.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    Swal.fire({ icon: 'success', title: 'ACTUALIZADO', timer: 1500, showConfirmButton: false });
                },
                // Agrega esto para ver errores en consola si algo falla en el servidor
                onError: (err) => console.error("Error al actualizar:", err)
            });
        } else {
            post(route('Gvisitas.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    Swal.fire({ icon: 'success', title: 'GUARDADO', timer: 1500, showConfirmButton: false });
                },
                onError: (err) => console.error("Error al guardar:", err)
            });
        }

    };

    const handleConfirmDelete = () => {
        destroy(route('Gvisitas.destroy', data.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                Swal.fire({ icon: 'success', title: 'ELIMINADO', timer: 1500, showConfirmButton: false });
            },
        });
    };

    return {
        data, setData, processing, errors,
        isModalOpen, setIsModalOpen,
        isDeleteModalOpen, setIsDeleteModalOpen,
        isViewModalOpen, setIsViewModalOpen,
        isEditing,
        selectedVisita,
        medicosFiltradosPorVisitador,
        handleFechaProgramadaChange,
        handleMedicoChange,
        openCreateModal, openEditModal,
        openViewModal, openDeleteModal,
        handleSubmit, handleConfirmDelete,
    };



};