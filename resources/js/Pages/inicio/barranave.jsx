import React from 'react';
import { Link, usePage } from '@inertiajs/react';
// Importamos los iconos específicos de FontAwesome (Versión SVG)
// CAMBIO: FaUserMd -> FaUserDoctor
import {
    FaHouse,
    FaUserDoctor, // <--- REVISA QUE DIGA ESTO
    FaChartLine,
    FaCalendarCheck,
    FaPills
} from 'react-icons/fa6';

const BottomNavigation = () => {
    const { url } = usePage();

    const navIcons = [
        {
            icon: <FaHouse />,
            label: 'Inicio',
            route: '/panel'
        },
        {
            icon: <FaUserDoctor />, // CAMBIO: Usar el nuevo nombre aquí
            label: 'Médicos',
            route: '/ListadoMedicos'
        },
        {
            icon: <FaChartLine />,
            label: 'Mi Progreso',
            route: '/visitador'
        },
        {
            icon: <FaCalendarCheck />,
            label: 'Gestión',
            route: '/GestionVisita'
        },
        {
            icon: <FaPills />,
            label: 'Productos',
            route: '/ProductoCatalogo'
        },
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
            <nav className="bg-[#5D8BF4]/90 backdrop-blur-lg border border-white/20 p-2 px-3 md:px-6 flex justify-around items-center gap-1 md:gap-4 rounded-[35px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] max-w-full sm:max-w-fit transition-all duration-300">
                {navIcons.map((nav, index) => {
                    const isActive = url === nav.route || url.startsWith(`${nav.route}/`);

                    return (
                        <Link
                            key={index}
                            href={nav.route}
                            className={`relative flex flex-col items-center gap-1 p-2 min-w-[65px] md:min-w-[80px] transition-all duration-300 group
                                ${isActive ? 'scale-110' : 'hover:scale-105'}`}
                        >
                            <div className={`text-lg md:text-xl transition-all duration-300
                                ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}
                            >
                                {nav.icon}
                            </div>

                            <span className={`text-[9px] md:text-[10px] font-bold transition-all duration-300 text-center
                                ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>
                                {nav.label}
                            </span>

                            {isActive && (
                                <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default BottomNavigation;