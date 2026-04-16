import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import BarraNave from './barranave';
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaCheckDouble,
    FaStethoscope,
    FaLocationDot,
    FaChevronRight,
    FaPlus,
    FaUser
} from 'react-icons/fa6';

const Visitador = ({ visitador = {}, medicos = [] }) => {
    const [busqueda, setBusqueda] = useState('');
    const [visitas, setVisitas] = useState([]);

    const visitadorInfo = visitador || {};

    // 🔥 CARGAR VISITAS
    useEffect(() => {
        cargarVisitas();
    }, []);

    const cargarVisitas = async () => {
        try {
            const res = await axios.get('/visitas');
            setVisitas(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // 🔥 VALIDAR SI YA FUE VISITADO
    const fueVisitado = (medicoId) => {
        return visitas.some(v =>
            v.medico_id === medicoId && v.estado === 'efectiva'
        );
    };

    // 🔥 CONTADORES REALES
    const totalMedicos = medicos.length;
    const visitadosHoy = medicos.filter(m => fueVisitado(m.id)).length;
    const pendientesHoy = totalMedicos - visitadosHoy;

    // 🔥 PORCENTAJE REAL
    const meta = visitadorInfo?.meta_visitas_mensual || 0;
    const porcentaje = meta > 0 ? Math.round((visitadosHoy / meta) * 100) : 0;

    // 🔥 ACCIÓN VISITAR
    const visitar = async (medicoId) => {
        try {
            const res = await axios.post('/visitas', {
                medico_id: medicoId,
                fecha_programada: new Date()
            });

            const visitaId = res.data.id;

            await axios.post(`/visitas/${visitaId}/efectiva`);

            await cargarVisitas(); // 🔄 actualiza sin recargar

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-20 font-sans relative overflow-x-hidden">
            <Head title="Mi Perfil - LFH" />

            {/* HEADER */}
            <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px]">
                <div className="max-w-[1440px] mx-auto p-4 flex items-center gap-4">
                    <Link href="/panel" className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500">
                        <FaArrowLeft />
                    </Link>

                    <div className="relative flex-grow">
                        <FaMagnifyingGlass className="absolute left-3 top-3 text-blue-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Buscar en mi agenda..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full bg-blue-50 rounded-full py-2 pl-9 pr-4 text-sm"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">

                {/* PERFIL */}
                <section className="bg-white p-5 rounded-[28px] shadow-sm relative">

                    {pendientesHoy > 0 && (
                        <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 rounded-bl-xl">
                            Pendientes: {pendientesHoy}
                        </div>
                    )}

                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl">
                            <FaUser />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold">
                                {visitadorInfo?.nombre_completo || 'Sin nombre'}
                            </h2>

                            <p className="text-sm text-gray-500">
                                CC: {visitadorInfo?.documento || 'N/A'}
                            </p>

                            <span className={`text-xs px-2 py-1 rounded 
                                ${visitadorInfo?.estado === 'Habilitado'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'}`}>
                                {visitadorInfo?.estado || 'Sin estado'}
                            </span>
                        </div>
                    </div>

                    {/* PROGRESO */}
                    <div className="mt-5">
                        <p className="text-xs text-gray-400 mb-1">
                            Cumplimiento de visitas
                        </p>

                        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${porcentaje}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between text-xs mt-1">
                            <span>{visitadosHoy} realizadas</span>
                            <span>{porcentaje}%</span>
                        </div>
                    </div>

                    {/* METAS */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <p className="text-xs text-blue-400">Meta visitas</p>
                            <p className="font-bold">{meta}</p>
                        </div>

                        <div className="bg-purple-50 p-3 rounded-xl">
                            <p className="text-xs text-purple-400">Meta ventas</p>
                            <p className="font-bold">
                                ${new Intl.NumberFormat().format(
                                    visitadorInfo?.meta_ventas_mensual || 0
                                )}
                            </p>
                        </div>
                    </div>

                </section>

                {/* MÉDICOS */}
                <section className="space-y-3">
                    {medicos.map((medico) => (
                        <div key={medico.id} className="bg-white p-3 rounded-xl flex gap-3 items-center">

                            <div className={`w-10 h-10 flex items-center justify-center rounded 
                                ${fueVisitado(medico.id) ? 'bg-green-100' : 'bg-blue-100'}`}>

                                {fueVisitado(medico.id)
                                    ? <FaCheckDouble />
                                    : <FaStethoscope />}
                            </div>

                            <div className="flex-1">
                                <h4 className="font-bold">{medico.nombre}</h4>
                                <p className="text-xs text-blue-500">{medico.especialidad}</p>
                                <p className="text-xs text-gray-400 flex gap-1">
                                    <FaLocationDot />
                                    {medico.direccion}
                                </p>
                            </div>

                            {/* BOTÓN VISITAR */}
                            {!fueVisitado(medico.id) && (
                                <button
                                    onClick={() => visitar(medico.id)}
                                    className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                                >
                                    Visitar
                                </button>
                            )}

                            <Link href={`/MedicoDetalle/${medico.id}`}>
                                <FaChevronRight />
                            </Link>
                        </div>
                    ))}
                </section>

            </main>

            <div className="fixed bottom-20 right-5">
                <button className="bg-black text-white w-12 h-12 rounded-xl">
                    <FaPlus />
                </button>
            </div>

            <BarraNave />
        </div>
    );
};

export default Visitador;