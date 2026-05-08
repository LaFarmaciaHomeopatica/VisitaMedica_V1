import { useState } from 'react';

export const useMedicosSelection = () => {
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = (e, currentItems) => {
        const idsOnPage = currentItems.map(m => m.id);
        if (e.target.checked) {
            setSelectedIds(prev => [...new Set([...prev, ...idsOnPage])]);
        } else {
            setSelectedIds(prev => prev.filter(id => !idsOnPage.includes(id)));
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const clearSelection = () => setSelectedIds([]);

    const isAllOnPageSelected = (currentItems) =>
        currentItems.length > 0 && currentItems.every(m => selectedIds.includes(m.id));

    return {
        selectedIds,
        setSelectedIds,
        handleSelectAll,
        handleSelectOne,
        clearSelection,
        isAllOnPageSelected,
    };
};