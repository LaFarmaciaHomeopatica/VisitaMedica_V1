import { useState, useMemo } from 'react';

export const useVisitasFilter = (visitas = [], medicos = [], visitadores = []) => {
    const [searchTerm, setSearchTermRaw] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPageRaw] = useState(50);

   const filteredVisitas = useMemo(() => {
    // 1. Normalizamos el término de búsqueda (minúsculas y sin espacios)
    const search = searchTerm.toLowerCase().trim();
    
    if (!search) return visitas;

    // Crear una versión de la búsqueda que mantenga SOLO números y letras (ej: "213135")
    const searchSoloLetrasNumeros = search.replace(/[^a-z0-9]/g, '');

    return visitas.filter(v => {
        // Encontrar el médico (por array global o por relación directa de Laravel)
        const idDeVisita = v.medico_id || v.id_medico || v.doctor_id;
        let medico = medicos.find(m => String(m.id) === String(idDeVisita)) || v.medico;
        const visitador = visitadores.find(vis => String(vis.id) === String(v.visitador_id || v.id_visitador)) || v.visitador;

        // Cargar textos del médico de forma segura
        const nombreMedico = medico?.nombre ? String(medico.nombre).toLowerCase() : '';
        const apellidoMedico = medico?.apellido ? String(medico.apellido).toLowerCase() : '';
        
        // Obtener el documento original (ej: "21313-5")
        const documentoRaw = medico?.documento || medico?.nro_documento || medico?.dni || medico?.num_documento || '';
        const documentoMedico = String(documentoRaw).toLowerCase();
        
        // Crear versión del documento sin guiones ni puntos (ej: "213135")
        const documentoMedicoSoloLetrasNumeros = documentoMedico.replace(/[^a-z0-9]/g, '');

        const nombreVisitador = visitador?.nombre ? String(visitador.nombre).toLowerCase() : '';
        const estado = v.estado ? String(v.estado).toLowerCase() : '';

        // 2. Evaluación de coincidencias
        return (
            nombreMedico.includes(search) ||
            apellidoMedico.includes(search) ||
            nombreVisitador.includes(search) ||
            estado.includes(search) ||
            // Coincidencia 1: Si escribe el formato exacto con guion (ej: "21313-")
            documentoMedico.includes(search) ||
            // Coincidencia 2: Si escribe todo junto sin guion (ej: "213135")
            (searchSoloLetrasNumeros !== '' && documentoMedicoSoloLetrasNumeros.includes(searchSoloLetrasNumeros))
        );
    });
}, [searchTerm, visitas, medicos, visitadores]);

    const totalPages = Math.ceil(filteredVisitas.length / (Number(itemsPerPage) || 1));
    
    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * (Number(itemsPerPage) || 50);
        return filteredVisitas.slice(start, start + (Number(itemsPerPage) || 50));
    }, [filteredVisitas, currentPage, itemsPerPage]);

    const setSearchTerm = (value) => {
        setSearchTermRaw(value);
        setCurrentPage(1);
    };

    const setItemsPerPage = (value) => {
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