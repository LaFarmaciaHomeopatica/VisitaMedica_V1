import React, { useState, useMemo, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { FaCircleCheck, FaCircleXmark, FaClock, FaBan, FaXmark } from 'react-icons/fa6';
import { format } from 'date-fns';

const ModalGestionarVisita = ({ logic, doctores = [], productos = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef(null);
    const [dateWarning, setDateWarning] = useState('');
    const [coordenadas, setCoordenadas] = useState({ latitud: null, longitud: null });
    const [gpsStatus, setGpsStatus] = useState('');

    const capturarUbicacion = () => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }
        setGpsStatus('obteniendo');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoordenadas({
                    latitud:  pos.coords.latitude,
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
        if (!logic.modalGestionAbierto || !logic.visitaSeleccionada) return;
        
        const originalDate = logic.visitaSeleccionada.fecha_programada?.slice(0, 16).replace(' ', 'T') || '';
        const currentDate = logic.formReporte.data.fecha_programada?.replace(' ', 'T') || '';
        const originalState = logic.visitaSeleccionada.estado || '';
        
        if (currentDate !== originalDate) {
            setDateWarning('');
            if (logic.formReporte.data.estado !== 'reprogramada') {
                logic.formReporte.setData('estado', 'reprogramada');
            }
        } else {
            if (logic.formReporte.data.estado === 'reprogramada') {
                logic.formReporte.setData('estado', originalState !== 'reprogramada' ? originalState : '');
            }
        }
    }, [logic.formReporte.data.fecha_programada, logic.modalGestionAbierto, logic.visitaSeleccionada]);

    useEffect(() => {
        if (logic.modalGestionAbierto && logic.visitaSeleccionada) {
            const v = logic.visitaSeleccionada;
            logic.formReporte.setData({
                estado: v.estado || '',
                comentarios: v.comentarios || '',
                muestras: v.muestras || '',
                comentario_muestra: v.comentario_muestra || '',
                fecha_programada: v.fecha_programada?.slice(0, 16) || '',
                fecha_realizada: v.fecha_realizada?.slice(0, 16) || '',
                medico_id: v.medico_id || '',
            });
            setSearchTerm(v.muestras || '');
            setDateWarning('');
            setCoordenadas({ latitud: null, longitud: null });
            setGpsStatus('');
        }
    }, [logic.modalGestionAbierto, logic.visitaSeleccionada]);

    const esEfectiva = logic.visitaSeleccionada?.estado === 'efectiva';

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
                if (searchTerm !== logic.formReporte.data.muestras) {
                    logic.formReporte.setData('muestras', searchTerm);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm, logic.formReporte]);

    const filteredProducts = useMemo(() => {
        const query = searchTerm.toString().toLowerCase().trim();
        if (!query || query === (logic.formReporte.data.muestras || '').toLowerCase()) return [];
        return productos
            .filter(p =>
                p.nombre?.toLowerCase().includes(query) ||
                p.codigo?.toLowerCase().includes(query)
            )
            .slice(0, 8);
    }, [searchTerm, productos, logic.formReporte.data.muestras]);

    const handleSelectProduct = (product) => {
        const val = `${product.codigo} - ${product.nombre}`;
        setSearchTerm(val);
        logic.formReporte.setData('muestras', val);
        setShowResults(false);
    };

    const handleFechaProgramadaChange = (e) => {
        const val = e.target.value;
        logic.formReporte.setData({
            ...logic.formReporte.data,
            fecha_programada: val,
            fecha_realizada: val,
        });
    };

    const handleActualizar = () => {
        router.post(route('visitas.marcarEfectiva', logic.visitaSeleccionada.id), {
            ...logic.formReporte.data,
            latitud:  coordenadas.latitud,
            longitud: coordenadas.longitud,
        }, {
            onSuccess: () => logic.setModalGestionAbierto(false),
            onError: (errors) => console.log('Errores:', errors),
        });
    };

    const handleSelectOption = (optId) => {
        const originalDate = logic.visitaSeleccionada?.fecha_programada?.slice(0, 16).replace(' ', 'T') || '';
        const currentDate = logic.formReporte.data.fecha_programada?.replace(' ', 'T') || '';
        const dateChanged = originalDate !== currentDate;

        if (optId === 'reprogramada' && !dateChanged) {
            setDateWarning('Debes cambiar la fecha y hora de la visita para poder reprogramarla.');
            return;
        }

        setDateWarning('');
        logic.formReporte.setData('estado', optId);

        if (optId === 'efectiva') {
            capturarUbicacion();
        } else {
            setCoordenadas({ latitud: null, longitud: null });
            setGpsStatus('');
        }
    };

    const opciones = [
        { id: 'efectiva',      label: 'Efectiva',      icon: FaCircleCheck, color: 'text-green-500'  },
        { id: 'No contactado', label: 'No contactado', icon: FaCircleXmark, color: 'text-orange-500' },
        { id: 'reprogramada',  label: 'Reprogramar',   icon: FaClock,       color: 'text-blue-500'   },
        { id: 'cancelada',     label: 'Cancelada',     icon: FaBan,         color: 'text-red-500'    },
    ];

    if (!logic.modalGestionAbierto || !logic.visitaSeleccionada) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => logic.setModalGestionAbierto(false)}
            />

            <div className="relative bg-white w-full max-w-lg rounded-[35px] p-8 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <button
                    type="button"
                    onClick={() => logic.setModalGestionAbierto(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label="Cerrar modal"
                >
                    <FaXmark className="text-xl" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-black uppercase text-slate-800">Gestionar Visita</h2>
                    <p className="text-xs text-[#5D8BF4] font-bold mt-1">{logic.visitaSeleccionada.doctor}</p>
                    <div className="h-1 w-10 bg-[#5D8BF4] mt-2 rounded-full" />
                </div>

                <div className="space-y-5">

                    {/* Médico (solo lectura) */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Doctor
                        </label>
                        <div className="w-full bg-gray-50 rounded-2xl p-4 text-xs font-bold mt-1 text-gray-700">
                            {logic.visitaSeleccionada?.medico?.nombre} {logic.visitaSeleccionada?.medico?.apellido}
                        </div>
                    </div>

                    {/* Hora Inicio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Hora Inicio
                            </label>
                            <input
                                type="datetime-local"
                                disabled={esEfectiva}
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                                value={logic.formReporte.data.fecha_programada || ''}
                                onChange={handleFechaProgramadaChange}
                            />
                        </div>
                    </div>

                    {/* Estado */}
                    {!esEfectiva && (
                        <div className="animate-in fade-in duration-200">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
                                Resultado de la visita
                            </label>

                            {dateWarning && (
                                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-bold text-amber-700 uppercase animate-in fade-in slide-in-from-top-2">
                                    ⚠ {dateWarning}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                {opciones.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        disabled={esEfectiva}
                                        onClick={() => handleSelectOption(opt.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                                            logic.formReporte.data.estado === opt.id
                                                ? 'bg-blue-50 border-blue-500'
                                                : 'bg-gray-50 border-transparent text-gray-400'
                                        }`}
                                    >
                                        <opt.icon className={`text-lg ${logic.formReporte.data.estado === opt.id ? opt.color : 'text-gray-300'}`} />
                                        <span className="text-xs font-bold">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Indicador GPS */}
                            {logic.formReporte.data.estado === 'efectiva' && gpsStatus && (
                                <div className={`mt-3 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 ${
                                    gpsStatus === 'obteniendo' ? 'bg-blue-50 text-blue-500'   :
                                    gpsStatus === 'ok'         ? 'bg-green-50 text-green-600' :
                                                                 'bg-red-50 text-red-500'
                                }`}>
                                    {gpsStatus === 'obteniendo' && <><span className="animate-spin">⏳</span> Obteniendo ubicación...</>}
                                    {gpsStatus === 'ok'         && <>📍 Ubicación capturada correctamente</>}
                                    {gpsStatus === 'error'      && <>⚠ No se pudo obtener la ubicación — se guardará sin coordenadas</>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hora Final */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Hora Final
                        </label>
                        <input
                            type="time"
                            disabled={esEfectiva}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                            value={logic.formReporte.data.fecha_realizada?.slice(11, 16) || ''}
                            onChange={e => {
                                const fecha = logic.formReporte.data.fecha_programada?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd');
                                logic.formReporte.setData('fecha_realizada', `${fecha}T${e.target.value}`);
                            }}
                        />
                    </div>

                    {/* Buscador de Productos */}
                    <div className="relative" ref={wrapperRef}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Muestras (Producto)
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
                            onFocus={() => setShowResults(true)}
                            placeholder="Buscar por código o nombre..."
                            disabled={esEfectiva}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1 focus:ring-2 focus:ring-[#5D8BF4]"
                        />
                        {showResults && filteredProducts.length > 0 && (
                            <div className="absolute z-[110] w-full bg-white border-2 border-[#5D8BF4] rounded-2xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                                {filteredProducts.map(p => (
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
                            value={logic.formReporte.data.comentario_muestra || ''}
                            onChange={e => logic.formReporte.setData('comentario_muestra', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1 h-20 resize-none focus:ring-2 focus:ring-[#5D8BF4]"
                            placeholder="Lote, cantidad, etc..."
                        />
                    </div>

                    {/* Comentarios */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Notas / Comentarios
                        </label>
                        <textarea
                            disabled={esEfectiva}
                            value={logic.formReporte.data.comentarios || ''}
                            onChange={e => logic.formReporte.setData('comentarios', e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold mt-1 h-24 resize-none focus:ring-2 focus:ring-[#5D8BF4]"
                            placeholder="Notas adicionales de la visita..."
                        />
                    </div>

                    {/* Errores */}
                    {Object.keys(logic.formReporte.errors).length > 0 && (
                        <div className="p-3 bg-red-50 rounded-xl">
                            {Object.values(logic.formReporte.errors).map((err, i) => (
                                <p key={i} className="text-[10px] text-red-600 font-bold uppercase">• {err}</p>
                            ))}
                        </div>
                    )}

                    {!esEfectiva && (
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => logic.setModalGestionAbierto(false)}
                                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-[10px] tracking-widest transition-all focus:outline-none"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="button"
                                onClick={handleActualizar}
                                disabled={gpsStatus === 'obteniendo'}
                                className="flex-1 py-4 bg-[#5D8BF4] text-white rounded-2xl font-black text-[10px] tracking-widest shadow-lg hover:bg-blue-600 transition-all disabled:opacity-50 focus:outline-none"
                            >
                                {gpsStatus === 'obteniendo' ? 'OBTENIENDO UBICACIÓN...' : 'GUARDAR CAMBIOS'}
                            </button>
                        </div>
                    )}

                    {esEfectiva && (
                        <div className="p-3 bg-emerald-50 rounded-xl text-center">
                            <p className="text-[10px] text-emerald-600 font-black uppercase">✓ Visita efectiva — solo lectura</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalGestionarVisita;