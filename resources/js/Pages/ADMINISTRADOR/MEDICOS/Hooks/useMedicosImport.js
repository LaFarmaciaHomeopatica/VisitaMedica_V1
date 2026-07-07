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

    // Compara el nombre completo como "bolsa de palabras", sin importar
    // en qué columna (nombre/apellido) haya quedado cada palabra ni su orden
    const obtenerPalabrasClave = (nom, ape) => {
        const completo = `${nom || ''} ${ape || ''}`.trim().toUpperCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const limpio = completo.replace(/[^A-Z0-9 ]/g, '');
        return limpio.split(/\s+/).filter(Boolean).sort().join(' ');
    };

    // Resuelve el visitador probando orden directo y por palabras ordenadas
    const resolverVisitador = (nombreVisitadorExcel, visitadores) => {
        const esSinAsignar = !nombreVisitadorExcel ||
            ['sin asignar', 'sin visitador', 'no asignado', 'ninguno', '-', '--', '---']
                .includes(nombreVisitadorExcel);

        if (esSinAsignar) {
            return { visitadorResuelto: null, esSinAsignar: true };
        }

        let visitadorResuelto = visitadores?.find(v =>
            normalizar(v.nombre + ' ' + v.apellido) === nombreVisitadorExcel
        );

        if (!visitadorResuelto) {
            const clave = (s) => s.replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean).sort().join(' ');
            const claveExcel = clave(nombreVisitadorExcel);

            visitadorResuelto = visitadores?.find(v =>
                clave(normalizar(v.nombre + ' ' + v.apellido)) === claveExcel
            );
        }

        return { visitadorResuelto, esSinAsignar: false };
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
            });

            const rows = raw.slice(1).map(row => {
                let obj = {};
                headers.forEach((h, i) => {
                    if (!h) return;
                    let key = h;
                    if (['telefono', 'celular', 'tel'].includes(h)) key = 'telefono_contacto';
                    if (h === 'telefono_contacto') key = 'telefono_contacto';
                    if (['detalles_direccion', 'direccion', 'dir'].includes(h)) key = 'direccion_detalles';
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

                // ✅ SIMPLIFICADO: ya no separamos nombre/apellido, solo armamos
                // el nombre completo tal cual viene, para mostrar y comparar
                const nombreCompletoExcel = `${row.nombre || ''} ${row.apellido || ''}`.trim();

                const nombreVisitadorExcel = normalizar(row.visitador_asignado ?? '');
                const { visitadorResuelto, esSinAsignar } = resolverVisitador(nombreVisitadorExcel, visitadores);
                const visitadorIdResuelto = esSinAsignar ? null : (visitadorResuelto?.id ?? null);

                const catExcel = (row.categoria === 'Sin Categoría' || !row.categoria) ? '' : row.categoria;
                const catBD = original?.categoria?.nombre ?? '';

                // Comparación de identidad por bolsa de palabras (nombre + apellido juntos)
                const identidadCoincide = existe && (
                    obtenerPalabrasClave(row.nombre, row.apellido) ===
                    obtenerPalabrasClave(original.nombre, original.apellido)
                );

                const esModificado = existe && !(
                    identidadCoincide &&
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
                    nombre_completo: nombreCompletoExcel, // ✅ usado por el modal para mostrar
                    visitador_id: visitadorIdResuelto,
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

        const headers = [
            'documento', 'nombre', 'tipo_documento', 'especialidad',
            'categoria', 'telefono_contacto', 'direccion_detalles', 'geolocalizacion',
            'horario_atencion', 'visitador_asignado', 'fecha_inicio_relacion',
        ];
        const sample = [
            '12345678', 'María García', tiposDocumento[0]?.codigo ?? 'CC',
            'Cardiología', categorias[0]?.nombre ?? '', '3001234567',
            'Calle 10 # 5-20', '', 'Lunes-Viernes 8am-12pm',
            visitadores[0] ? `${visitadores[0].nombre} ${visitadores[0].apellido}` : '',
            '2024-01-15',
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, sample]);

        ws['!cols'] = [
            { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 26 }, { wch: 20 },
            { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 20 },
            { wch: 28 }, { wch: 26 }, { wch: 22 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Médicos');

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