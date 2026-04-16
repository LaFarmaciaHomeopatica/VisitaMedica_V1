import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import BarraNave from './barranave';
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaCheckDouble,
    FaStethoscope,
    FaLocationDot,
    FaChevronRight,
    FaPlus,
    FaCircle
} from 'react-icons/fa6';

const PerfilVisitador = () => {
    const [busqueda, setBusqueda] = useState('');

    const medicos = [
        { id: 1, nombre: 'Dr. Alejandro Sans', esp: 'Cardiología', dir: 'Clínica Portoazul, Cons. 204', zona: 'Norte', visitado: true },
        { id: 2, nombre: 'Dra. Beatriz Luna', esp: 'Pediatría', dir: 'Edificio Médico del Mar', zona: 'Centro', visitado: false },
        { id: 3, nombre: 'Dr. Carlos Vives', esp: 'Ginecología', dir: 'Hosp. Universidad del Norte', zona: 'Sur', visitado: false },
        { id: 4, nombre: 'Dra. Elena Rose', esp: 'Dermatología', dir: 'Centro Médico Alomar', zona: 'Norte', visitado: true },
    ];

    const totalMedicos = medicos.length;
    const visitadosHoy = medicos.filter(m => m.visitado).length;

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-20 font-sans relative overflow-x-hidden">
            <Head title="Mi Progreso - LFH" />

            {/* Header Unificado - Estilo ListadoMedicos */}
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

                        {/* Título */}
                        <h1 className="hidden sm:block text-[10px] md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
                            Mi Progreso
                        </h1>

                        {/* Barra de Búsqueda Flexible */}
                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-[10px] md:text-xs" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar médico o especialidad..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-blue-50 border-none rounded-full py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner font-medium text-gray-700 placeholder:text-gray-300"
                            />
                        </div>

                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 mt-4 space-y-4">

                {/* Hero Section */}
                <section className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col items-center md:items-start shrink-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <FaCircle className="text-[5px] text-[#5D8BF4]" />
                            <p className="text-[8px] text-blue-500 font-black uppercase tracking-widest">Zona Actual</p>
                        </div>
                        <h2 className="text-xl font-black text-gray-900 leading-tight">Norte</h2>
                        <p className="text-gray-400 text-[9px] font-bold italic">Barrio Alto Prado</p>
                    </div>

                    <div className="flex flex-row gap-3 w-full md:w-auto">
                        <div className="bg-blue-50/50 p-2.5 px-4 rounded-[18px] border border-blue-100 flex-1 md:w-40">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[7px] font-black text-blue-600 uppercase">Visitas</span>
                                <span className="text-[9px] font-black text-gray-800">{visitadosHoy}/{totalMedicos}</span>
                            </div>
                            <div className="w-full bg-blue-100/50 h-1 rounded-full overflow-hidden">
                                <div
                                    className="bg-[#5D8BF4] h-full rounded-full transition-all"
                                    style={{ width: `${(visitadosHoy / totalMedicos) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-green-50/50 p-2.5 px-4 rounded-[18px] border border-green-100 flex-1 md:w-44">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[7px] font-black text-green-600 uppercase">Ventas Hoy</span>
                                <span className="text-[9px] font-black text-gray-800">$2.5M</span>
                            </div>
                            <div className="w-full bg-green-100/50 h-1 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: '62.5%' }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Listado de Médicos */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-gray-900 font-black text-[10px] uppercase tracking-widest">Asignados</h3>
                        <div className="bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                            <span className="text-[8px] text-orange-500 font-black uppercase">
                                {totalMedicos - visitadosHoy} Pendientes
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {medicos.map((medico) => (
                            <div
                                key={medico.id}
                                className="bg-white p-3.5 rounded-[22px] shadow-sm border border-gray-50 flex items-center gap-3 group transition-all active:scale-[0.98] hover:border-blue-100"
                            >
                                <div className={`w-11 h-11 rounded-[15px] flex items-center justify-center text-base shrink-0 transition-colors
                                    ${medico.visitado
                                        ? 'bg-green-50 text-green-500'
                                        : 'bg-blue-50 text-[#5D8BF4]'}`}>
                                    {medico.visitado ? <FaCheckDouble /> : <FaStethoscope />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[12px] font-black text-gray-900 leading-tight truncate group-hover:text-[#5D8BF4] transition-colors">
                                        {medico.nombre}
                                    </h4>
                                    <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mt-0.5">{medico.esp}</p>
                                    <p className="text-[8px] text-gray-400 flex items-center gap-1 mt-0.5 truncate font-medium">
                                        <FaLocationDot className="text-[7px] text-gray-300" />
                                        {medico.dir}
                                    </p>
                                </div>

                                <Link
                                    href="/MedicoDetalle"
                                    className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl group-hover:bg-[#5D8BF4] group-hover:text-white transition-all"
                                >
                                    <FaChevronRight className="text-[8px]" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Botón Flotante Compacto */}
            <div className="fixed bottom-24 right-5 z-40">
                <button className="bg-gray-900 w-12 h-12 rounded-[18px] shadow-xl text-white flex items-center justify-center text-base active:scale-90 hover:bg-black transition-all">
                    <FaPlus />
                </button>
            </div>

            <BarraNave />
        </div>
    );
};

export default PerfilVisitador;