import React from 'react';
import { usePage } from '@inertiajs/react';
import MetricasCard from './MetricasCard';
import TabNav from './TabNav';

/**
 * Sección hero con saludo, métricas y navegación de pestañas.
 */
const HeroSection = ({
    porcentaje,
    porcentajeVentas,
    visitasEfectivasCount,
    meta,
    ventasActuales,
    metaDinero,
    tabActiva,
    setTabActiva,
    totalMedicos,
    totalPendientes,
}) => {
    const { auth } = usePage().props;

    return (
        <section className="bg-gradient-to-br from-[#1C85E8] via-[#02CFE3] to-[#24C765] p-3 rounded-b-[40px] w-full md:max-w-none shadow-lg relative text-white border-none">
         <div className="flex items-center gap-4 mb-6">
    <div>
        <h1 className="text-2xl font-bold text-white leading-tight">
            Bienvenido,{' '}
            <br className="md:hidden" />
            <span className="text-white font-extrabold capitalize drop-shadow-sm">
                {auth?.user?.nombre} {auth?.user?.apellido}
            </span>
        </h1>
    </div>
</div>

            <MetricasCard
                porcentaje={porcentaje}
                porcentajeVentas={porcentajeVentas}
                visitasEfectivasCount={visitasEfectivasCount}
                meta={meta}
                ventasActuales={ventasActuales}
                metaDinero={metaDinero}
            />

            <TabNav
                tabActiva={tabActiva}
                setTabActiva={setTabActiva}
                totalMedicos={totalMedicos}
                totalPendientes={totalPendientes}
            />
        </section>
    );
};

export default HeroSection;