import { useState } from 'react';
import { router } from '@inertiajs/react';
import * as XLSX from 'xlsx';

export const useProductosImport = (productos) => {
    const [previewData, setPreviewData] = useState([]);
    const [duplicatesFound, setDuplicatesFound] = useState([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('todos');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const rawData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

            const dataExcel = rawData.map(row => {
                const normalized = {};
                Object.keys(row).forEach(key => {
                    normalized[key.toLowerCase().trim()] = row[key]?.toString().trim() || '';
                });
                return normalized;
            });

            const duplicados = dataExcel.filter(row => {
                const codExcel = row.codigo?.toString().trim();
                return productos.some(p => p.codigo?.toString().trim() === codExcel);
            });

            setPreviewData(dataExcel);
            setDuplicatesFound(duplicados);
            setIsPreviewModalOpen(true);
        };
        reader.readAsBinaryString(file);
    };

    const handleProcessImport = () => {
        if (duplicatesFound.length > 0) {
            setIsPreviewModalOpen(false);
            setIsWarningModalOpen(true);
        } else {
            executeServerImport(false);
        }
    };

    const executeServerImport = (sobreescribir = false) => {
        router.post(route('productos.import'), {
            data: previewData,
            sobreescribir,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsPreviewModalOpen(false);
                setIsWarningModalOpen(false);
                setPreviewData([]);
            },
        });
    };

    const handleDownloadTemplate = () => {
        const wb = XLSX.utils.book_new();

        const headers = ['codigo', 'nombre', 'laboratorio'];
        const sample  = ['MED-001', 'Amoxicilina 500mg', 'Genfar'];

        const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
        ws['!cols'] = [{ wch: 16 }, { wch: 36 }, { wch: 26 }];

        XLSX.utils.book_append_sheet(wb, ws, 'Productos');

        // Hoja de notas
        const notas = [
            ['CAMPO', 'DESCRIPCIÓN', 'OBLIGATORIO'],
            ['codigo',      'Código único del producto (se usa para actualizar si ya existe)', 'SÍ'],
            ['nombre',      'Nombre completo del producto', 'SÍ'],
            ['laboratorio', 'Nombre del laboratorio fabricante. Si se omite se registra como S/L', 'NO'],
        ];
        const wsNotas = XLSX.utils.aoa_to_sheet(notas);
        wsNotas['!cols'] = [{ wch: 16 }, { wch: 56 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, wsNotas, 'Instrucciones');

        XLSX.writeFile(wb, 'Plantilla_Productos_LFH.xlsx');
    };

    return {
        previewData,
        duplicatesFound,
        activeTab, setActiveTab,
        isPreviewModalOpen, setIsPreviewModalOpen,
        isWarningModalOpen, setIsWarningModalOpen,
        handleFileChange,
        handleProcessImport,
        executeServerImport,
        handleDownloadTemplate,
    };
};