import { useEffect } from 'react';
import { router } from '@inertiajs/react';

// Dispara en segundo plano la carga perezosa (Inertia::lazy) de los datos de
// Odoo cuando aún no llegaron, y desempaqueta el objeto una vez presente.
export function useOdooDetalle(odooDatosPesados, { periodoActivo, fechaDesdeActiva, fechaHastaActiva }) {
    useEffect(() => {
        if (!odooDatosPesados) {
            router.reload({ only: ['odooDatosPesados'] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodoActivo, fechaDesdeActiva, fechaHastaActiva]); // También se refresca si cambia el rango personalizado

    return {
        totales: odooDatosPesados?.totales || {},
        productosComprados: odooDatosPesados?.productosComprados || [],
        productosFormulados: odooDatosPesados?.productosFormulados || [],
        laboratoriosComprados: odooDatosPesados?.laboratoriosComprados || [],
        laboratoriosFormulados: odooDatosPesados?.laboratoriosFormulados || [],
        puestoReal: odooDatosPesados?.puestoReal ?? null,
    };
}
