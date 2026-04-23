import React, { useState, useEffect, useMemo } from 'react';
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
    const [cargando, setCargando] = useState(false);

    const visitadorInfo = visitador || {};

    // 🔄 Cargar visitas al montar el componente
    useEffect(() => {
        cargarVisitas();
    }, []);

    const cargarVisitas = async () => {
        try {
            const res = await axios.get('/visitas-json');
            setVisitas(res.data);
        } catch (error) {
            console.error("Error al cargar visitas:", error);
        }
    };

    // 📊 Cálculos memorizados para rendimiento
    // CORRECCIÓN: Se agrega 'meta' al objeto retornado
    const { visitadosHoy, pendientesHoy, porcentaje, idsVisitadosHoy, meta } = useMemo(() => {
        const hoyStr = new Date().toISOString().split('T')[0];

        // 1. Filtrar visitas efectivas del mes
        const visitasEfectivasMes = visitas.filter(v => v.estado === 'efectiva');

        // 2. IDs de médicos visitados hoy específicamente
        const idsHoy = visitasEfectivasMes
            .filter(v => v.fecha_programada.startsWith(hoyStr))
            .map(v => v.medico_id);

        // 3. Contadores para la lista actual
        const visitadosHoyCount = medicos.filter(m => idsHoy.includes(m.id)).length;
        const pendientesCount = medicos.length - visitadosHoyCount;

        // 4. Progreso Mensual
        const metaValor = visitadorInfo?.meta_visitas_mensual || 0;
        const calculoPorcentaje = metaValor > 0 ? Math.round((visitasEfectivasMes.length / metaValor) * 100) : 0;

        return {
            visitadosHoy: visitadosHoyCount,
            pendientesHoy: pendientesCount,
            porcentaje: calculoPorcentaje,
            idsVisitadosHoy: idsHoy,
            meta: metaValor // <--- Ahora 'meta' es accesible en el componente
        };
    }, [visitas, medicos, visitadorInfo]);

    // ✅ Validar si un médico específico fue visitado hoy
    const fueVisitado = (medicoId) => idsVisitadosHoy.includes(medicoId);

    // 🚀 Acción de Visitar
    const visitar = async (medicoId) => {
        if (cargando) return;
        setCargando(true);
        try {
            const hoy = new Date().toISOString().split('T')[0];

            const res = await axios.post('/visitas', {
                medico_id: medicoId,
                fecha_programada: hoy
            });

            const visitaId = res.data.id;
            await axios.post(`/visitas/${visitaId}/efectiva`, {
                estado: 'efectiva',
                comentarios: 'Visita realizada desde perfil rápido'
            });

            await cargarVisitas();

        } catch (error) {
            console.error("Error en el proceso de visita:", error);
        } finally {
            setCargando(false);
        }
    };

    const medicosFiltrados = medicos.filter(m =>
        m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.especialidad.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-24 font-sans relative overflow-x-hidden">
            <Head title="Mi Perfil - LFH" />

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
                            className="w-full bg-blue-50 border-none focus:ring-2 focus:ring-blue-200 rounded-full py-2 pl-9 pr-4 text-sm"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">

                <section className="bg-white p-5 rounded-[28px] shadow-sm relative overflow-hidden">

                    {pendientesHoy > 0 && (
                        <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-2xl text-xs font-bold shadow-md animate-pulse">
                            Pendientes: {pendientesHoy}
                        </div>
                    )}

                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-200">
                            <FaUser />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                {visitadorInfo?.nombre} {visitadorInfo?.apellido || 'Visitador'}
                            </h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                {visitadorInfo?.tipo_documento?.nombre}: {visitadorInfo?.documento || '---'}
                            </p>
                            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full 
                                ${visitadorInfo?.estado === 'Habilitado'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'}`}>
                                {visitadorInfo?.estado || 'Sin estado'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between items-end mb-1.5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">
                                Cumplimiento Mensual
                            </p>
                            <span className="text-blue-600 font-bold text-sm">{porcentaje}%</span>
                        </div>

                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${Math.min(porcentaje, 100)}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between text-[11px] mt-2 text-gray-500 font-medium">
                            {/* Aquí se usa 'meta' que ya está definido gracias al useMemo corregido */}
                            <span>{visitas.filter(v => v.estado === 'efectiva').length} de {meta} visitas</span>
                            <span>Meta: ${new Intl.NumberFormat().format(visitadorInfo?.meta_ventas_mensual || 0)}</span>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 px-1">MÉDICOS ASIGNADOS ({medicosFiltrados.length})</h3>
                    {medicosFiltrados.map((medico) => {
                        const visitado = fueVisitado(medico.id);
                        return (
                            <div key={medico.id} className="bg-white p-4 rounded-2xl flex gap-4 items-center shadow-sm border border-gray-50">
                                <div className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors
                                    ${visitado ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-500'}`}>
                                    {visitado ? <FaCheckDouble size={20} /> : <FaStethoscope size={20} />}
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-sm leading-tight">{medico.nombre}</h4>
                                    <p className="text-xs text-blue-500 font-medium mb-1">{medico.especialidad}</p>
                                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                        <FaLocationDot />
                                        {medico.direccion}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!visitado ? (
                                        <button
                                            onClick={() => visitar(medico.id)}
                                            disabled={cargando}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            {cargando ? '...' : 'Visitar'}
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-bold text-green-500 uppercase">Completado</span>
                                    )}

                                    <Link
                                        href={`/MedicoDetalle/${medico.id}`}
                                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-blue-500 transition-colors"
                                    >
                                        <FaChevronRight />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}

                    {medicosFiltrados.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm italic">
                            No se encontraron médicos en la agenda.
                        </div>
                    )}
                </section>
            </main>

            <div className="fixed bottom-24 right-6">
                <button className="bg-gray-900 text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                    <FaPlus size={20} />
                </button>
            </div>

            <BarraNave />
        </div>
    );
};

export default Visitador;