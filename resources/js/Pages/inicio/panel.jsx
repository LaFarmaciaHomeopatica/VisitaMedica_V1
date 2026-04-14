import React from 'react';
import { Link } from '@inertiajs/react';
import BarraNave from './barranave'; // <-- Importamos el componente
import '@fortawesome/fontawesome-free/css/all.min.css';

const DashboardLFH = () => {
    const modules = [
        { icon: 'fa-user-doctor', label: 'Médico', route: '/ListadoMedicos' },
        { icon: 'fa-briefcase', label: 'Mi Progreso', route: '/visitador' },
        { icon: 'fa-gears', label: 'Gestión Vistas', route: '/GestionVisita' },
        { icon: 'fa-pills', label: 'Producto', route: '/ProductoCatalogo' },

    ];

    return (
        // Quitamos md:pb-0 para que el contenido no choque con la barra en PC
        <div className="bg-slate-50 min-h-screen pb-24 font-sans">
            <header className="bg-white p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                        <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar medicina, médicos..."
                        className="w-full bg-blue-50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-400">
                        <i className="fa-solid fa-microphone"></i>
                    </span>
                </div>
            </header>

            <section className="bg-[#EBF2FF] p-8 rounded-b-[40px] max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <i className="fa-solid fa-user-tie text-blue-500 text-2xl"></i>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Bienvenido <span className="font-normal text-gray-600">Carlos</span>
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    <button className="bg-[#5D8BF4] text-white px-6 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors">
                        <i className="fa-solid fa-file-medical"></i> Reportes
                    </button>
                    <button className="bg-white text-blue-500 px-6 py-2 rounded-2xl border border-blue-100 flex items-center gap-2 whitespace-nowrap shadow-sm hover:bg-gray-50 transition-colors">
                        <i className="fa-solid fa-id-card"></i> Perfil
                    </button>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 -mt-4">
                <div className="bg-gray-100/80 backdrop-blur-sm text-gray-600 p-3 rounded-2xl text-center text-sm border border-white shadow-sm">
                    Próxima Visita Pendiente &rarr;
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-6 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {modules.map((module, index) => (
                        <Link
                            key={index}
                            href={module.route}
                            className="bg-white p-6 rounded-[32px] shadow-md shadow-gray-200/50 flex flex-col items-center text-center hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100 group"
                        >
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
                                <i className={`fa-solid ${module.icon} text-blue-500 text-3xl`}></i>
                            </div>
                            <span className="text-gray-700 font-medium">{module.label}</span>
                        </Link>
                    ))}
                </div>
            </main>

            {/* Llamamos a la barra aquí */}
            <BarraNave />
        </div>
    );
};

export default DashboardLFH;