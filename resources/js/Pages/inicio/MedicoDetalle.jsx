import React from 'react';
import { Head, Link } from '@inertiajs/react';
import BarraNave from './barranave'; // <-- Importamos tu componente reusable

const MedicoDetalle = () => {
    // Datos simulados (RF - Información de Identificación y Estatus)
    const medico = {
        nombre: "Dr. Amit Kumar",
        especialidad: "Cardiólogo",
        rating: 4.5,
        visitadorAsignado: "Carlos Vives",
        fechaAsignacion: "12/01/2026",
        telefono: "+57 300 123 4567",
        direccion: "Clínica Portoazul, Consultorio 402, Barranquilla",
        horario: "Lun - Vie: 02:00 PM - 05:00 PM",
        formulacionTotal: "$4,500",
        unidades: "128",
    };

    const historialVisitas = [
        { fecha: "05/04/2026", tipo: "Presencial", resultado: "Exitoso" },
        { fecha: "20/03/2026", tipo: "Virtual", resultado: "Pendiente" },
        { fecha: "02/03/2026", tipo: "Presencial", resultado: "Exitoso" },
    ];

    const productosClave = [
        { nombre: "Cardio-Aspirina", lab: "Bayer", formulado: "60%" },
        { nombre: "Enapril 10mg", lab: "Genfar", formulado: "30%" },
        { nombre: "Omega 3 Pro", lab: "MK", formulado: "10%" },
    ];

    return (
        /* Ajustamos pb-28 para que el historial no se tape con la barra */
        <div className="bg-[#F4F7FF] min-h-screen pb-28 font-sans">
            <Head title={`Perfil - ${medico.nombre}`} />

            {/* Header con estilo de la imagen de referencia */}
            <div className="bg-white p-6 rounded-b-[40px] shadow-sm">
                <div className="flex items-center justify-between mb-6 text-blue-500">
                    <Link href="/ListadoMedicos" className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-full">
                        <i className="fa-solid fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-lg font-bold text-gray-800">Ficha del Médico</h1>
                    <button className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-full">
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                        <img
                            src="https://ui-avatars.com/api/?name=Amit+Kumar&background=5D8BF4&color=fff&size=128"
                            className="w-24 h-24 rounded-full border-4 border-blue-100 shadow-lg"
                            alt="Doctor"
                        />
                        <span className="absolute bottom-0 right-0 bg-yellow-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                            <i className="fa-solid fa-star"></i> {medico.rating}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">{medico.nombre}</h2>
                    <p className="text-blue-500 font-medium text-sm">{medico.especialidad}</p>

                    {/* RF - Estatus de Asignación */}
                    <div className="mt-4 bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2">
                        <i className="fa-solid fa-briefcase text-blue-400 text-xs"></i>
                        <p className="text-[11px] text-gray-600">
                            Asignado a: <span className="font-bold">{medico.visitadorAsignado}</span>
                            <span className="text-gray-400 ml-1">({medico.fechaAsignacion})</span>
                        </p>
                    </div>
                </div>
            </div>

            <main className="px-6 mt-6 space-y-6">

                {/* RF - Resumen de Formulación */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="bg-[#5D8BF4] p-4 rounded-[24px] text-white shadow-lg shadow-blue-200">
                        <p className="text-[10px] opacity-80 uppercase font-bold mb-1">Total Formulado</p>
                        <h3 className="text-xl font-bold">{medico.formulacionTotal}</h3>
                        <i className="fa-solid fa-chart-line mt-2 opacity-30"></i>
                    </div>
                    <div className="bg-white p-4 rounded-[24px] border border-blue-50 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Unidades</p>
                        <h3 className="text-xl font-bold text-gray-700">{medico.unidades}</h3>
                        <div className="w-full bg-blue-100 h-1 rounded-full mt-3">
                            <div className="bg-blue-500 w-2/3 h-full rounded-full"></div>
                        </div>
                    </div>
                </section>

                {/* RF - Datos de Ubicación y Contacto */}
                <section className="bg-white p-5 rounded-[28px] shadow-sm space-y-4 border border-gray-50">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <i className="fa-solid fa-circle-info text-blue-400"></i> Información de Contacto
                    </h3>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                            <i className="fa-solid fa-location-dot"></i>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-600 leading-tight">{medico.direccion}</p>
                            <button className="text-blue-500 text-[10px] font-bold mt-1 uppercase">Ver en Mapas</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                            <i className="fa-solid fa-clock"></i>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{medico.horario}</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-500">
                                <i className="fa-solid fa-phone"></i>
                            </div>
                            <p className="text-xs text-gray-600 font-bold">{medico.telefono}</p>
                        </div>
                        <button className="bg-blue-500 text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-md">LLAMAR</button>
                    </div>
                </section>

                {/* RF - Análisis de Formulación */}
                <section>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 px-2">Análisis de Formulación</h3>
                    <div className="bg-white rounded-[28px] overflow-hidden border border-gray-50 shadow-sm">
                        {productosClave.map((prod, i) => (
                            <div key={i} className="p-4 flex items-center justify-between border-b border-gray-50 last:border-0">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-700">{prod.nombre}</h4>
                                    <p className="text-[10px] text-gray-400">Lab: {prod.lab}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-blue-500">{prod.formulado}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* RF - Historial de Visitas */}
                <section>
                    <div className="flex justify-between items-center mb-3 px-2">
                        <h3 className="text-sm font-bold text-gray-800">Últimas Visitas</h3>
                        <button className="text-[10px] text-blue-500 font-bold">VER TODO</button>
                    </div>
                    <div className="space-y-2">
                        {historialVisitas.map((visita, i) => (
                            <div key={i} className="bg-white p-3 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${visita.resultado === 'Exitoso' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                    <p className="text-xs font-bold text-gray-700">{visita.fecha}</p>
                                </div>
                                <span className="text-[10px] text-gray-400">{visita.tipo}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Invocamos el componente de la barra abajo */}
            <BarraNave />
        </div>
    );
};

export default MedicoDetalle;