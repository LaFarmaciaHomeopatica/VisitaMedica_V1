import React, { useState, useEffect } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import {
    FaHouse, FaUsers, FaBoxesStacked, FaCalendarCheck,
    FaUserDoctor, FaPowerOff, FaHouseMedical,
    FaChevronLeft, FaChevronRight, FaUserGear
} from 'react-icons/fa6';

const PanelAdmin = ({ children }) => {
    const { url } = usePage();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved === 'true' ? true : false;
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', isCollapsed);
    }, [isCollapsed]);

    const menuItems = [
        { name: 'inicio', icon: <FaHouse />, route: '/PanelAdmin' },
        { name: 'Usuarios', icon: <FaUserGear />, route: '/Gusuarios' },
        { name: 'Visitadores', icon: <FaUsers />, route: '/Gvisitadores' },
        { name: 'Medicos', icon: <FaUserDoctor />, route: '/Gmedicos' },
        { name: 'Visitas', icon: <FaCalendarCheck />, route: '/Gvisitas' },
        { name: 'Productos', icon: <FaBoxesStacked />, route: '/admin/productos' },
    ];

    return (
        <div className="flex h-screen bg-[#F0F4FA] font-sans overflow-hidden">
            <Head title="Panel Administrativo" />

            {/* SIDEBAR */}
            <aside className={`
                transition-all duration-300 ease-in-out 
                ${isCollapsed ? 'w-20' : 'w-64'} 
                bg-[#3D3FD8] m-4 rounded-[35px] 
                flex flex-col items-center py-8 
                relative shadow-2xl 
                flex-shrink-0 
                h-[calc(100vh-2rem)]
            `}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 bg-white text-[#3D3FD8] p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
                >
                    {isCollapsed ? <FaChevronRight size={10} /> : <FaChevronLeft size={10} />}
                </button>

                <div className={`mb-10 bg-white/10 p-3 rounded-2xl backdrop-blur-md transition-all ${isCollapsed ? 'scale-90' : ''}`}>
                    <FaHouseMedical className="text-white text-2xl" />
                </div>

                <nav className="w-full flex-grow overflow-y-auto no-scrollbar">
                    <ul className={`space-y-2 ${isCollapsed ? 'px-2' : 'pl-6'}`}>
                        {menuItems.map((item) => {
                            const isActive = url.startsWith(item.route);
                            return (
                                <li key={item.name} className="relative">
                                    <Link
                                        href={item.route}
                                        className={`w-full flex items-center transition-all duration-300 ${isCollapsed
                                            ? 'justify-center py-4 rounded-2xl'
                                            : 'gap-4 py-3.5 px-6 rounded-l-full'
                                            } ${isActive
                                                ? 'bg-[#F0F4FA] text-[#3D3FD8] font-bold'
                                                : 'text-white/70 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="text-xl shrink-0">{item.icon}</span>
                                        {!isCollapsed && <span className="text-sm tracking-wide capitalize whitespace-nowrap">{item.name}</span>}

                                        {(isActive && !isCollapsed) && (
                                            <>
                                                <div className="absolute top-[-20px] right-0 w-5 h-5 bg-[#F0F4FA] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[#3D3FD8] before:rounded-br-[20px]"></div>
                                                <div className="absolute bottom-[-20px] right-0 w-5 h-5 bg-[#F0F4FA] before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[#3D3FD8] before:rounded-tr-[20px]"></div>
                                            </>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="w-full px-4 mt-auto">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className={`w-full flex items-center justify-center gap-3 py-4 text-white/80 hover:text-red-300 transition-colors border-t border-white/10 ${isCollapsed ? 'px-0' : ''}`}
                    >
                        <FaPowerOff className="shrink-0" />
                        {!isCollapsed && <span className="text-xs font-bold uppercase">Salir</span>}
                    </Link>
                </div>
            </aside>

            {/* MAIN CORREGIDO PARA ANCHO COMPLETO */}
            <main className="flex-grow p-4 md:p-6 overflow-y-auto h-full">
                {/* He eliminado 'max-w-7xl' y 'mx-auto' para que use todo el ancho.
                    Cambié 'p-8' por 'p-4' o 'p-6' para reducir el espacio muerto arriba.
                */}
                <div className="w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default PanelAdmin;