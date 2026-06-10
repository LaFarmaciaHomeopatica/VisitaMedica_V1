// hooks/useVisitadores.js
import { useState, useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export const useVisitadores = (visitadores = []) => {
    // --- ESTADOS DE INTERFAZ ---
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userName, setUserName] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- ESTADOS DE PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50); // Valor por defecto

    const form = useForm({
        id: null,
        usuario_id: '',
        nombre: '',
        apellido: '',
        documento: '',
        tipo_documento_id: '',
        zona_id: '',
        estado: 'Habilitado',
    });

    // --- EFECTO: BUSCAR USUARIO POR ID (DEBOUNCE) ---
    useEffect(() => {
        const buscarUsuario = async () => {
            if (form.data.usuario_id && !isEditing) {
                setIsSearching(true);
                try {
                    const response = await axios.get(`/usuarios/buscar/${form.data.usuario_id}`);
                    setUserName(response.data.nombre || response.data.username || 'Usuario encontrado');
                } catch (error) {
                    setUserName('Usuario no encontrado');
                } finally {
                    setIsSearching(false);
                }
            } else if (!form.data.usuario_id && !isEditing) {
                setUserName('');
            }
        };
        const timer = setTimeout(buscarUsuario, 500);
        return () => clearTimeout(timer);
    }, [form.data.usuario_id, isEditing]);

    // --- LÓGICA DE FILTRADO ---
    const allFiltered = useMemo(() => {
        return visitadores.filter(v =>
            `${v.nombre} ${v.apellido} ${v.documento} ${v.user?.username || ''}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    }, [visitadores, searchTerm]);

    // --- LÓGICA DE PAGINACIÓN ---
    const totalPages = Math.ceil(allFiltered.length / itemsPerPage);

    const paginatedVisitadores = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return allFiltered.slice(startIndex, startIndex + itemsPerPage);
    }, [allFiltered, currentPage, itemsPerPage]);

    return {
        form,
        ui: {
            isFormModalOpen, setIsFormModalOpen,
            isEditing, setIsEditing,
            userName, setUserName,
            isSearching,
            searchTerm, setSearchTerm,
            // Props de paginación para el Toolbar
            currentPage, setCurrentPage,
            itemsPerPage, setItemsPerPage,
            totalPages
        },
        // Retornamos los visitadores ya recortados para la tabla
        filteredVisitadores: paginatedVisitadores,
        // Útil por si quieres mostrar "Mostrando X de TOTAL"
        totalRecords: allFiltered.length
    };
};