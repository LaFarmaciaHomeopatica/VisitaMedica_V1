import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react'; // Importamos router para la búsqueda
import BarraNave from './barranave';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Recibimos 'medicosDb' y 'stats' desde el controlador
const ListadoMedicos = ({ medicosDb = [], stats = { visitados: 0, total: 0 } }) => {
    const [search, setSearch] = useState('');

    // Función para manejar la búsqueda (envía la consulta a Laravel)
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);

        // Esto recarga la página con el parámetro de búsqueda sin perder el estado
        router.get('/medicos', { search: value }, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    // Función para generar colores aleatorios fijos basados en el ID
    const getAvatarConfig = (id) => {
        const configs = [
            { bg: "bg-blue-100", text: "text-blue-600" },
            { bg: "bg-indigo-100", text: "text-indigo-600" },
            { bg: "bg-purple-100", text: "text-purple-600" },
            { bg: "bg-cyan-100", text: "text-cyan-600" },
        ];
        return configs[id % configs.length];
    };

    return (
        <div className="bg-[#F4F7FF] min-h-screen font-sans text-gray-800 pb-28">
            <Head title="Directorio Médico - LFH" />

            {/* Header Superior */}
            <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[40px]">
                <div className="p-5 w-full max-w-[1440px] mx-auto text-center">
                    <div className="flex items-center gap-4 mb-6 text-blue-500">
                        <Link href="/panel" className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full shrink-0">
                            <i className="fa-solid fa-arrow-left text-sm"></i>
                        </Link>
                        <h1 className="text-sm font-black text-[#5D8BF4] uppercase tracking-[0.2em]">
                            Listado de Médicos
                        </h1>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <div className="relative w-full max-w-[300px] h-12">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <i className="fa-solid fa-magnifying-glass text-xs"></i>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Buscar médico o especialidad..."
                                className="w-full h-full bg-blue-50 border-none rounded-2xl pl-11 pr-4 text-[13px] focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-inner"
                            />
                        </div>

                        {/* Contador Dinámico */}
                        <div className="bg-[#5D8BF4] h-12 px-5 rounded-2xl text-white shadow-lg shadow-blue-200 flex items-center gap-3 shrink-0">
                            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                                <i className="fa-solid fa-calendar-check text-[10px]"></i>
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] opacity-90 uppercase font-bold tracking-wider leading-none mb-0.5">Visitados</p>
                                <h3 className="text-sm font-bold leading-none">
                                    {stats.visitados}/{stats.total}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1440px] mx-auto p-4 md:p-6 mt-2">
                <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="col-span-4">Médico / Especialidad</div>
                    <div className="col-span-4 text-center">Dirección</div>
                    <div className="col-span-1 text-center">Última Visita</div>
                    <div className="col-span-1 text-center">Formulados</div>
                    <div className="col-span-2 text-right">Acción</div>
                </div>

                <div className="space-y-3">
                    {medicosDb.length > 0 ? (
                        medicosDb.map((medico) => {
                            const config = getAvatarConfig(medico.id);
                            const inicial = medico.nombre_completo.charAt(0).toUpperCase();

                            return (
                                <div
                                    key={medico.id}
                                    className="bg-white p-4 rounded-[24px] border border-gray-50 shadow-sm md:grid md:grid-cols-12 md:gap-4 md:items-center hover:shadow-md transition-shadow"
                                >
                                    <div className="col-span-4 flex items-center gap-3 mb-3 md:mb-0">
                                        <div className={`w-10 h-10 ${config.bg} rounded-full flex items-center justify-center ${config.text} font-bold text-sm shadow-inner shrink-0`}>
                                            {inicial}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[13px] font-bold text-gray-800 truncate">
                                                {medico.nombre_completo}
                                            </span>
                                            <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-tight">
                                                {medico.especialidad}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-4 mb-3 md:mb-0 flex items-center gap-2 md:justify-center text-gray-500">
                                        <i className="fa-solid fa-location-dot text-blue-300 text-[10px]"></i>
                                        <span className="text-[11px] italic truncate">
                                            {medico.direccion_detalles || 'Sin dirección'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 mb-4 md:mb-0 md:contents">
                                        <div className="md:col-span-1 md:text-center">
                                            <div className="flex flex-col md:items-center">
                                                <span className="md:hidden text-[8px] font-bold text-gray-400 uppercase mb-0.5">Últ. Visita</span>
                                                <div className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    {medico.ultima_visita || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-1 md:text-center">
                                            <div className="flex flex-col md:items-center items-end">
                                                <span className="md:hidden text-[8px] font-bold text-gray-400 uppercase mb-0.5">Formulados</span>
                                                <span className="text-base font-black text-gray-800">
                                                    {medico.formulados_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <Link
                                            href={`/medicos/${medico.id}`}
                                            className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-100 hover:bg-blue-600 active:scale-95 transition-all w-full md:w-auto text-[10px] font-bold uppercase"
                                        >
                                            <span>Ver Ficha</span>
                                            <i className="fa-solid fa-chevron-right text-[8px]"></i>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            No se encontraron médicos.
                        </div>
                    )}
                </div>
            </main>

            <BarraNave />
        </div>
    );
};

export default ListadoMedicos;