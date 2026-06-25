import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { router } from '@inertiajs/react';

export const useMedicosImport = (medicos, visitadores) => {
    const [previewData, setPreviewData] = useState([]);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [duplicatesFound, setDuplicatesFound] = useState([]);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('todos');
    const fileInputRef = useRef(null);

    const handleImportClick = () => fileInputRef.current.click();

    const normalizar = (str) => str?.toString().trim().toLowerCase()
        .replace(/\s+/g, ' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') ?? '';

    const cmp = (a, b) => normalizar(a) === normalizar(b);

    const normFecha = (val) => {
        if (!val) return '';
        return val.toString().trim()
            .replace('T', ' ')
            .replace(/\.000000Z$/, '')
            .replace(/Z$/, '')
            .trim();
    };

 const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const headers = raw[0].map(h => {
            if (!h) return '';
            return h.toString().trim().toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '_');
            // ✅ QUITAMOS el replace de contacto$ — lo manejamos abajo por key
        });

        const rows = raw.slice(1).map(row => {
            let obj = {};
            headers.forEach((h, i) => {
                if (!h) return;
                let key = h;
                // Normalizamos aliases de teléfono
                if (['telefono', 'celular', 'tel'].includes(h)) key = 'telefono_contacto';
                // ✅ NUEVO: alias del campo telefono_contacto si viene con sufijo raro
                if (h === 'telefono_contacto') key = 'telefono_contacto';
                // Normalizamos aliases de dirección
                if (['detalles_direccion', 'direccion', 'dir'].includes(h)) key = 'direccion_detalles';
                // ✅ NUEVO: alias del visitador por si el header varía
                if (['visitador', 'visitador_asignado', 'visitador_asignado_'].includes(h)) key = 'visitador_asignado';
                obj[key] = row[i] !== undefined ? row[i] : null;
            });
            return obj;
        });

        const duplicados = [];
        const filasParaProcesar = rows.map(row => {
            const docValue = (row.documento || row.DOCUMENTO)?.toString().trim();
            const original = medicos.find(m => m.documento?.toString().trim() === docValue);
            const existe = !!original;

            if (existe) duplicados.push(row);

            // ✅ CORREGIDO: normalización robusta del nombre del visitador
            const nombreVisitadorExcel = normalizar(row.visitador_asignado ?? '');
            const esSinAsignar = !nombreVisitadorExcel || nombreVisitadorExcel === 'sin asignar';

            const visitadorResuelto = esSinAsignar ? null :
                visitadores?.find(v =>
                    normalizar(v.nombre + ' ' + v.apellido) === nombreVisitadorExcel
                );

            const visitadorIdResuelto = esSinAsignar ? null : (visitadorResuelto?.id ?? null);

            // ✅ NUEVO: log para debug (quitar después de confirmar que funciona)
            if (nombreVisitadorExcel) {
                console.log('Visitador Excel:', nombreVisitadorExcel);
                console.log('Visitador encontrado:', visitadorResuelto);
                console.log('ID resuelto:', visitadorIdResuelto);
                console.log('Visitadores disponibles:', visitadores?.map(v => normalizar(v.nombre + ' ' + v.apellido)));
            }

            const catExcel = (row.categoria === 'Sin Categoría' || !row.categoria) ? '' : row.categoria;
            const catBD = original?.categoria?.nombre ?? '';

            const esModificado = existe && !(
                cmp(row.nombre, original.nombre) &&
                cmp(row.apellido, original.apellido) &&
                cmp(row.especialidad, original.especialidad) &&
                cmp(catExcel, catBD) &&
                cmp(row.telefono_contacto, original.telefono_contacto) &&
                cmp(row.geolocalizacion, original.geolocalizacion) &&
                cmp(row.direccion_detalles ?? '', original.direccion_detalles ?? '') &&
                cmp(row.horario_atencion, original.horario_atencion) &&
                String(visitadorIdResuelto ?? '') === String(original.visitador_id ?? '') &&
                normFecha(row.fecha_inicio_relacion) === normFecha(original.fecha_inicio_relacion)
            );

            return {
                ...row,
                visitador_id: visitadorIdResuelto, // ✅ guardamos el ID resuelto
                _status: !existe ? 'nuevo' : (esModificado ? 'modificado' : 'sin_cambios'),
                _original: original,
            };
        });

        setDuplicatesFound(duplicados);
        setPreviewData(filasParaProcesar);
        setIsPreviewModalOpen(true);
    };
    reader.readAsBinaryString(file);
};

    const executeServerImport = () => {
        if (!selectedFile) return;
        router.post(route('Gmedicos.importar'), { archivo: selectedFile }, {
            forceFormData: true,
            preserveState: false,
            preserveScroll: true,
            onSuccess: () => {
                setIsPreviewModalOpen(false);
                setIsWarningModalOpen(false);
                setPreviewData([]);
                setSelectedFile(null);
            },
        });
    };

    const handleProcessImport = () => {
        if (duplicatesFound.length > 0) setIsWarningModalOpen(true);
        else executeServerImport();
    };

    const handleDownloadTemplate = ({ visitadores = [], tiposDocumento = [], categorias = [] } = {}) => {
        const wb = XLSX.utils.book_new();

        // ── Hoja 1: Plantilla ─────────────────────────────────────────────────
        const headers = [
            'documento', 'nombre', 'apellido', 'tipo_documento', 'especialidad',
            'categoria', 'telefono_contacto', 'direccion_detalles', 'geolocalizacion',
            'horario_atencion', 'visitador_asignado', 'fecha_inicio_relacion',
        ];
        const sample = [
            '12345678', 'María', 'García', tiposDocumento[0]?.codigo ?? 'CC',
            'Cardiología', categorias[0]?.nombre ?? '', '3001234567',
            'Calle 10 # 5-20', '', 'Lunes-Viernes 8am-12pm',
            visitadores[0] ? `${visitadores[0].nombre} ${visitadores[0].apellido}` : '',
            '2024-01-15',
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, sample]);

        // Ancho de columnas
        ws['!cols'] = [
            { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 26 }, { wch: 20 },
            { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 20 },
            { wch: 28 }, { wch: 26 }, { wch: 22 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Médicos');

        // ── Hoja 2: Valores válidos ───────────────────────────────────────────
        const refData = [['CÓDIGO (usar en archivo)', 'TIPO DE DOCUMENTO', 'CATEGORÍAS', 'VISITADORES (nombre completo)']];
        const maxLen  = Math.max(tiposDocumento.length, categorias.length, visitadores.length, 1);

        for (let i = 0; i < maxLen; i++) {
            refData.push([
                tiposDocumento[i]?.codigo ?? '',
                tiposDocumento[i]?.nombre ?? '',
                categorias[i]?.nombre    ?? '',
                visitadores[i] ? `${visitadores[i].nombre} ${visitadores[i].apellido}` : '',
            ]);
        }

        const wsRef = XLSX.utils.aoa_to_sheet(refData);
        wsRef['!cols'] = [{ wch: 24 }, { wch: 30 }, { wch: 22 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsRef, 'Valores válidos');

        XLSX.writeFile(wb, 'Plantilla_Medicos_LFH.xlsx');
    };

    return {
        fileInputRef,
        previewData,
        selectedFile,
        duplicatesFound,
        activeTab, setActiveTab,
        isPreviewModalOpen, setIsPreviewModalOpen,
        isWarningModalOpen, setIsWarningModalOpen,
        handleImportClick,
        handleFileChange,
        handleProcessImport,
        executeServerImport,
        handleDownloadTemplate,
    };
};