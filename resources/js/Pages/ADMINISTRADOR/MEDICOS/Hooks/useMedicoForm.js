import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';

export const useMedicoForm = (visitadores) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [visitadorNombre, setVisitadorNombre] = useState('');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: '', nombre: '', apellido: '', documento: '',
        especialidad: '', geolocalizacion: '', direccion_detalles: '',
        telefono_contacto: '', horario_atencion: '', visitador_id: '',
        fecha_inicio_relacion: '', tipo_documento_id: '', categoria_id: '',
    });

    useEffect(() => {
        if (data.visitador_id && visitadores.length > 0) {
            const v = visitadores.find(v => v.id.toString() === data.visitador_id.toString());
            setVisitadorNombre(v ? `${v.nombre} ${v.apellido}` : 'No encontrado');
        } else {
            setVisitadorNombre('');
        }
    }, [data.visitador_id, visitadores]);

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
            horario_atencion: medico.horario_atencion || '',
            visitador_id: medico.visitador_id || '',
            tipo_documento_id: medico.tipo_documento_id || '',
            categoria_id: medico.categoria_id || '',
            fecha_inicio_relacion: medico.fecha_inicio_relacion
                ? medico.fecha_inicio_relacion.substring(0, 10)
                : '',
        });
        setIsEditing(true);
        setIsFormModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gmedicos.update', data.id), { onSuccess: () => setIsFormModalOpen(false) });
        } else {
            post(route('Gmedicos.store'), { onSuccess: () => { setIsFormModalOpen(false); reset(); } });
        }
    };

    return {
        data, setData, processing, errors,
        isFormModalOpen, setIsFormModalOpen,
        isEditing,
        visitadorNombre,
        openCreateModal,
        openEditModal,
        handleSubmit,
    };
};