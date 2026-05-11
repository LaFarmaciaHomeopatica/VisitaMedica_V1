import { useState } from 'react';

export const useTransaccionesSelection = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelectAll = (e, items) => {
        // "items" es lo que pasas desde el Toolbar como "currentItems"
        if (e.target.checked) {
            // Si items no es un array, aquí es donde explota el .map()
            const ids = items.map(i => i.id);
            setSelectedIds(ids);
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const clearSelection = () => setSelectedIds([]);

    const isAllSelected = (currentItems) =>
        currentItems.length > 0 && selectedIds.length === currentItems.length;

    return {
        selectedIds, setSelectedIds,
        toggleSelectAll, toggleSelectOne,
        clearSelection, isAllSelected,
    };
};