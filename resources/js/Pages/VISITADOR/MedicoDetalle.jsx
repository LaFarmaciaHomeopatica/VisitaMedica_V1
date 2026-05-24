import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BarraNave from './barranave';
// Importamos los iconos necesarios
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaPhoneFlip,
    FaLocationDot
} from 'react-icons/fa6';

const MedicoDetalle = ({ medico }) => {
    const [mostrarDetalles, setMostrarDetalles] = useState(false);
    const [search, setSearch] = useState('');

    if (!medico) return <div className="p-10 text-center font-bold text-[#5D8BF4]">Cargando...</div>;

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        router.get('/ListadoMedicos', { search: value }, {
            preserveState: true,
            replace: true,
            preserveScroll: true
        });
    };

    const googleMapsUrl = medico.geolocalizacion
        ? `https://www.google.com/maps/search/?api=1&query=${medico.geolocalizacion}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(medico.direccion_detalles || '')}`;

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-20 font-sans text-gray-800">
            <Head title={`Perfil - ${medico.nombre} ${medico.apellido}`} />

            {/* Header Adaptado con estilo de ListadoMedicos pero tamaño compacto */}
            <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px] md:rounded-b-[35px]">
                <div className="max-w-[1440px] mx-auto p-3 md:p-4">
                    <div className="flex items-center gap-3 md:gap-6">

                        {/* Botón Regresar - Estilo ListadoMedicos (Azul suave) */}
                        <Link
                            href="/ListadoMedicos"
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors shrink-0 shadow-sm"
                        >
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        {/* Título - Estilo ListadoMedicos */}
                        <h1 className="hidden sm:block text-[10px] md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
                            Ficha Médica
                        </h1>

                        {/* Barra de Búsqueda - Estilo ListadoMedicos */}
                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-[10px] md:text-xs" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Buscar medicina, médicos..."
                                className="w-full bg-blue-50 border-none rounded-full py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner"
                            />
                        </div>

                    </div>
                </div>
            </header>

            <main className="px-3 md:px-6 mt-3">
                <div className="max-w-6xl mx-auto w-full">
                    <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">

                        {/* SECCIÓN IZQUIERDA: Avatar e Info Básica */}
                        <div className="w-full md:w-[22%] p-4 flex flex-col items-center justify-center bg-gray-50/30 border-b md:border-b-0 md:border-r border-gray-100">
                            <div className="w-16 h-16 rounded-full bg-[#5D8BF4] flex items-center justify-center text-white text-2xl font-black mb-2 shadow-sm">
                                {medico.nombre ? medico.nombre.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <h2 className="text-sm font-bold text-gray-800 text-center leading-tight">
                                {medico.nombre + ' ' + medico.apellido}
                            </h2>
                            <p className="mt-1 text-[#5D8BF4] text-[9px] font-bold uppercase bg-blue-50 px-3 py-0.5 rounded-full">
                                {medico.especialidad}
                            </p>

                            <button
                                onClick={() => setMostrarDetalles(!mostrarDetalles)}
                                className="mt-3 flex items-center gap-2 md:hidden bg-[#5D8BF4] text-white px-4 py-1.5 rounded-xl text-[10px] font-bold"
                            >
                                {mostrarDetalles ? 'Cerrar' : 'Info'}
                            </button>
                        </div>

                        {/* SECCIÓN DERECHA: Datos Detallados */}
                        <div className={`w-full md:w-[78%] p-5 md:flex items-center ${mostrarDetalles ? 'block' : 'hidden md:flex'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">

                                {/* Columna 1 */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Documento</p>
                                        <p className="text-xs font-semibold text-gray-700">{medico.tipo_documento?.nombre + ' ' + medico.documento || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ID Registro</p>
                                        <p className="text-xs font-semibold text-gray-700">#{medico.id}</p>
                                    </div>
                                </div>

                                {/* Columna 2 */}
                                <div className="space-y-3 border-l-0 lg:border-l lg:pl-6 border-gray-50">
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Contacto Directo</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-semibold text-gray-800">{medico.telefono_contacto || '---'}</p>
                                            {medico.telefono_contacto && (
                                                <a href={`tel:${medico.telefono_contacto}`} className="text-green-500 hover:scale-110 transition-transform">
                                                    <FaPhoneFlip className="text-[10px]" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Horario de Atención</p>
                                        <p className="text-xs font-semibold text-gray-700">{medico.horario_atencion || 'No definido'}</p>
                                    </div>
                                </div>

                                {/* Columna 3 */}
                                <div className="border-l-0 lg:border-l lg:pl-6 border-gray-50 flex flex-col justify-center">
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Dirección de Consultorio</p>
                                    <div className="flex items-start gap-2">
                                        <p className="text-xs font-semibold text-gray-700 leading-tight">
                                            {medico.direccion_detalles || 'Sin dirección registrada'}
                                        </p>
                                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[#5D8BF4] shrink-0 hover:scale-110 transition-transform">
                                            <FaLocationDot className="text-[11px]" />
                                        </a>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section>

                    <div className="mt-3 px-4 opacity-20">
                        <span className="text-[8px] font-bold uppercase tracking-widest">por realizar (°_°)7</span>
                    </div>
                </div>
            </main>

            <BarraNave />
        </div>
    );
};

export default MedicoDetalle;