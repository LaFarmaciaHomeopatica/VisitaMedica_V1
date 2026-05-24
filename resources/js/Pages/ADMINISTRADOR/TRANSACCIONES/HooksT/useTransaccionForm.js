import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export const useTransaccionForm = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: null,
        medico_documento: '',
        producto_codigo: '',
        unidades_compradas: 0,
        unidades_formuladas: 0,
        valor_comprado: 0,
        valor_formulado: 0,
        fecha: '',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (t) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: t.id,
            medico_documento: t.medico_documento || '',
            producto_codigo: t.producto_codigo || '',
            unidades_compradas: t.unidades_compradas || 0,
            unidades_formuladas: t.unidades_formuladas || 0,
            valor_comprado: t.valor_comprado || 0,
            valor_formulado: t.valor_formulado || 0,
            fecha: t.fecha || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gtransacciones.update', { transaccion: data.id }), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        } else {
            post(route('Gtransacciones.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
            });
        }
    };

    return {
        data, setData, processing, errors,
        isModalOpen, setIsModalOpen,
        isEditing,
        openCreateModal, openEditModal,
        handleSubmit,
    };
};