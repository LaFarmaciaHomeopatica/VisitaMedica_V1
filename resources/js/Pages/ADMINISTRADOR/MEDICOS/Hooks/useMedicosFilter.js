import { useState, useMemo } from 'react';

export const useMedicosFilter = (medicos) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(10);

    const filteredMedicos = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return medicos.filter(m => {
            const categoria = m.categoria?.nombre?.toLowerCase() || 'sin categoria';
            const nombreCompleto = `${m.nombre} ${m.apellido}`.toLowerCase();
            const documento = m.documento?.toString().toLowerCase() || '';
            const especialidad = (m.especialidad || 'general').toLowerCase();
            const nombreVisitador = m.visitador
                ? `${m.visitador.nombre} ${m.visitador.apellido || ''}`.toLowerCase()
                : 'sin asignar';

            return (
                nombreCompleto.includes(term) ||
                documento.includes(term) ||
                especialidad.includes(term) ||
                nombreVisitador.includes(term) ||
                categoria.includes(term)
            );
        });
    }, [medicos, searchTerm]);

    const totalPages = Math.ceil(filteredMedicos.length / (itemsPerPage || 1));
    const indexOfFirst = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredMedicos.slice(indexOfFirst, indexOfFirst + itemsPerPage);

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
        filteredMedicos, currentItems, totalPages,
    };
};