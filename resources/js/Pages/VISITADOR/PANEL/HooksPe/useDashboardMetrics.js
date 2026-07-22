import { useMemo } from 'react';

/**
 * Hook que centraliza los cálculos de métricas locales de visitas.
 * Las ventas se consultan de forma asíncrona directamente desde Odoo en MetricasCard.
 */
export const useDashboardMetrics = (visitasData, metaValorGlobal) => {
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

    /** Devuelve true si el médico ya fue visitado hoy con visita efectiva */
    const fueVisitado = (medicoId) => idsVisitadosHoy.includes(medicoId);

    return { porcentaje, idsVisitadosHoy, meta, fueVisitado };
};