import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export const useUsuarioForm = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        id: null,
        username: '',
        password: '',
        id_rol: '',
        estado: 'habilitado',
    });

    const openCreateModal = () => {
        reset();
        clearErrors();
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        clearErrors();
        setIsEditing(true);
        setData({
            id: user.id,
            username: user.username,
            password: '',
            id_rol: user.id_rol,
            estado: user.estado,
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (userId) => {
        setData('id', userId);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('Gusuarios.update', { id: data.id }), {
                onSuccess: () => setIsModalOpen(false),
                preserveScroll: true,
            });
        } else {
            post(route('Gusuarios.store'), {
                onSuccess: () => { setIsModalOpen(false); reset(); },
                preserveScroll: true,
            });
        }
    };

    const handleConfirmDelete = () => {
        destroy(route('Gusuarios.destroy', { id: data.id }), {
            onSuccess: () => setIsDeleteModalOpen(false),
            preserveScroll: true,
        });
    };

    return {
        data, setData, processing, errors,
        isModalOpen, setIsModalOpen,
        isDeleteModalOpen, setIsDeleteModalOpen,
        isEditing,
        openCreateModal, openEditModal, openDeleteModal,
        handleSubmit, handleConfirmDelete,
    };
};