import { useState } from 'react';

export const useVisitasSelection = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    // Seleccionar o deseleccionar una sola visita
    const toggleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Seleccionar todos los elementos que se muestran en la página actual
    const toggleSelectAll = (e, currentItems) => {
        if (e.target.checked) {
            const allIds = currentItems.map(v => v.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const clearSelection = () => setSelectedIds([]);

    return {
        selectedIds,
        toggleSelectOne,
        toggleSelectAll,
        clearSelection
    };
};