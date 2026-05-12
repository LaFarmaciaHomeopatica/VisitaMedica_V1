import { useState, useMemo } from 'react';

export const useUsuariosFilter = (usuarios) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(10);

    const filteredUsuarios = useMemo(() =>
        usuarios.filter(u =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [usuarios, searchTerm]
    );

    const totalPages = Math.ceil(filteredUsuarios.length / (itemsPerPage || 1));
    const indexOfFirst = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredUsuarios.slice(indexOfFirst, indexOfFirst + itemsPerPage);

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
        filteredUsuarios, currentItems, totalPages,
    };
};