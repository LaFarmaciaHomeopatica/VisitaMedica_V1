import React from 'react';
import { FaUserDoctor, FaCalendarDays, FaCrown } from 'react-icons/fa6';

/**
 * Barra de pestañas de navegación del panel principal.
 */
const TabNav = ({ tabActiva, setTabActiva, totalMedicos, totalPendientes }) => {
    const tabs = [
        {
            id:    'agenda',
            label: `Mi Agenda (${totalMedicos})`,
            icon:  <FaUserDoctor size={14} />,
            activeColor: 'text-[#1C85E8]',
        },
        {
            id:    'pendientes',
            label: `Visitas Pendientes (${totalPendientes})`,
            icon:  <FaCalendarDays size={14} />,
            activeColor: 'text-[#02CFE3]',
        },
        
    ];

    return (
        <div className="flex gap-3 overflow-x-auto pb-2 mt-6 scrollbar-none">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setTabActiva(tab.id)}
                    className={`backdrop-blur-md px-5 py-2.5 rounded-2xl flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-all border shadow-md active:scale-95
                        ${tabActiva === tab.id
                            ? `bg-white ${tab.activeColor} border-white`
                            : 'bg-white/15 text-white hover:bg-white/25 border-white/10'}`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
    );
};

export default TabNav;