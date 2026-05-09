import { useState, useRef, useEffect } from 'react';

const DEFAULT_COLUMNS = {
    semana: true,
    documento: false,
    medico: true,
    codigoProducto: false,
    producto: true,
    compras: true,
    formulaciones: true,
    valorComprado: false,
    valorFormulado: false,
};

export const useColumnVisibility = () => {
    const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
    const [showColumnFilter, setShowColumnFilter] = useState(false);
    const columnFilterRef = useRef(null);

    // Cierra el desplegable al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (columnFilterRef.current && !columnFilterRef.current.contains(e.target)) {
                setShowColumnFilter(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleColumn = (col) =>
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

    return {
        visibleColumns,
        showColumnFilter, setShowColumnFilter,
        columnFilterRef,
        toggleColumn,
    };
};