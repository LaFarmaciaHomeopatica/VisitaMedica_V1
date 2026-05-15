import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { FaPlus, FaArrowLeft, FaMagnifyingGlass } from 'react-icons/fa6';
import BarraNave from '../barranave';
import { useMisVisitas } from './HooksMv/useMisVisitas';

// Sub-componentes
import VisitasList from './ComponentsMv/VisitasList';
import CalendarSection from './ComponentsMv/CalendarSection';
import ModalNuevaVisita from './ComponentsMv/ModalNuevaVisita';
import ModalGestionarVisita from './ComponentsMv/ModalGestionarVisita';

const MisVisitas = ({ visitas: visitasDB, medicosDisponibles, productos }) => {
    const logic = useMisVisitas(visitasDB, medicosDisponibles, productos);
    const overlayVisible = logic.modalNuevoAbierto || logic.modalGestionAbierto;

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-32 font-sans text-gray-800 relative overflow-x-hidden">
            <Head title="Mi Agenda - LFH" />

            {!overlayVisible && (
                <button
                    onClick={() => logic.abrirModalNuevo()}
                    className="fixed bottom-28 right-6 w-14 h-14 bg-[#5D8BF4] text-white rounded-2xl shadow-lg z-40 flex items-center justify-center hover:scale-110 transition-all"
                >
                    <FaPlus className="text-xl" />
                </button>
            )}

            <ModalGestionarVisita logic={logic} />
            <ModalNuevaVisita logic={logic} doctores={medicosDisponibles} productos={productos} />

            <div className={`${overlayVisible ? 'blur-md scale-[0.98] opacity-50 pointer-events-none' : 'blur-0'} transition-all duration-500`}>
                <header className="bg-white shadow-sm sticky top-0 z-20 rounded-b-[25px]">
                    <div className="max-w-[1440px] mx-auto p-4 flex items-center gap-4">
                        <Link href={route('panel')} className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500">
                            <FaArrowLeft className="text-xs" />
                        </Link>
                        <div className="relative flex-grow">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar en mi agenda..."
                                value={logic.busqueda}
                                onChange={(e) => logic.setBusqueda(e.target.value)}
                                className="w-full bg-blue-50 border-none rounded-full py-2.5 pl-12 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => logic.setVistaSemanal(!logic.vistaSemanal)}
                            className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase transition-all border ${logic.vistaSemanal ? 'bg-[#5D8BF4] text-white' : 'bg-white text-gray-400'}`}
                        >
                            {logic.vistaSemanal ? 'Mes' : 'Semana'}
                        </button>
                    </div>
                </header>

                <main className="px-6 mt-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <VisitasList logic={logic} />
                    <CalendarSection logic={logic} />
                </main>
            </div>
            <BarraNave />
        </div>
    );
};

export default MisVisitas;