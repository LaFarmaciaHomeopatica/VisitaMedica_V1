import { useState, useMemo, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export const useVisitaForm = (visitas) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedVisita, setSelectedVisita] = useState(null);

    // Médicos del visitador seleccionado, cargados bajo demanda (ya no viene
    // un array global de 5000+ médicos desde el controlador)
    const [medicosFiltradosPorVisitador, setMedicosFiltradosPorVisitador] = useState([]);
    const [loadingMedicos, setLoadingMedicos] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: null,
        medico_id: '',
        visitador_id: '',
        fecha_programada: '',
        fecha_realizada: '',
        estado: 'sin programar',
        muestras: '',
        comentario_muestra: '',
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

    // Cargar médicos del visitador seleccionado bajo demanda
    useEffect(() => {
        if (!data.visitador_id) {
            setMedicosFiltradosPorVisitador([]);
            return;
        }

        let cancelado = false;
        setLoadingMedicos(true);

        fetch(route('Gvisitas.medicosPorVisitador', data.visitador_id))
            .then(res => res.json())
            .then(medicos => {
                if (!cancelado) setMedicosFiltradosPorVisitador(medicos);
            })
            .catch(() => {
                if (!cancelado) setMedicosFiltradosPorVisitador([]);
            })
            .finally(() => {
                if (!cancelado) setLoadingMedicos(false);
            });

        return () => { cancelado = true; };
    }, [data.visitador_id]);

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

    const openCreateModal = () => {
        clearErrors();
        setIsEditing(false);
        reset();
        setData({
            ...data,
            id: null,
            medico_id: '',
            visitador_id: '',
            fecha_programada: '',
            fecha_realizada: '',
            estado: 'sin programar',
            muestras: '',
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
            muestras: visita.muestras || '',
            comentario_muestra: visita.comentario_muestra || '',
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
        if (isEditing) {
            put(route('Gvisitas.update', data.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    Swal.fire({ icon: 'success', title: 'ACTUALIZADO', timer: 1500, showConfirmButton: false });
                },
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
        loadingMedicos,
        handleFechaProgramadaChange,
        handleMedicoChange,
        openCreateModal, openEditModal,
        openViewModal, openDeleteModal,
        handleSubmit, handleConfirmDelete,
    };
};