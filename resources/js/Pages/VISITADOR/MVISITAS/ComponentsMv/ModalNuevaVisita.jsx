import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { FaXmark } from 'react-icons/fa6';

const ModalNuevaVisita = ({ logic, doctores, productos = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef(null);

    // Sincronizar buscador al abrir/resetear modal
    useEffect(() => {
        if (logic.modalNuevoAbierto) {
            setSearchTerm(logic.formNueva.data.muestras || '');
        }
    }, [logic.modalNuevoAbierto, logic.formNueva.data.muestras]);

    // Cerrar buscador al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
                if (searchTerm !== logic.formNueva.data.muestras) {
                    logic.formNueva.setData('muestras', searchTerm);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm, logic.formNueva]);

    // Filtrar productos por nombre o código
    const filteredProducts = useMemo(() => {
        const query = searchTerm.toString().toLowerCase().trim();
        if (!query || query === (logic.formNueva.data.muestras || '').toLowerCase()) return [];
        return productos
            .filter(p =>
                p.nombre?.toLowerCase().includes(query) ||
                p.codigo?.toLowerCase().includes(query)
            )
            .slice(0, 8);
    }, [searchTerm, productos, logic.formNueva.data.muestras]);

    const handleSelectProduct = (product) => {
        const val = `${product.codigo} - ${product.nombre}`;
        setSearchTerm(val);
        logic.formNueva.setData('muestras', val);
        setShowResults(false);
    };

    // Al cambiar fecha_programada, auto-completar fecha_realizada con el mismo valor
    const handleFechaProgramadaChange = (e) => {
        const val = e.target.value;
        // Inertia's useForm requiere llamadas separadas
        logic.formNueva.setData('fecha_programada', val);
        logic.formNueva.setData('fecha_realizada', val);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        logic.formNueva.post(route('visitas.store'), {
            onSuccess: () => {
                logic.setModalNuevoAbierto(false);
                logic.formNueva.reset();
                setSearchTerm('');
            }
        });
    };

    if (!logic.modalNuevoAbierto) return null;



    // Después de declarar formNueva
    const abrirModalNuevo = () => {
        const fechaFormato = format(fechaSeleccionada, "yyyy-MM-dd") + 'T08:00';
        formNueva.setData({
            ...formNueva.data,
            fecha_programada: fechaFormato,
            fecha_realizada: fechaFormato,
        });
        setModalNuevoAbierto(true);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => logic.setModalNuevoAbierto(false)}
            />

            <form
                onSubmit={handleSubmit}
                className="relative bg-white w-full max-w-lg rounded-[35px] p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            >
                {/* MODIFICACIÓN: Botón "X" absoluto en la esquina superior derecha para cerrar el modal */}
                <button
                    type="button"
                    onClick={() => logic.setModalNuevoAbierto(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label="Cerrar modal"
                >
                    <FaXmark className="text-xl" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-black uppercase text-slate-800">Programar Visita</h2>
                    <div className="h-1 w-10 bg-[#5D8BF4] mt-1 rounded-full" />
                </div>

                <div className="space-y-5">

                    {/* Médico */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Seleccionar Doctor
                        </label>
                        <select
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                            value={logic.formNueva.data.medico_id}
                            onChange={e => logic.formNueva.setData('medico_id', e.target.value)}
                            required
                        >
                            <option value="">-- Elige un médico --</option>
                            {(doctores || []).map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.nombre} {doc.apellido}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Fecha Programada
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                                value={logic.formNueva.data.fecha_programada}
                                onChange={handleFechaProgramadaChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Hora Final
                            </label>
                            <input
                                type="time"   // ✅ solo muestra la hora
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                                value={logic.formNueva.data.fecha_realizada?.slice(11, 16) || ''}
                                onChange={e => {
                                    // Toma la fecha de fecha_programada y le pega la hora nueva
                                    const fecha = logic.formNueva.data.fecha_programada?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd');
                                    logic.formNueva.setData('fecha_realizada', `${fecha}T${e.target.value}`);
                                }}
                            />
                        </div>
                    </div>

                    {/* Buscador de Productos */}


                    {/* Detalle de Muestra */}


                    {/* Comentarios */}


                    {/* Errores */}
                    {Object.keys(logic.formNueva.errors).length > 0 && (
                        <div className="p-3 bg-red-50 rounded-xl">
                            {Object.values(logic.formNueva.errors).map((err, i) => (
                                <p key={i} className="text-[10px] text-red-600 font-bold uppercase">• {err}</p>
                            ))}
                        </div>
                    )}

                    {/* MODIFICACIÓN: Fila flexible (flex gap-3) que añade el botón CANCELAR junto al de AGENDAR VISITA */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => logic.setModalNuevoAbierto(false)}
                            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-[10px] tracking-widest transition-all focus:outline-none"
                        >
                            CANCELAR
                        </button>
                        <button
                            type="submit"
                            disabled={logic.formNueva.processing}
                            className="flex-1 bg-[#5D8BF4] text-white rounded-2xl py-4 text-[11px] font-black tracking-widest shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50 focus:outline-none"
                        >
                            {logic.formNueva.processing ? 'PROCESANDO...' : 'AGENDAR VISITA'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ModalNuevaVisita;