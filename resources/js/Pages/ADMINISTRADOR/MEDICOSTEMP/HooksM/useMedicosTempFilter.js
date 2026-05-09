import { useState, useMemo } from 'react';

export const useMedicosTempFilter = (medicosTemporales) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(10);

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return medicosTemporales.filter(m =>
            m.nombre_referencia?.toLowerCase().includes(term) ||
            m.documento?.toString().includes(term)
        );
    }, [medicosTemporales, searchTerm]);

    const totalPages = Math.ceil(filteredItems.length / (itemsPerPage || 1));
    const currentItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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