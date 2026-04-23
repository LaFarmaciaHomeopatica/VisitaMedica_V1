import React, { useState } from 'react';
import { Link, usePage, Head } from '@inertiajs/react';
import BarraNave from './barranave';
// Importamos los iconos necesarios
import {
    FaMagnifyingGlass,
    FaMicrophone,
    FaUserTie,
    FaFileMedical,
    FaPowerOff,
    FaUserDoctor,
    FaBriefcase,
    FaGears,
    FaPills
} from 'react-icons/fa6';

const DashboardLFH = () => {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');

    const modules = [
        { icon: <FaUserDoctor />, label: 'Médico', route: '/ListadoMedicos' },
        { icon: <FaBriefcase />, label: 'Mi Progreso', route: '/visitador' },
        { icon: <FaGears />, label: 'Gestión Vistas', route: '/GestionVisita' },
        { icon: <FaPills />, label: 'Producto', route: '/ProductoCatalogo' },
    ];

    // Esta es la variable que trae el nombre desde la DB
    const rolActual = auth.user.rol_nombre;

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-24 font-sans text-gray-800">
            <Head title="Dashboard - LFH" />

            {/* Header Unificado - Estilo ListadoMedicos */}
            <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[30px] md:rounded-b-[40px]">
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">

                        <div className="hidden md:flex flex-col min-w-0 flex-grow md:flex-grow-0">
                            <h1 className="text-xs md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
                                Panel de Control
                            </h1>
                        </div>

                        {/* Barra de Búsqueda Flexible */}
                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs md:text-sm" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar medicina, médicos..."
                                className="w-full bg-blue-50 border-none rounded-full py-3 pl-12 pr-12 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner"
                            />
                        </div>

                    </div>
                </div>
            </header>

            {/* Hero Section con Estilo Mejorado */}
            <section className="bg-[#EBF2FF] p-8 rounded-b-[40px] max-w-5xl mx-auto shadow-inner border-x border-b border-blue-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-blue-100">
                            <FaUserTie className="text-[#5D8BF4] text-2xl" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-[#5D8BF4] text-white text-[8px] font-bold px-2 py-1 rounded-full border border-white uppercase tracking-tighter">
                            {/* CORRECCIÓN: Se usa rolActual en lugar de la función inexistente */}
                            {rolActual}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 leading-tight">
                            Bienvenido, <br />

                            <span className="text-[#5D8BF4] capitalize">
                                {auth.user.nombre} {auth.user.apellido}
                                <span className="text-gray-400 text-sm font-medium ml-2">
                                    ({auth.user.username})
                                </span>
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <button className="bg-[#5D8BF4] text-white px-6 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-200/50 hover:bg-blue-600 active:scale-95 transition-all text-xs font-bold uppercase tracking-wide">
                        <FaFileMedical /> Reportes
                    </button>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="bg-white text-red-500 px-6 py-2 rounded-2xl border border-red-100 flex items-center gap-2 whitespace-nowrap shadow-sm hover:bg-red-50 active:scale-95 transition-all text-xs font-bold uppercase tracking-wide"
                    >
                        <FaPowerOff /> Salir
                    </Link>
                </div>
            </section>

            {/* Aviso de Próxima Visita */}
            <div className="max-w-4xl mx-auto px-6 -mt-4">
                <div className="bg-white/90 backdrop-blur-sm text-gray-600 p-3 rounded-2xl text-center text-[11px] font-medium border border-blue-50 shadow-xl shadow-blue-100/50">
                    <span className="font-black text-blue-500 uppercase tracking-widest mr-2">Próxima Visita Pendiente</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-gray-400"> Revisa tu agenda para hoy</span>
                </div>
            </div>

            {/* Módulos Principales */}
            <main className="max-w-5xl mx-auto p-6 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {modules.filter(m => m.label.toLowerCase().includes(search.toLowerCase())).map((module, index) => (
                        <Link
                            key={index}
                            href={module.route}
                            className="bg-white p-6 rounded-[32px] shadow-md shadow-blue-100/20 flex flex-col items-center text-center hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100 group active:scale-95"
                        >
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white transition-colors shadow-inner">
                                <div className="text-[#5D8BF4] text-3xl group-hover:scale-110 transition-transform">
                                    {module.icon}
                                </div>
                            </div>
                            <span className="text-gray-700 font-black text-[11px] uppercase tracking-wider">{module.label}</span>
                        </Link>
                    ))}
                </div>
            </main>

            <BarraNave />
        </div>
    );
};

export default DashboardLFH;