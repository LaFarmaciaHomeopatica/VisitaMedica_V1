import React, { useState } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import {
    FaHouse, FaUsers, FaBoxesStacked, FaCalendarCheck,
    FaUserDoctor, FaPowerOff, FaHouseMedical, FaUserClock,
    FaUserGear, FaFileInvoiceDollar, FaBars, FaXmark, FaChartLine, FaBullseye
} from 'react-icons/fa6';

const PanelAdmin = ({ children }) => {
    const { url } = usePage();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: 'inicio', icon: <FaHouse />, route: '/Ginicio' },
        { name: 'Visitadores', icon: <FaUsers />, route: '/Gvisitadores' },
        { name: 'Medicos', icon: <FaUserDoctor />, route: '/Gmedicos' },
        { name: 'Visitas', icon: <FaCalendarCheck />, route: '/Gvisitas' },
        { name: 'Productos', icon: <FaBoxesStacked />, route: '/Gproductos' },
        { name: 'Transacciones', icon: <FaFileInvoiceDollar />, route: '/Gtransacciones' },
        { name: 'Médicos Temp.', icon: <FaUserClock />, route: '/GmedicosTemporales' },
        { name: 'Metas', icon: <FaBullseye />, route: '/Gmetas' },
        { name: 'Métricas', icon: <FaChartLine />, route: '/Metricas' },
        { name: 'Usuarios', icon: <FaUserGear />, route: '/Gusuarios' },
    ];

    return (
        <div className="min-h-screen bg-[#F0F4FA] font-sans flex flex-col">
            <Head title="Panel Administrativo" />

            {/* HEADER COMPLETO (SÓLIDO) */}
            <header className="bg-[#4184F0] shadow-lg sticky top-0 z-50">
                <div className="w-full px-6 flex items-center justify-between h-20">

                    {/* LOGO SECCIÓN */}
                    {/* SECCIÓN DEL LOGO - ESTÁTICO */}
                    <div className="flex flex-col items-start leading-none select-none">
                        {/* Contenedor Principal (Simula el recuadro blanco de la imagen) */}
                        <div className="bg-white px-4 py-1.5 rounded-md shadow-sm mb-1">
                            <h1 className="text-[#00A1D9] font-sans font-bold text-lg md:text-xl tracking-tight uppercase">
                                La Farmacia <span className="font-light">Homeopática</span>
                            </h1>
                        </div>

                        {/* Eslogan (Debajo del recuadro) */}
                        <span className="text-white text-[9px] md:text-[11px] font-medium tracking-wider pl-1 italic opacity-90">
                            Más alternativas, más servicio
                        </span>
                    </div>


                    {/* MENÚ DESKTOP - ESTILO TABS */}
                    <nav className="hidden lg:flex h-full items-center">
                        {menuItems.map((item) => {
                            const isActive = url.startsWith(item.route);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.route}
                                    className={`group flex flex-col items-center justify-center px-5 h-full transition-all duration-200 border-b-4 relative overflow-hidden ${isActive
                                        ? 'bg-white/10 border-white text-white font-bold'
                                        : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {/* CAPA DE LUCESITAS / ESCARCHA (Solo si está activo) */}
                                    {isActive && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* Destellos rápidos */}
                                            <div
                                                className="absolute inset-0 animate-pulse opacity-40"
                                                style={{
                                                    backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1.5px)`,
                                                    backgroundSize: '12px 12px',
                                                }}
                                            />
                                            {/* Destellos lentos y desplazados para dar realismo */}
                                            <div
                                                className="absolute inset-0 animate-bounce opacity-30"
                                                style={{
                                                    backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1.5px)`,
                                                    backgroundSize: '18px 18px',
                                                    backgroundPosition: '5px 5px',
                                                    animationDuration: '3s'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Contenido: Icono y Texto (z-10 para estar por encima de las luces) */}
                                    <span className="text-xl mb-1 transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:scale-125 relative z-10">
                                        {item.icon}
                                    </span>

                                    <span className="text-[10px] uppercase font-semibold tracking-wider relative z-10 text-center">
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ACCIONES */}
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="group flex items-center gap-2 bg-white/10 hover:bg-red-500 transition-all px-4 py-2.5 rounded-md border border-white/20 hover:border-red-500"
                        >
                            <FaPowerOff className="text-white group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-white uppercase hidden md:block">Cerrar Sesión</span>
                        </Link>

                        {/* Toggle Móvil */}
                        <button
                            className="lg:hidden text-white text-3xl p-1"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <FaXmark /> : <FaBars />}
                        </button>
                    </div>
                </div>

                {/* MENÚ MÓVIL DESPLEGABLE (Full Width) */}
                {isOpen && (
                    <div className="lg:hidden bg-[#3436B5] border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-4">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.route}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 p-4 text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* ÁREA DE CONTENIDO */}
            <main className="flex-grow">
                {/* Cambiamos 'p-6' por 'px-6 pb-6' para quitar el espacio de arriba (pt-0) */}
                {/* En desktop 'md:p-8' por 'md:px-8 md:pb-8 md:pt-0' */}
                <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">

                    {/* Contenedor del contenido */}
                    <div className="bg-white shadow-md border border-gray-200 min-h-[calc(100vh-160px)] p-6">
                        {children}
                    </div>
                </div>
            </main>

            {/* FOOTER OPCIONAL (Para cerrar el diseño) */}
            <footer className="bg-white border-t border-gray-200 py-4 px-8 text-center text-gray-500 text-xs">
                &copy; {new Date().getFullYear()} AdminLFH Panel - Todos los derechos reservados.
            </footer>
        </div>
    );
};

export default PanelAdmin;