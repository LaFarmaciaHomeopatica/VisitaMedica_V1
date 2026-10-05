import React, { useState, useMemo, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { FaCircleCheck, FaCircleXmark, FaClock, FaBan, FaXmark, FaLocationDot, FaTriangleExclamation } from 'react-icons/fa6';

const ModalGestionarVisita = ({ logic, doctores = [], productos = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef(null);
    const [dateWarning, setDateWarning] = useState('');
    const [coordenadas, setCoordenadas] = useState({ latitud: null, longitud: null });
    const [gpsStatus, setGpsStatus] = useState('');
    const [errorRed, setErrorRed] = useState(false);

    const formReporte = logic.formReporteVisita || logic.formReporte;
    const esEfectiva = logic.visitaSeleccionada?.estado === 'efectiva';

    useEffect(() => {
        if (!logic.modalGestionVisitaAbierto) return;
        return router.on('exception', (event) => {
            event.preventDefault();
            setErrorRed(true);
        });
    }, [logic.modalGestionVisitaAbierto]);

    const capturarUbicacion = () => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }
        setGpsStatus('obteniendo');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoordenadas({
                    latitud: pos.coords.latitude,
                    longitud: pos.coords.longitude,
                });
                setGpsStatus('ok');
            },
            (err) => {
                console.warn('GPS error:', err);
                setGpsStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    useEffect(() => {
        if (!logic.modalGestionVisitaAbierto || !logic.visitaSeleccionada) return;

        const originalDate = logic.visitaSeleccionada.fecha_programada?.slice(0, 16).replace(' ', 'T') || '';
        const currentDate = formReporte.data.fecha_programada?.replace(' ', 'T') || '';
        const originalState = logic.visitaSeleccionada.estado || '';

        if (currentDate !== originalDate) {
            setDateWarning('');
            if (formReporte.data.estado !== 'reprogramada') {
                formReporte.setData('estado', 'reprogramada');
            }
        } else {
            if (formReporte.data.estado === 'reprogramada') {
                formReporte.setData('estado', originalState !== 'reprogramada' ? originalState : '');
            }
        }
    }, [formReporte.data.fecha_programada, logic.modalGestionVisitaAbierto, logic.visitaSeleccionada]);

    useEffect(() => {
        if (logic.modalGestionVisitaAbierto && logic.visitaSeleccionada) {
            const v = logic.visitaSeleccionada;
            formReporte.setData({
                estado: v.estado || '',
                comentarios: v.comentarios || '',
                muestras: v.muestras || '',
                comentario_muestra: v.comentario_muestra || '',
                fecha_programada: v.fecha_programada?.slice(0, 16).replace(' ', 'T') || '',
                fecha_realizada: v.fecha_realizada?.slice(0, 16).replace(' ', 'T') || '',
                medico_id: v.medico_id || '',
            });
            setSearchTerm(v.muestras || '');
            setDateWarning('');
            setCoordenadas({ latitud: null, longitud: null });
            setGpsStatus('');
            setErrorRed(false);
        }
    }, [logic.modalGestionVisitaAbierto, logic.visitaSeleccionada]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
                if (searchTerm !== formReporte.data.muestras) {
                    formReporte.setData('muestras', searchTerm);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm, formReporte]);

    const filteredProducts = useMemo(() => {
        const query = searchTerm.toString().toLowerCase().trim();
        if (!query || query === (formReporte.data.muestras || '').toLowerCase()) return [];
        return productos
            .filter(
                (p) =>
                    p.nombre?.toLowerCase().includes(query) ||
                    p.codigo?.toLowerCase().includes(query)
            )
            .slice(0, 8);
    }, [searchTerm, productos, formReporte.data.muestras]);

    if (!logic.modalGestionVisitaAbierto || !logic.visitaSeleccionada) return null;

    const handleSelectProduct = (product) => {
        const val = `${product.codigo} - ${product.nombre}`;
        setSearchTerm(val);
        formReporte.setData('muestras', val);
        setShowResults(false);
    };

    const handleFechaProgramadaChange = (e) => {
        const val = e.target.value;
        formReporte.setData((prev) => ({
            ...prev,
            fecha_programada: val,
        }));
    };

    const handleFechaRealizadaChange = (e) => {
        const val = e.target.value;
        formReporte.setData((prev) => ({
            ...prev,
            fecha_realizada: val,
        }));
    };

    const handleActualizar = () => {
        setErrorRed(false);

        const originalDate = logic.visitaSeleccionada?.fecha_programada?.slice(0, 16).replace(' ', 'T') || '';
        const currentDate = formReporte.data.fecha_programada?.replace(' ', 'T') || '';
        const dateChanged = originalDate !== currentDate;

        if (formReporte.data.estado === 'reprogramada' && !dateChanged) {
            setDateWarning('Debes cambiar la fecha y hora de la visita para poder reprogramarla.');
            return;
        }

        router.post(
            route('visitas.marcarEfectiva', logic.visitaSeleccionada.id),
            {
                ...formReporte.data,
                latitud: coordenadas.latitud,
                longitud: coordenadas.longitud,
            },
            {
                onSuccess: () => logic.setModalGestionVisitaAbierto(false),
                onError: (errors) => console.log('Errores:', errors),
            }
        );
    };

    const handleSelectOption = (optId) => {
        const originalDate = logic.visitaSeleccionada?.fecha_programada?.slice(0, 16).replace(' ', 'T') || '';
        const currentDate = formReporte.data.fecha_programada?.replace(' ', 'T') || '';
        const dateChanged = originalDate !== currentDate;

        if (optId === 'reprogramada' && !dateChanged) {
            setDateWarning('Debes cambiar la fecha y hora de inicio o fin para poder reprogramarla.');
        } else {
            setDateWarning('');
        }

        formReporte.setData('estado', optId);

        if (optId === 'efectiva') {
            capturarUbicacion();
        } else {
            setCoordenadas({ latitud: null, longitud: null });
            setGpsStatus('');
        }
    };

    const opciones = [
        { id: 'efectiva', label: 'Efectiva', icon: FaCircleCheck, color: 'text-green-500' },
        { id: 'No contactado', label: 'No contactado', icon: FaCircleXmark, color: 'text-orange-500' },
        { id: 'reprogramada', label: 'Reprogramar', icon: FaClock, color: 'text-blue-500' },
        { id: 'cancelada', label: 'Cancelada', icon: FaBan, color: 'text-red-500' },
    ];

    const datosMedico = logic.visitaSeleccionada?.medico;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => logic.setModalGestionVisitaAbierto(false)}
            />

            <div className="relative bg-white w-full max-w-lg rounded-[32px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <button
                    type="button"
                    onClick={() => logic.setModalGestionVisitaAbierto(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label="Cerrar modal"
                >
                    <FaXmark className="text-xl" />
                </button>

                <div className="mb-5">
                    <h2 className="text-xl font-black uppercase text-slate-800">Gestionar Visita Médica</h2>
                    <p className="text-xs text-[#5D8BF4] font-bold mt-1">{logic.visitaSeleccionada.doctor}</p>
                    <div className="h-1 w-10 bg-[#5D8BF4] mt-1.5 rounded-full" />
                </div>

                <div className="space-y-4">
                    {/* Alerta de solo lectura si ya fue efectiva */}
                    {esEfectiva && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                            <p className="text-xs text-emerald-700 font-black uppercase tracking-wide">
                                ✓ Visita completada (Efectiva) — Modo solo lectura
                            </p>
                        </div>
                    )}

                    {/* Médico + Dirección */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Doctor
                        </label>
                        <div className="w-full bg-gray-50 rounded-2xl p-3.5 text-xs font-bold mt-1 text-gray-700">
                            {datosMedico?.nombre} {datosMedico?.apellido || ''}
                        </div>

                        {datosMedico && (datosMedico.direccion_detalles || datosMedico.geolocalizacion) && (
                            <div className="mt-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                                {datosMedico.direccion_detalles && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            datosMedico.direccion_detalles
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-[11px] text-slate-600 font-medium hover:text-[#5D8BF4] hover:underline"
                                    >
                                        <span className="font-bold text-slate-700">Dirección:</span> {datosMedico.direccion_detalles}
                                    </a>
                                )}
                                {datosMedico.geolocalizacion && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${datosMedico.geolocalizacion}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono hover:text-[#5D8BF4] hover:underline"
                                    >
                                        <FaLocationDot className="text-[#5D8BF4] text-xs" />
                                        <span>Ubicación base: {datosMedico.geolocalizacion}</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Horarios: Hora Inicio y Hora Fin (AMBOS EDITABLES PARA REPROGRAMAR) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Fecha y Hora Inicio
                            </label>
                            <input
                                type="datetime-local"
                                disabled={esEfectiva}
                                className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 outline-none transition-all ${
                                    esEfectiva ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none' : 'bg-gray-50 focus:ring-2 focus:ring-[#5D8BF4]'
                                }`}
                                value={formReporte.data.fecha_programada || ''}
                                onChange={handleFechaProgramadaChange}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Fecha y Hora Fin
                            </label>
                            <input
                                type="datetime-local"
                                disabled={esEfectiva}
                                className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 outline-none transition-all ${
                                    esEfectiva ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none' : 'bg-gray-50 focus:ring-2 focus:ring-[#5D8BF4]'
                                }`}
                                value={formReporte.data.fecha_realizada || ''}
                                onChange={handleFechaRealizadaChange}
                            />
                        </div>
                    </div>

                    {/* Selector de Estado */}
                    {!esEfectiva && (
                        <div className="space-y-2 pt-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">
                                Resultado de la visita
                            </label>

                            {dateWarning && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-700 animate-in fade-in">
                                    ⚠️ {dateWarning}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                {opciones.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        disabled={esEfectiva}
                                        onClick={() => handleSelectOption(opt.id)}
                                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                                            formReporte.data.estado === opt.id
                                                ? 'bg-blue-50 border-blue-500 shadow-sm'
                                                : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        <opt.icon
                                            className={`text-lg ${
                                                formReporte.data.estado === opt.id ? opt.color : 'text-gray-400'
                                            }`}
                                        />
                                        <span className="text-xs font-bold">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Indicador GPS */}
                            {formReporte.data.estado === 'efectiva' && gpsStatus && (
                                <div
                                    className={`mt-2 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 ${
                                        gpsStatus === 'obteniendo'
                                            ? 'bg-blue-50 text-blue-500'
                                            : gpsStatus === 'ok'
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-red-50 text-red-500'
                                    }`}
                                >
                                    {gpsStatus === 'obteniendo' && (
                                        <>
                                            <span className="animate-spin">⏳</span> Obteniendo ubicación GPS...
                                        </>
                                    )}
                                    {gpsStatus === 'ok' && <>📍 Ubicación GPS capturada</>}
                                    {gpsStatus === 'error' && <>⚠️ No se pudo obtener GPS (se guardará sin coordenadas)</>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Muestras / Buscador de Productos */}
                    <div className="relative" ref={wrapperRef}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Muestras (Producto)
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            placeholder="Buscar por código o nombre..."
                            disabled={esEfectiva}
                            className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 outline-none ${
                                esEfectiva ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none' : 'bg-gray-50 focus:ring-2 focus:ring-[#5D8BF4]'
                            }`}
                        />
                        {showResults && filteredProducts.length > 0 && !esEfectiva && (
                            <div className="absolute z-[110] w-full bg-white border-2 border-[#5D8BF4] rounded-2xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                                {filteredProducts.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleSelectProduct(p)}
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-none"
                                    >
                                        <p className="text-[10px] font-black text-[#5D8BF4]">{p.codigo}</p>
                                        <p className="text-[11px] font-bold text-gray-700 uppercase">{p.nombre}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detalle de Muestra */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Detalles de la Muestra
                        </label>
                        <textarea
                            disabled={esEfectiva}
                            value={formReporte.data.comentario_muestra || ''}
                            onChange={(e) => formReporte.setData('comentario_muestra', e.target.value)}
                            className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 h-16 resize-none outline-none ${
                                esEfectiva ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none' : 'bg-gray-50 focus:ring-2 focus:ring-[#5D8BF4]'
                            }`}
                            placeholder="Lote, cantidad, etc..."
                        />
                    </div>

                    {/* Notas / Comentarios */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Notas / Comentarios
                        </label>
                        <textarea
                            disabled={esEfectiva}
                            value={formReporte.data.comentarios || ''}
                            onChange={(e) => formReporte.setData('comentarios', e.target.value)}
                            className={`w-full rounded-2xl p-3.5 text-xs font-bold mt-1 h-20 resize-none outline-none ${
                                esEfectiva ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-none' : 'bg-gray-50 focus:ring-2 focus:ring-[#5D8BF4]'
                            }`}
                            placeholder="Notas adicionales de la visita..."
                        />
                    </div>

                    {/* Errores */}
                    {Object.keys(formReporte.errors).length > 0 && (
                        <div className="p-3 bg-red-50 rounded-xl">
                            {Object.values(formReporte.errors).map((err, i) => (
                                <p key={i} className="text-[10px] text-red-600 font-bold uppercase">• {err}</p>
                            ))}
                        </div>
                    )}

                    {/* Falla de red */}
                    {errorRed && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                            <FaTriangleExclamation className="text-amber-500 text-xs mt-0.5 shrink-0" />
                            <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                                No se pudo guardar — revisa tu conexión e intenta de nuevo.
                            </p>
                        </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => logic.setModalGestionVisitaAbierto(false)}
                            className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-[10px] tracking-widest transition-all"
                        >
                            {esEfectiva ? 'CERRAR' : 'CANCELAR'}
                        </button>
                        {!esEfectiva && (
                            <button
                                type="button"
                                onClick={handleActualizar}
                                disabled={gpsStatus === 'obteniendo'}
                                className="flex-1 py-3.5 bg-[#1C85E8] text-white rounded-2xl font-black text-[10px] tracking-widest shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50"
                            >
                                {gpsStatus === 'obteniendo' ? 'OBTENIENDO GPS...' : 'GUARDAR CAMBIOS'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalGestionarVisita;