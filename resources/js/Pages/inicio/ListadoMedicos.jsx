import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BarraNave from './barranave';
// Importamos los iconos específicos
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaLocationDot,
    FaChevronRight,
    FaUserDoctor
} from 'react-icons/fa6';

const ListadoMedicos = ({ medicosDb = [], stats = { visitados: 0, total: 0 } }) => {
    const [search, setSearch] = useState('');

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);

        router.get('/ListadoMedicos', { search: value }, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

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

            {/* Header Optimizado y Ajustado */}
            <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px] md:rounded-b-[35px]">
                <div className="max-w-[1440px] mx-auto p-3 md:p-4">
                    <div className="flex items-center gap-3 md:gap-6">

                        {/* Botón Regresar */}
                        <Link
                            href="/panel"
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                        >
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        <div className="flex flex-col min-w-0 flex-grow md:flex-grow-0">
                            <h1 className="text-xs md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
                                Listado de Médicos
                            </h1>
                        </div>

                        {/* Barra de Búsqueda */}
                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text--[10px] md:text-xs" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Buscar medicina, médicos..."
                                className="w-full bg-blue-50 border-none rounded-full py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner font-medium text-gray-700 placeholder:text-gray-300"
                            />
                        </div>

                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 md:p-6 mt-2">
                {/* Cabecera para Desktop */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="col-span-4">Médico / Especialidad</div>
                    <div className="col-span-4 text-center">Dirección</div>
                    <div className="col-span-1 text-center">Documento</div>
                    <div className="col-span-1 text-center">Teléfono</div>
                    <div className="col-span-2 text-right">Acción</div>
                </div>

                <div className="space-y-3">
                    {medicosDb.length > 0 ? (
                        medicosDb.map((medico) => {
                            const config = getAvatarConfig(medico.id);
                            const inicial = medico.nombre_completo ? medico.nombre_completo.charAt(0).toUpperCase() : '?';

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
                                        <FaLocationDot className="text-blue-300 text-[10px]" />
                                        <span className="text-[11px] italic truncate">
                                            {medico.direccion_detalles || 'Sin dirección'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 mb-4 md:mb-0 md:contents">
                                        <div className="md:col-span-1 md:text-center">
                                            <div className="flex flex-col md:items-center">
                                                <span className="md:hidden text-[8px] font-bold text-gray-400 uppercase mb-0.5">Documento</span>
                                                <div className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    {medico.documento || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-1 md:text-center">
                                            <div className="flex flex-col md:items-center items-end">
                                                <span className="md:hidden text-[8px] font-bold text-gray-400 uppercase mb-0.5">Teléfono</span>
                                                <span className="text-[11px] font-bold text-gray-700">
                                                    {medico.telefono_contacto || '---'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <Link
                                            href={`/MedicoDetalle/${medico.id}`}
                                            className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-100 hover:bg-blue-600 active:scale-95 transition-all w-full md:w-auto text-[10px] font-bold uppercase"
                                        >
                                            <span>Ver Ficha</span>
                                            <FaChevronRight className="text-[8px]" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                            <FaUserDoctor className="text-4xl text-gray-200 mb-3 mx-auto block" />
                            <p className="text-gray-400 text-sm">No se encontraron médicos registrados.</p>
                        </div>
                    )}
                </div>
            </main>

            <BarraNave />
        </div>
    );
};

export default ListadoMedicos;