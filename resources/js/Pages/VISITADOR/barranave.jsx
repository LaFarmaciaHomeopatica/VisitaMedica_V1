import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    FaHouse,
    FaUserDoctor,
    FaChartLine,
    FaCalendarCheck,
    FaPills,
    FaBars,
    FaXmark
} from 'react-icons/fa6';

const BottomNavigation = () => {
    const { url } = usePage();
    const [isOpen, setIsOpen] = useState(false);

    const navIcons = [
        { icon: <FaHouse />, label: 'Inicio', route: '/panel' },
        { icon: <FaUserDoctor />, label: 'Médicos', route: '/ListadoMedicos' },
        { icon: <FaChartLine />, label: 'Mi Progreso', route: '/visitador' },
        { icon: <FaCalendarCheck />, label: 'Visitas', route: '/MisVisitas' },
        { icon: <FaPills />, label: 'Productos', route: '/ProductoCatalogo' },
    ];

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
            {/* --- MÓVIL: MENÚ FLOTANTE IZQUIERDA --- */}
            <div className="fixed bottom-6 left-6 z-50 sm:hidden pointer-events-none">
                {/* Lista de enlaces vertical */}
                <div className={`flex flex-col-reverse gap-3 mb-4 transition-all duration-300 origin-bottom-left ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-75 translate-y-10 pointer-events-none'
                    }`}>
                    {navIcons.map((nav, index) => {
                        const isActive = url === nav.route || url.startsWith(`${nav.route}/`);
                        return (
                            <Link
                                key={index}
                                href={nav.route}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 p-3 rounded-2xl shadow-xl transition-all border
                                    ${isActive
                                        ? 'bg-[#5D8BF4] text-white border-white/20'
                                        : 'bg-white/90 backdrop-blur-md text-slate-700 border-gray-100'}`}
                            >
                                <div className="text-xl">{nav.icon}</div>
                                <span className="text-xs font-bold pr-2">{nav.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <button
                    onClick={toggleMenu}
                    className={`fixed bottom-5 left-5 z-50 w-14 h-14 flex items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 text-white pointer-events-auto
                     ${isOpen ? 'bg-red-500' : 'bg-[#5D8BF4] hover:bg-[#4a76d8]'}`}
                >
                    {isOpen ? (
                        <FaXmark size={24} className="animate-in fade-in zoom-in duration-300" />
                    ) : (
                        <FaBars size={24} className="animate-in fade-in zoom-in duration-300" />
                    )}
                </button>
            </div>

            {/* --- DESKTOP: BARRA HORIZONTAL --- */}
            {/* CORRECCIÓN: Agregamos pointer-events-none al contenedor estirado de lado a lado */}
            <div className="hidden sm:flex fixed bottom-6 left-0 right-0 justify-center z-50 px-4 pointer-events-none">

                {/* CORRECCIÓN: Forzamos pointer-events-auto aquí para que el menú azul sí responda a clics */}
                <nav className="bg-[#5D8BF4]/90 backdrop-blur-lg border border-white/20 p-2 px-6 flex justify-around items-center gap-4 rounded-[35px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] max-w-fit transition-all duration-300 pointer-events-auto">
                    {navIcons.map((nav, index) => {
                        const isActive = url === nav.route || url.startsWith(`${nav.route}/`);
                        return (
                            <Link
                                key={index}
                                href={nav.route}
                                className={`relative flex flex-col items-center gap-1 p-2 min-w-[80px] transition-all duration-300 group
                                    ${isActive ? 'scale-110' : 'hover:scale-105'}`}
                            >
                                <div className={`text-xl transition-all duration-300
                                    ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}
                                >
                                    {nav.icon}
                                </div>
                                <span className={`text-[10px] font-bold transition-all duration-300 text-center
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

            {/* Fondo desenfocado al abrir el menú (Mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 sm:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default BottomNavigation;