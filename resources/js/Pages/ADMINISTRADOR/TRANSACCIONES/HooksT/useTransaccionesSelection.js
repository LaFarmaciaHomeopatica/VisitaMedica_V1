import { useState } from 'react';

export const useTransaccionesSelection = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelectAll = (currentItems) => {
        if (currentItems.length > 0 && selectedIds.length === currentItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentItems.map(t => t.id));
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