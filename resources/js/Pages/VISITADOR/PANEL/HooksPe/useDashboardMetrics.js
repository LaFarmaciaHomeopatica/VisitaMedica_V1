import { useMemo } from 'react';

/**
 * Hook que centraliza todos los cálculos métricos del dashboard.
 * @param {Array}  visitasData      - Lista de visitas del mes.
 * @param {number} metaValorGlobal  - Meta de visitas del mes.
 * @param {number} metaDinero       - Meta de dinero del mes.
 * @param {number} ventasActuales   - Ventas acumuladas del mes.
 */
export const useDashboardMetrics = (visitasData, metaValorGlobal, metaDinero, ventasActuales) => {
    const { porcentaje, idsVisitadosHoy, meta } = useMemo(() => {
        const hoy  = new Date();
        const de   = hoy.getDate().toString().padStart(2, '0');
        const ma   = (hoy.getMonth() + 1).toString().padStart(2, '0');
        const ye   = hoy.getFullYear();
        const hoyStr = `${ye}-${ma}-${de}`;

        const visitasEfectivasMes = visitasData.filter(v => v.estado === 'efectiva');

        const idsHoy = visitasData
            .filter(v =>
                v.fecha_programada &&
                v.fecha_programada.startsWith(hoyStr) &&
                v.estado === 'efectiva'
            )
            .map(v => v.medico_id);

        const calculoPorcentaje = metaValorGlobal > 0
            ? Math.round((visitasEfectivasMes.length / metaValorGlobal) * 100)
            : 0;

        return {
            porcentaje:      calculoPorcentaje,
            idsVisitadosHoy: idsHoy,
            meta:            metaValorGlobal,
        };
    }, [visitasData, metaValorGlobal]);

    const porcentajeVentas = metaDinero > 0
        ? Math.round((ventasActuales / metaDinero) * 100)
        : 0;

    /** Devuelve true si el médico ya fue visitado hoy con visita efectiva */
    const fueVisitado = (medicoId) => idsVisitadosHoy.includes(medicoId);

    return { porcentaje, idsVisitadosHoy, meta, porcentajeVentas, fueVisitado };
};