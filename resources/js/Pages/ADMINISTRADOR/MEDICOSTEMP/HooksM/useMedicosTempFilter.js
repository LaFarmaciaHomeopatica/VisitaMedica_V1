import { useState, useMemo } from 'react';

export const useMedicosTempFilter = (medicosTemporales) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPageRaw, setCurrentPageRaw] = useState(1);
    const [itemsPerPageRaw, setItemsPerPageRaw] = useState(10);

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return (medicosTemporales || []).filter(m =>
            m.nombre_referencia?.toLowerCase().includes(term) ||
            m.documento?.toString().includes(term)
        );
    }, [medicosTemporales, searchTerm]);

    // SEGURIDAD: totalPages siempre debe ser al menos 1 para evitar el DE -2479
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / (Math.max(1, itemsPerPageRaw))));

    // Lógica de rebanado (slice)
    const effectivePage = currentPageRaw < 1 ? 1 : currentPageRaw;
    const indexOfLast = effectivePage * (itemsPerPageRaw || 0);
    const indexOfFirst = Math.max(0, indexOfLast - (itemsPerPageRaw || 0));
    const currentItems = filteredItems.slice(indexOfFirst, indexOfLast);

    const setSearchTerm = (value) => {
        setSearchTermRaw(value);
        setCurrentPageRaw(1);
    };

    const setItemsPerPage = (value) => {
        if (value === '' || value === null) {
            setItemsPerPageRaw(0);
        } else {
            // Usamos Math.abs para asegurar que NUNCA sea negativo
            const num = Math.abs(parseInt(value, 10));
            if (!isNaN(num)) setItemsPerPageRaw(num);
        }
        setCurrentPageRaw(1);
    };

    const setCurrentPage = (value) => {
        if (value === '' || value === null) {
            setCurrentPageRaw(0); // Permite borrar el input
        } else {
            const num = Math.abs(parseInt(value, 10));
            if (!isNaN(num)) {
                // IMPORTANTE: No limitamos aquí con totalPages para que el usuario pueda escribir libremente.
                // La limitación se hace visualmente o al perder el foco (onBlur).
                setCurrentPageRaw(num);
            }
        }
    };

    return {
        searchTerm, setSearchTerm,
        currentPage: currentPageRaw, setCurrentPage,
        itemsPerPage: itemsPerPageRaw, setItemsPerPage,
        filteredItems, currentItems, totalPages,
    };
};