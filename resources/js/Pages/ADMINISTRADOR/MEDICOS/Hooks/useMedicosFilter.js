import { useState, useMemo } from 'react';

export const useMedicosFilter = (medicos) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPageRaw] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(50);

    const filteredMedicos = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return medicos.filter(m => {
            const categoria = m.categoria?.nombre?.toLowerCase() || 'sin categoria';
            const nombreCompleto = (m.nombre || '').toLowerCase();
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

    const totalPages = Math.max(1, Math.ceil(filteredMedicos.length / (itemsPerPage || 1)));

    // --- AJUSTE AQUÍ ---
    // Si la página es 0 (porque borraron el input), usamos 1 para el cálculo del slice
    // así la tabla no se queda en blanco ni da error mientras el usuario escribe.
    const effectivePage = currentPage < 1 ? 1 : currentPage;
    const indexOfFirst = (effectivePage - 1) * (itemsPerPage || 0);
    const currentItems = filteredMedicos.slice(indexOfFirst, indexOfFirst + (itemsPerPage || 0));

    const setSearchTerm = (value) => {
        setSearchTermRaw(value);
        setCurrentPageRaw(1);
    };

    const setItemsPerPage = (value) => {
        // Acepta el valor vacío o 0 para permitir borrar en el input
        if (value === '' || value === 0) {
            setItemsPerPageRaw(0);
        } else {
            const num = Math.abs(parseInt(value, 10));
            setItemsPerPageRaw(isNaN(num) ? 0 : num);
        }
        setCurrentPageRaw(1);
    };

    const setCurrentPage = (value) => {
        // Acepta el valor vacío o 0 para permitir borrar en el input
        if (value === '' || value === 0) {
            setCurrentPageRaw(0);
        } else {
            let num = Math.abs(parseInt(value, 10));
            if (isNaN(num)) num = 0;

            // Si el número es mayor al total, lo limitamos al máximo
            const targetPage = num > totalPages ? totalPages : num;
            setCurrentPageRaw(targetPage);
        }
    };

    return {
        searchTerm, setSearchTerm,
        currentPage, setCurrentPage,
        itemsPerPage, setItemsPerPage,
        filteredMedicos, currentItems, totalPages,
    };
};