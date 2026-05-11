import { useState, useMemo } from 'react';

export const useTransaccionesFilter = (transacciones = []) => {
    // Aseguramos que transacciones sea un array desde el inicio
    const safeTransacciones = Array.isArray(transacciones) ? transacciones : [];

    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(10);

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return safeTransacciones.filter(t =>
            t.medico?.nombre?.toLowerCase().includes(term) ||
            t.medico_documento?.toString().includes(term) ||
            t.producto?.nombre?.toLowerCase().includes(term) ||
            t.semana?.toString().includes(term)
        );
    }, [safeTransacciones, searchTerm]);

    const totalPages = useMemo(
        () => Math.ceil(filteredItems.length / (itemsPerPage || 1)),
        [filteredItems.length, itemsPerPage]
    );

    const currentItems = useMemo(() => {
        const last = currentPage * itemsPerPage;
        const first = last - itemsPerPage;
        // El método .slice siempre devuelve un array, 
        // pero validamos que los índices no rompan la lógica
        return filteredItems.slice(Math.max(0, first), last);
    }, [filteredItems, currentPage, itemsPerPage]);

    const setSearchTerm = (value) => {
        setSearchTermRaw(value);
        setCurrentPage(1);
    };

    const setItemsPerPage = (value) => {
        // Manejo de valores vacíos o inválidos para evitar división por cero
        const val = value === '' ? 0 : parseInt(value, 10);
        setItemsPerPageRaw(isNaN(val) ? 10 : val);
        setCurrentPage(1);
    };

    return {
        searchTerm, setSearchTerm,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage,
        filteredItems,
        currentItems: currentItems || [], // Garantía absoluta de array
        totalPages,
    };
};