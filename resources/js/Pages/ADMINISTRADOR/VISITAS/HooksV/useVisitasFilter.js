import { useState, useMemo } from 'react';

export const useVisitasFilter = (visitas, medicos, visitadores) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(50);

    const filteredVisitas = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return visitas.filter(v => {
            const nombreMedico = medicos.find(m => m.id == v.medico_id)?.nombre || '';
            const nombreVisitador = visitadores.find(vis => vis.id == v.visitador_id)?.nombre || '';
            return (
                nombreMedico.toLowerCase().includes(search) ||
                nombreVisitador.toLowerCase().includes(search) ||
                v.estado.toLowerCase().includes(search)
            );
        });
    }, [searchTerm, visitas, medicos, visitadores]);

    const totalPages = Math.ceil(filteredVisitas.length / (itemsPerPage || 1));
    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredVisitas.slice(start, start + itemsPerPage);
    }, [filteredVisitas, currentPage, itemsPerPage]);

    const setSearchTerm = (value) => {
        setSearchTermRaw(value);
        setCurrentPage(1);
    };

  const setItemsPerPage = (value) => {
    // Si está vacío, guardamos el string vacío en lugar de forzar un 0
    setItemsPerPageRaw(value === '' ? '' : parseInt(value, 10));
    setCurrentPage(1);
};

    return {
        searchTerm, setSearchTerm,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage,
        filteredVisitas, currentItems, totalPages,
    };
};