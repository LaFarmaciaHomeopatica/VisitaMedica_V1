import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { FaPlus, FaArrowLeft, FaMagnifyingGlass, FaCalendarCheck } from 'react-icons/fa6';
import BarraNave from '../barranave';
import { useMisVisitas } from './HooksMv/useMisVisitas';

import VisitasList          from './ComponentsMv/VisitasList';
import CalendarSection      from './ComponentsMv/CalendarSection';
import ModalNuevaVisita     from './ComponentsMv/ModalNuevaVisita';
import ModalGestionarVisita from './ComponentsMv/ModalGestionarVisita';
import ModalGestionarEvento from './ComponentsMv/ModalGestionarEvento';

const MisVisitas = ({ visitas: visitasDB = [], eventos: eventosDB = [], medicosDisponibles = [], productos = [] }) => {
    const logic = useMisVisitas(visitasDB, eventosDB, medicosDisponibles);

    // Auto-abrir modal y seleccionar el médico cuando viene desde la URL (?medico_id=X)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const rawMedicoId = urlParams.get('medico_id');

        if (rawMedicoId) {
            // Buscamos si existe el médico para matchear exactamente el ID (number o string)
            const medicoEncontrado = (medicosDisponibles || []).find(
                (doc) => String(doc.id) === String(rawMedicoId)
            );

            const targetId = medicoEncontrado ? medicoEncontrado.id : rawMedicoId;

            // 1. Establecemos la pestaña 'visita' y abrimos el modal directamente (sin resetear)
            if (typeof logic.setTipoNuevoModal === 'function') {
                logic.setTipoNuevoModal('visita');
            }
            logic.setModalNuevoAbierto(true);

            // 2. Asignamos el id al formulario tras montar el modal
            setTimeout(() => {
                logic.formNuevaVisita.setData('medico_id', targetId);
            }, 50);
        }
    }, [medicosDisponibles]);

    const overlayVisible = logic.modalNuevoAbierto || logic.modalGestionVisitaAbierto || logic.modalGestionEventoAbierto;

    return (
        <>
            <Head title="Mi Agenda - LFH" />

            {/* Header en su propio root — sin ningún padre que lo contenga, fixed puro */}
            <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md shadow-sm rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20">
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">

                        <Link
                            href="/panel"
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                        >
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        <div className="hidden md:flex flex-col min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1C85E8]/70 leading-none mb-0.5">
                                LFH Portal
                            </p>
                            <h1 className="text-xs md:text-sm font-black text-[#1C85E8] uppercase tracking-wider whitespace-nowrap">
                                Mi Agenda
                            </h1>
                        </div>

                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs md:text-sm" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar en mi agenda..."
                                value={logic.busqueda}
                                onChange={(e) => logic.setBusqueda(e.target.value)}
                                className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700"
                            />
                        </div>

                        <button
                            onClick={() => logic.setVistaSemanal(!logic.vistaSemanal)}
                            className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
                                logic.vistaSemanal
                                    ? 'bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] text-white border-transparent shadow-sm'
                                    : 'bg-white text-gray-400 border-gray-100'
                            }`}
                        >
                            {logic.vistaSemanal ? 'Mes' : 'Semana'}
                        </button>

                    </div>
                </div>

                {/* Fila 2: franja "Mis Visitas" — color sólido, pegada a la fila superior */}
                <div className="bg-[#1C85E8] rounded-b-[30px] md:rounded-b-[40px]">
                    <div className="max-w-[1440px] mx-auto px-5 py-2.5 flex items-center gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/80">LFH · Agenda</p>
                        <span className="text-white/40">|</span>
                        <h2 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                            <FaCalendarCheck className="opacity-80 text-xs" />
                            Mis Visitas
                        </h2>
                    </div>
                </div>
            </header>

            {/* FAB */}
            {!overlayVisible && (
                <button
                    onClick={() => logic.abrirModalNuevo()}
                    className="fixed bottom-5 right-5 sm:bottom-28 sm:right-6 w-14 h-14 bg-gradient-to-br from-[#1C85E8] to-[#02CFE3] text-white rounded-2xl shadow-lg shadow-blue-200 z-40 flex items-center justify-center hover:scale-110 transition-all active:scale-95"
                >
                    <FaPlus className="text-xl" />
                </button>
            )}

            <ModalGestionarVisita logic={logic} doctores={medicosDisponibles} productos={productos} />
            <ModalNuevaVisita     logic={logic} doctores={medicosDisponibles} productos={productos} />
            <ModalGestionarEvento logic={logic} />

            <div className={`bg-[#E5F4FF] min-h-screen pb-32 font-sans text-gray-800 pt-32 md:pt-36 ${overlayVisible ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : ''} transition-all duration-500`}>

                <main className="px-4 md:px-6 mt-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <VisitasList     logic={logic} />
                    <CalendarSection logic={logic} />
                </main>

                <BarraNave />
            </div>
        </>
    );
};

export default MisVisitas;