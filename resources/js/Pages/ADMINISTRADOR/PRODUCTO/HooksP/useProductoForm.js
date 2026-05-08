import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export const useProductoForm = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: null,
        nombre: '',
        laboratorio: '',
        codigo: '',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (prod) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: prod.id,
            nombre: prod.nombre,
            laboratorio: prod.laboratorio || '',
            codigo: prod.codigo,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gproductos.update', { producto: data.id }), {
                onSuccess: () => setIsModalOpen(false),
                preserveScroll: true,
            });
        } else {
            post(route('Gproductos.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
                preserveScroll: true,
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