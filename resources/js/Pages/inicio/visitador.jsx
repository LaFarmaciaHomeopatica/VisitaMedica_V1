import React from 'react';
import { Head, Link } from '@inertiajs/react';
import BarraNave from './barranave';

const PerfilVisitador = () => {
    const medicos = [
        { id: 1, nombre: 'Dr. Alejandro Sans', esp: 'Cardiología', dir: 'Clínica Portoazul, Cons. 204', zona: 'Norte', visitado: true },
        { id: 2, nombre: 'Dra. Beatriz Luna', esp: 'Pediatría', dir: 'Edificio Médico del Mar', zona: 'Centro', visitado: false },
        { id: 3, nombre: 'Dr. Carlos Vives', esp: 'Ginecología', dir: 'Hosp. Universidad del Norte', zona: 'Sur', visitado: false },
        { id: 4, nombre: 'Dra. Elena Rose', esp: 'Dermatología', dir: 'Centro Médico Alomar', zona: 'Norte', visitado: true },
    ];

    const totalMedicos = medicos.length;
    const visitadosHoy = medicos.filter(m => m.visitado).length;

    return (
        <div className="bg-[#F8FAFF] min-h-screen pb-28 font-sans">
            <Head title="Mi Progreso - LFH" />

            {/* Header con Título Ajustado */}
            <div className="p-4 flex items-center justify-between">
                <Link href="/panel" className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full">
                    <i className="fa-solid fa-arrow-left text-sm"></i>
                </Link>
                {/* Título más grande y azul */}
                <h1 className="text-sm font-black text-[#5D8BF4] uppercase tracking-[0.2em]">
                    Mi Progreso
                </h1>
                <div className="w-8"></div>
            </div>

            {/* Hero Section: Horizontal y Esbelto */}
            <div className="px-6 mb-6">
                <div className="bg-white p-4 md:p-5 rounded-[24px] shadow-md shadow-blue-100/40 border border-blue-50 flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Info de Zona (Izquierda) */}
                    <div className="flex flex-col items-center md:items-start shrink-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Zona Actual</p>
                        </div>
                        <h2 className="text-xl font-black text-gray-800 leading-tight">Norte</h2>
                        <p className="text-gray-400 text-[10px] font-medium italic">Barrio Alto Prado</p>
                    </div>

                    {/* Contenedores en Horizontal (Derecha) */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="bg-blue-50/40 p-2.5 px-4 rounded-xl border border-blue-100 flex-1 md:w-48">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[8px] font-black text-blue-600 uppercase">Visitas</span>
                                <span className="text-[10px] font-black text-gray-800">{visitadosHoy} / {totalMedicos}</span>
                            </div>
                            <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${(visitadosHoy / totalMedicos) * 100}%` }}></div>
                            </div>
                        </div>

                        <div className="bg-green-50/40 p-2.5 px-4 rounded-xl border border-green-100 flex-1 md:w-56">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[8px] font-black text-green-600 uppercase">Ventas</span>
                                <span className="text-[10px] font-black text-gray-800">2.5M / 4M</span>
                            </div>
                            <div className="w-full bg-green-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: '62.5%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Listado de Médicos */}
            <div className="px-6">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-gray-800 font-black text-[11px] uppercase tracking-wider">Médicos Asignados</h3>
                    <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded-md">
                        <span className="text-[9px] text-orange-500 font-bold uppercase">{totalMedicos - visitadosHoy} Pendientes</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {medicos.map((medico) => (
                        <div
                            key={medico.id}
                            className="bg-white p-4 rounded-[22px] shadow-sm border border-gray-50 flex items-center gap-4 group transition-all"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0
                                ${medico.visitado
                                    ? 'bg-green-50 text-green-500'
                                    : 'bg-blue-50 text-blue-500'}`}>
                                <i className={`fa-solid ${medico.visitado ? 'fa-check-double' : 'fa-stethoscope'}`}></i>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-bold text-gray-800 leading-tight truncate">{medico.nombre}</h4>
                                <p className="text-[10px] text-blue-500 font-bold uppercase mt-0.5">{medico.esp}</p>
                                <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-1 truncate italic">
                                    <i className="fa-solid fa-location-dot text-[8px] text-gray-300"></i> {medico.dir}
                                </p>
                            </div>

                            <div className="shrink-0">
                                <Link
                                    href="/MedicoDetalle"
                                    className="inline-flex items-center gap-2 bg-[#5D8BF4] hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-100 active:scale-95 transition-all"
                                >
                                    <span>Ver</span>
                                    <i className="fa-solid fa-chevron-right text-[8px]"></i>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Botón Flotante */}
            <div className="fixed bottom-28 right-6 z-40">
                <button className="bg-gray-900 w-12 h-12 rounded-xl shadow-lg text-white flex items-center justify-center text-lg active:scale-90 transition-all">
                    <i className="fa-solid fa-plus"></i>
                </button>
            </div>

            <BarraNave />
        </div>
    );
};

export default PerfilVisitador;