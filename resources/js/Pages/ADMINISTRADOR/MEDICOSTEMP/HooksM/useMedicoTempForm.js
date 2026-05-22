import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export const useMedicoTempForm = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMedico, setSelectedMedico] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        tipo_documento_id:     '',
        documento:             '',
        nombre:                '',
        apellido:              '',
        especialidad:          '',
        geolocalizacion:       '',
        categoria_id:          '',
        direccion_detalles:    '',
        telefono_contacto:     '',
        horario_atencion:      '',
        visitador_id:          '',
        fecha_inicio_relacion: new Date().toISOString().split('T')[0],
    });

    const openPromoteModal = (m) => {
        setSelectedMedico(m);

        const partes   = (m.nombre_referencia ?? '').trim().split(/\s+/);
        const nombre   = m.nombre   ?? partes[0]               ?? '';
        const apellido = m.apellido ?? partes.slice(1).join(' ') ?? '';

        setData({
            tipo_documento_id:     m.tipo_documento_id   ?? '',
            documento:             m.documento            ?? '',
            nombre,
            apellido,
            especialidad:          m.especialidad         ?? '',
            geolocalizacion:       m.geolocalizacion      ?? '',
            categoria_id:          m.categoria_id         ?? '',
            direccion_detalles:    m.direccion_detalles   ?? '',
            telefono_contacto:     m.telefono_contacto    ?? '',
            horario_atencion:      m.horario_atencion     ?? '',
            visitador_id:          m.visitador_id         ?? '',
            fecha_inicio_relacion: m.fecha_inicio_relacion
                ?? new Date().toISOString().split('T')[0],
        });

        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMedico(null);
        reset();
    };

    const handlePromote = (e) => {
        e.preventDefault();
        if (!selectedMedico) return;

        post(route('GmedicosTemporales.promover', { id: selectedMedico.id }), {
            onSuccess: closeModal,
        });
    };

    return {
        data, setData, processing, errors,
        isModalOpen,
        selectedMedico,
        openPromoteModal,
        closeModal,
        handlePromote,
    };
};