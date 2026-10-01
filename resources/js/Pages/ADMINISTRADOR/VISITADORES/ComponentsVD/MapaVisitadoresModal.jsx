// resources/js/Pages/ADMINISTRADOR/VISITADORES/ComponentsVD/MapaVisitadoresModal.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const INTERVALO_MS = 30000;      // se refresca cada 30 s
const UMBRAL_SIN_SENAL = 10;     // minutos: más que esto = sin señal
const CENTRO_BOGOTA = [4.711, -74.0721];

const textoTiempo = (min) => {
    if (min === null || min === undefined) return 'Sin ubicación';
    if (min < 1) return 'Ahora mismo';
    if (min < 60) return `Hace ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `Hace ${horas} h`;
    return `Hace ${Math.floor(horas / 24)} d`;
};

const escapar = (texto) =>
    String(texto ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

const crearIcono = (activo) => {
    const color = activo ? '#24C765' : '#94a3b8';
    return L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 0 0 2px ${color}66,0 2px 6px rgba(0,0,0,.35)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10],
    });
};

const esActivo = (v) =>
    v.minutos_sin_senal !== null && v.minutos_sin_senal <= UMBRAL_SIN_SENAL;

const tieneUbicacion = (v) => v.latitud !== null && v.longitud !== null;

const MapaVisitadoresModal = ({ isOpen, onClose }) => {
    const contenedorRef = useRef(null);
    const mapaRef = useRef(null);
    const marcadoresRef = useRef({});
    const primerAjusteRef = useRef(true);

    const [visitadores, setVisitadores] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(false);
    const [consultadoEn, setConsultadoEn] = useState(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await fetch('/Gvisitadores/ubicaciones', {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) throw new Error('Error de servidor');
            const data = await res.json();
            setVisitadores(data.visitadores || []);
            setConsultadoEn(new Date());
            setError(false);
        } catch {
            setError(true);
        } finally {
            setCargando(false);
        }
    }, []);

    // 1) Crear y destruir el mapa al abrir/cerrar
    useEffect(() => {
        if (!isOpen || !contenedorRef.current) return;

        const mapa = L.map(contenedorRef.current).setView(CENTRO_BOGOTA, 11);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap',
        }).addTo(mapa);

        mapaRef.current = mapa;
        primerAjusteRef.current = true;
        const t = setTimeout(() => mapa.invalidateSize(), 150);

        return () => {
            clearTimeout(t);
            mapa.remove();
            mapaRef.current = null;
            marcadoresRef.current = {};
        };
    }, [isOpen]);

    // 2) Cargar al abrir y refrescar cada 30 s
    useEffect(() => {
        if (!isOpen) return;
        cargar();
        const timer = setInterval(cargar, INTERVALO_MS);
        return () => clearInterval(timer);
    }, [isOpen, cargar]);

    // 3) Dibujar y mover los marcadores
    useEffect(() => {
        const mapa = mapaRef.current;
        if (!isOpen || !mapa) return;

        const vistos = new Set();

        visitadores.filter(tieneUbicacion).forEach((v) => {
            vistos.add(v.id);
            const pos = [v.latitud, v.longitud];
            const html = `
                <div style="font-family:sans-serif;min-width:150px">
                    <strong>${escapar(v.nombre)}</strong><br/>
                    <span style="color:#64748b">${escapar(v.zona || 'Sin zona')}</span><br/>
                    <span style="color:${esActivo(v) ? '#16a34a' : '#64748b'};font-weight:bold">
                        ${textoTiempo(v.minutos_sin_senal)}
                    </span>
                </div>`;

            let marcador = marcadoresRef.current[v.id];
            if (!marcador) {
                marcador = L.marker(pos, { icon: crearIcono(esActivo(v)) }).addTo(mapa);
                marcador.bindPopup(html);
                marcadoresRef.current[v.id] = marcador;
            } else {
                marcador.setLatLng(pos);
                marcador.setIcon(crearIcono(esActivo(v)));
                marcador.setPopupContent(html);
            }
        });

        // Quitar marcadores de visitadores que ya no tienen ubicación
        Object.keys(marcadoresRef.current).forEach((id) => {
            if (!vistos.has(Number(id))) {
                marcadoresRef.current[id].remove();
                delete marcadoresRef.current[id];
            }
        });

        // Ajustar el zoom para ver a todos, solo la primera vez
        if (primerAjusteRef.current && vistos.size > 0) {
            const puntos = visitadores
                .filter(tieneUbicacion)
                .map((v) => [v.latitud, v.longitud]);
            mapa.fitBounds(puntos, { padding: [50, 50], maxZoom: 15 });
            primerAjusteRef.current = false;
        }
    }, [visitadores, isOpen]);

    const irAVisitador = (v) => {
        if (!tieneUbicacion(v) || !mapaRef.current) return;
        mapaRef.current.flyTo([v.latitud, v.longitud], 16);
        marcadoresRef.current[v.id]?.openPopup();
    };

    if (!isOpen) return null;

    const conUbicacion = visitadores.filter(tieneUbicacion);
    const enLinea = conUbicacion.filter(esActivo).length;
    const sinSenal = conUbicacion.length - enLinea;
    const sinUbicacion = visitadores.length - conUbicacion.length;

    const listaOrdenada = [...visitadores].sort((a, b) => {
        const ma = a.minutos_sin_senal ?? Infinity;
        const mb = b.minutos_sin_senal ?? Infinity;
        return ma - mb;
    });

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-3 md:p-6">
            <div className="bg-white w-full max-w-6xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Encabezado */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
                    <div className="min-w-0">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                            Mapa en vivo de visitadores
                        </h2>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                            {error
                                ? 'No se pudo actualizar. Reintentando…'
                                : consultadoEn
                                    ? `Actualizado a las ${consultadoEn.toLocaleTimeString('es-CO')} · se refresca cada 30 s`
                                    : 'Cargando…'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={cargar}
                            disabled={cargando}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {cargando ? 'Actualizando…' : 'Actualizar'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-black"
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">

                    {/* Mapa */}
                    <div className="relative flex-1 min-h-[300px]">
                        <div ref={contenedorRef} className="absolute inset-0 isolate" />
                    </div>

                    {/* Lista lateral */}
                    <aside className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col max-h-[40%] md:max-h-none">
                        <div className="grid grid-cols-3 gap-2 p-3 border-b border-slate-100 text-center">
                            <div className="rounded-lg bg-emerald-50 py-1.5">
                                <p className="text-base font-black text-emerald-600">{enLinea}</p>
                                <p className="text-[9px] font-bold uppercase text-emerald-700">En línea</p>
                            </div>
                            <div className="rounded-lg bg-slate-100 py-1.5">
                                <p className="text-base font-black text-slate-500">{sinSenal}</p>
                                <p className="text-[9px] font-bold uppercase text-slate-600">Sin señal</p>
                            </div>
                            <div className="rounded-lg bg-amber-50 py-1.5">
                                <p className="text-base font-black text-amber-600">{sinUbicacion}</p>
                                <p className="text-[9px] font-bold uppercase text-amber-700">Sin datos</p>
                            </div>
                        </div>

                        <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {listaOrdenada.map((v) => (
                                <li key={v.id}>
                                    <button
                                        onClick={() => irAVisitador(v)}
                                        disabled={!tieneUbicacion(v)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 disabled:hover:bg-transparent disabled:cursor-default flex items-start gap-2.5"
                                    >
                                        <span
                                            className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                                                !tieneUbicacion(v)
                                                    ? 'bg-amber-400'
                                                    : esActivo(v)
                                                        ? 'bg-emerald-500'
                                                        : 'bg-slate-400'
                                            }`}
                                        />
                                        <span className="min-w-0">
                                            <span className="block text-xs font-bold text-slate-800 truncate">
                                                {v.nombre}
                                            </span>
                                            <span className="block text-[11px] text-slate-500">
                                                {v.zona || 'Sin zona'} · {textoTiempo(v.minutos_sin_senal)}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                            {listaOrdenada.length === 0 && !cargando && (
                                <li className="px-4 py-6 text-center text-xs text-slate-400">
                                    No hay visitadores habilitados.
                                </li>
                            )}
                        </ul>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default MapaVisitadoresModal;