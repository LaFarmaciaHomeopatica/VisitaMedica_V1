import { useState } from 'react';

export const useProductosSelection = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    // En productos el "seleccionar todo" solo marca la página actual
    const handleSelectAll = (e, currentItems) => {
        if (e.target.checked) {
            setSelectedIds(currentItems.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const clearSelection = () => setSelectedIds([]);

    const isAllOnPageSelected = (currentItems) =>
        currentItems.length > 0 && selectedIds.length === currentItems.length;

    return {
        selectedIds, setSelectedIds,
        handleSelectAll, handleSelectOne,
        clearSelection, isAllOnPageSelected,
    };
};