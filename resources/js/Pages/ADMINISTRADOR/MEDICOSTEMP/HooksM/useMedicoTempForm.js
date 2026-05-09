import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export const useMedicoTempForm = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMedico, setSelectedMedico] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        documento: '',
        nombre: '',
        apellido: '',
        especialidad: '',
        geolocalizacion: '',
        categoria_id: '',
        direccion_detalles: '',
        telefono_contacto: '',
        horario_atencion: '',
        visitador_id: '',
        fecha_inicio_relacion: new Date().toISOString().split('T')[0],
        tipo_documento_id: '',
    });

    const openPromoteModal = (m) => {
        setSelectedMedico(m);
        reset();
        setData({
            documento: m.documento,
            nombre: m.nombre_referencia.split(' ')[0] || '',
            apellido: m.nombre_referencia.split(' ').slice(1).join(' ') || '',
            especialidad: '',
            geolocalizacion: '',
            categoria_id: '',
            direccion_detalles: '',
            telefono_contacto: '',
            horario_atencion: '',
            visitador_id: '',
            fecha_inicio_relacion: new Date().toISOString().split('T')[0],
            tipo_documento_id: '',
        });
        setIsModalOpen(true);
    };

    const handlePromote = (e) => {
        e.preventDefault();
        post(route('GmedicosTemporales.promover', { id: selectedMedico.id }), {
            onSuccess: () => { setIsModalOpen(false); reset(); },
        });
    };

    return {
        data, setData, processing, errors,
        isModalOpen, setIsModalOpen,
        selectedMedico,
        openPromoteModal,
        handlePromote,
    };
};