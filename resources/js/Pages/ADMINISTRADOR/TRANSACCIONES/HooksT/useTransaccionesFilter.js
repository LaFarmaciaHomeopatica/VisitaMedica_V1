import { useState, useMemo } from 'react';

export const useTransaccionesFilter = (transacciones) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(10);

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return transacciones.filter(t =>
            t.medico?.nombre?.toLowerCase().includes(term) ||
            t.medico_documento?.toString().includes(term) ||
            t.producto?.nombre?.toLowerCase().includes(term) ||
            t.semana?.toString().includes(term)
        );
    }, [transacciones, searchTerm]);

    const totalPages = useMemo(
        () => Math.ceil(filteredItems.length / (itemsPerPage || 1)),
        [filteredItems.length, itemsPerPage]
    );

    const currentItems = useMemo(() => {
        const last = currentPage * itemsPerPage;
        const first = last - itemsPerPage;
        return filteredItems.slice(first, last);
    }, [filteredItems, currentPage, itemsPerPage]);

    const setSearchTerm = (value) => {
        setSearchTermRaw(value);
        setCurrentPage(1);
    };

    const setItemsPerPage = (value) => {
        setItemsPerPageRaw(value === '' ? 0 : parseInt(value, 10));
        setCurrentPage(1);
    };

    return {
        searchTerm, setSearchTerm,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage,
        filteredItems, currentItems, totalPages,
    };
};