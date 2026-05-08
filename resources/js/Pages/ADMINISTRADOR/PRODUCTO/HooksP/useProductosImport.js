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

    return {
        previewData,
        duplicatesFound,
        activeTab, setActiveTab,
        isPreviewModalOpen, setIsPreviewModalOpen,
        isWarningModalOpen, setIsWarningModalOpen,
        handleFileChange,
        handleProcessImport,
        executeServerImport,
    };
};