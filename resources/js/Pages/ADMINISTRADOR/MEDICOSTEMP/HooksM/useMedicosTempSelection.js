import { useState } from 'react';

export const useMedicosTempSelection = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    // Seleccionar o deseleccionar un solo médico
    const toggleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Seleccionar o deseleccionar todos los de la página actual
    const toggleSelectAll = (e, currentItems) => {
        if (e.target.checked) {
            const allIds = currentItems.map(m => m.id);
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