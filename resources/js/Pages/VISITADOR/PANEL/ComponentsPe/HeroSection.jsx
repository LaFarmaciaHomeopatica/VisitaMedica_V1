import React from 'react';
import { usePage } from '@inertiajs/react';
import MetricasCard from './MetricasCard';

/**
 * Sección hero con saludo y métricas del visitador.
 */
const HeroSection = ({
    porcentaje,
    visitasEfectivasCount,
    meta,
    metaDinero,
    mes, // 👈 Se agrega para pasarlo a MetricasCard
}) => {
    const { auth } = usePage().props;

    return (
        <section className="bg-gradient-to-br from-[#1C85E8] to-[#0A69C2] p-3 rounded-b-[40px] w-full md:max-w-none shadow-lg relative text-white border-none">
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
                visitasEfectivasCount={visitasEfectivasCount}
                meta={meta}
                metaDinero={metaDinero}
                mes={mes} // 👈 Pasa la variable del mes actual
            />
        </section>
    );
};

export default HeroSection;