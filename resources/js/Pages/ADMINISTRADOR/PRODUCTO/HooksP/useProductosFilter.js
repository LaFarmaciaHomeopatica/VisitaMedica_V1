import { useState, useMemo } from 'react';

export const useProductosFilter = (productos) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(50);

    const filteredProductos = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return productos.filter(p =>
            p.nombre?.toLowerCase().includes(term) ||
            p.laboratorio?.toLowerCase().includes(term) ||
            p.codigo?.toLowerCase().includes(term)
        );
    }, [productos, searchTerm]);

    const totalPages = Math.ceil(filteredProductos.length / (itemsPerPage || 1));
    const indexOfFirst = (currentPage - 1) * itemsPerPage;
    const currentItems = useMemo(
        () => filteredProductos.slice(indexOfFirst, indexOfFirst + itemsPerPage),
        [filteredProductos, indexOfFirst, itemsPerPage]
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
        filteredProductos, currentItems, totalPages,
    };
};