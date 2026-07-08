import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    FaHouse,
    FaUserDoctor,
    FaCalendarCheck,
    FaBars,
    FaXmark,
    FaPowerOff, // Icono de apagado / cerrar sesión
    FaRankingStar, // Icono de ranking (puedes cambiarlo por otro si prefieres)
    FaBell, // Icono de alertas
    FaArrowsRotate, // Icono de actualizar
} from 'react-icons/fa6';

const BottomNavigation = () => {
    const { url } = usePage();
    const [isOpen, setIsOpen] = useState(false);
    const [actualizando, setActualizando] = useState(false);

    const navIcons = [
    { icon: <FaHouse />, label: 'Inicio', route: '/panel' },
    { icon: <FaCalendarCheck />, label: 'Visitas', route: '/MisVisitas' },
    { icon: <FaUserDoctor />, label: 'Médicos', route: '/ListadoMedicos' },
    { icon: <FaRankingStar />, label: 'Top Medicos', route: '/visitador/top-medicos' }, // ← Nueva ruta del Ranking
    { icon: <FaBell />, label: 'Alertas', route: '/visitador/alertas' }, // ← Nueva ruta de Alertas
];

    // Configuración del botón de salida (Inertia por defecto usa POST para logout)
    const logoutAction = {
        icon: <FaPowerOff />,
        label: 'Salir',
        route: '/logout', // Cambia esto por tu ruta real de logout (ej: route('logout'))
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    // ── Actualización masiva: borra la caché de Odoo del visitador ──
    // Cada página (Top Médicos / Detalle) recalculará sola cuando se visite,
    // gracias al mismo mecanismo de carga perezosa (lazy) que ya usan.
    const handleActualizarTodo = () => {
        if (actualizando) return;

        setActualizando(true);
        router.post('/visitador/refrescar-todo', {}, {
            preserveScroll: true,
            preserveState: false, // fuerza que la página actual vuelva a pedir sus props (incluyendo las lazy)
            onFinish: () => setActualizando(false),
            onSuccess: () => setIsOpen(false),
        });
    };

    return (
        
 <> {/* --- MÓVIL: MENÚ FLOTANTE IZQUIERDA --- */}
          
<div className="fixed bottom-6 left-6 z-50 sm:hidden pointer-events-none">
    {/* Lista de enlaces vertical */}
    <div className={`flex flex-col-reverse gap-3 mb-16 transition-all duration-300 origin-bottom-left ${isOpen
        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 scale-75 translate-y-10 pointer-events-none'
        }`}>        
        
        {/* Botón de Salir (Mantiene estética de advertencia pero limpia) */}
        <Link
            href={logoutAction.route}
            method="post"
            as="button"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl shadow-xl bg-white/90 backdrop-blur-md border border-red-100 text-red-500 active:bg-red-50"
        >
            <div className="text-xl">{logoutAction.icon}</div>
            <span className="text-xs font-bold pr-2">{logoutAction.label}</span>
        </Link>

        {/* Botón de Actualizar Datos (masivo, borra caché de Odoo) */}
        <button
            type="button"
            onClick={handleActualizarTodo}
            disabled={actualizando}
            className="flex items-center gap-3 p-3 rounded-2xl shadow-xl bg-white/90 backdrop-blur-md border border-amber-100 text-amber-600 active:bg-amber-50 disabled:opacity-60"
        >
            <div className={`text-xl ${actualizando ? 'animate-spin' : ''}`}>
                <FaArrowsRotate />
            </div>
            <span className="text-xs font-bold pr-2">
                {actualizando ? 'Actualizando...' : 'Actualizar datos'}
            </span>
        </button>

        {/* Enlaces del menú */}
        {navIcons.map((nav, index) => {
            const isActive = url === nav.route || url.startsWith(`${nav.route}/`);
            return (
                <Link
    key={index}
    href={nav.route}
    onClick={() => setIsOpen(false)}
    className={`flex items-center gap-3 p-3 rounded-2xl shadow-md transition-all border
        ${isActive
            // SI ESTÁ ACTIVO: Fondo verde claro con texto e icono en verde oscuro
            ? 'bg-green-100 text-green-700 border-green-200'
            // POR DEFECTO (INACTIVO): Fondo azul claro suave con texto e icono en azul elegante
            : 'bg-blue-50 text-blue-600 border-blue-100 active:bg-blue-100'
        }`}
>
    {/* Icono: Hereda automáticamente el color del texto (text-green-700 o text-blue-600) */}
    <div className="text-xl">
        {nav.icon}
    </div>
    
    <span className="text-xs font-bold pr-2">{nav.label}</span>
</Link>
            );
        })}
    </div>

    {/* BOTÓN HAMBURGUESA CON TU DEGRADADO */}
    <button
        onClick={toggleMenu}
        className={`fixed bottom-5 left-5 z-50 w-14 h-14 flex items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 text-white pointer-events-auto
         ${isOpen 
            ? 'bg-red-500' // Se vuelve rojo al abrir para indicar cierre claro
            : 'bg-gradient-to-b from-[#1C85E8] via-[#02CFE3] to-[#02CFE3] hover:scale-105'
         }`}
    >
        {isOpen ? (
            <FaXmark size={24} className="animate-in fade-in zoom-in duration-300" />
        ) : (
            <FaBars size={24} className="animate-in fade-in zoom-in duration-300" />
        )}
    </button>
</div>

            {/* --- DESKTOP: BARRA HORIZONTAL --- */}
            <div className="hidden sm:flex fixed bottom-6 left-0 right-0 justify-center z-50 px-4 pointer-events-none">
<nav className="bg-[#1C85E8]/90 backdrop-blur-lg border border-white/20 p-2 px-6 flex justify-around items-center gap-4 rounded-[35px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] max-w-fit transition-all duration-300 pointer-events-auto">                    {navIcons.map((nav, index) => {
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
                                </span  >
                                {isActive && (
                                    <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                )}
                            </Link>
                        );
                    })}

                    {/* Separador visual antes del botón de actualizar/salir en Desktop */}
                    <div className="h-6 w-[1px] bg-white/20 self-center mx-1" />

                    {/* Botón de Actualizar Datos en Desktop */}
                    <button
                        type="button"
                        onClick={handleActualizarTodo}
                        disabled={actualizando}
                        className="relative flex flex-col items-center gap-1 p-2 min-w-[70px] transition-all duration-300 group hover:scale-105 text-white/60 hover:text-white disabled:opacity-60"
                    >
                        <div className={`text-xl transition-all duration-300 ${actualizando ? 'animate-spin' : ''}`}>
                            <FaArrowsRotate />
                        </div>
                        <span className="text-[10px] font-bold transition-all duration-300 text-center">
                            {actualizando ? 'Actualizando' : 'Actualizar'}
                        </span>
                    </button>

                    {/* Separador visual antes del botón de salir en Desktop */}
                    <div className="h-6 w-[1px] bg-white/20 self-center mx-1" />

                    {/* Botón de Salir en Desktop */}
                    <Link
                        href={logoutAction.route}
                        method="post"
                        as="button"
                        className="relative flex flex-col items-center gap-1 p-2 min-w-[60px] transition-all duration-300 group hover:scale-105 text-red-200 hover:text-red-400"
                    >
                        <div className="text-xl transition-all duration-300">
                            {logoutAction.icon}
                        </div>
                        <span className="text-[10px] font-bold transition-all duration-300 text-center">
                            {logoutAction.label}
                        </span>
                    </Link>
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