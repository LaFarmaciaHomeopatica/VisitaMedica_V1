import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet-draw'; // side-effect: registra L.Control.Draw / L.Draw.Event en Leaflet
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { FaPlus, FaTrash, FaMapLocationDot, FaPen, FaXmark, FaMap } from 'react-icons/fa6';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Centro por defecto: Bogotá. Solo importa cuando la zona todavía no tiene polígono.
const CENTRO_DEFECTO = [4.7110, -74.0721];

// Paleta cíclica para diferenciar zonas en el mapa general.
const PALETA_ZONAS = ['#3D3FD8', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const nombreVisitador = (v) => `${v.nombre ?? ''} ${v.apellido ?? ''}`.trim();

const latLngsAArray = (layer) => layer.getLatLngs()[0].map(p => [p.lat, p.lng]);

// Integración directa con la API imperativa de Leaflet: react-leaflet-draw (el
// wrapper "oficial") no genera un export ESM compatible con el bundler de este
// proyecto, así que se maneja leaflet-draw a mano vía L.Control.Draw.
function DrawControl({ poligonoInicial, onCambiarPoligono }) {
    const map = useMap();

    // El contenedor del mapa ahora tiene una altura fija (h-[420px] en el
    // modal), así que un solo invalidateSize() al montar basta. Un
    // ResizeObserver persistente aquí llegó a disparar invalidateSize() a
    // mitad de un trazo activo del dibujo de polígono, lo que confunde al
    // manejador de Leaflet.draw y corta la figura antes de tiempo.
    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 150);
        return () => clearTimeout(t);
    }, [map]);

    useEffect(() => {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        if (poligonoInicial && poligonoInicial.length >= 3) {
            const layer = L.polygon(poligonoInicial);
            drawnItems.addLayer(layer);
            map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        }

        const drawControl = new L.Control.Draw({
            position: 'topright',
            edit: { featureGroup: drawnItems },
            draw: {
                // allowIntersection: false rechaza casi cualquier punto nuevo
                // mientras la figura sigue abierta (el chequeo de auto-intersección
                // da falsos positivos constantemente antes de cerrar el polígono),
                // dejando la herramienta prácticamente inutilizable más allá de un
                // triángulo. Se deja el default de Leaflet (true).
                polygon: { showArea: true },
                rectangle: true,
                marker: false,
                circle: false,
                circlemarker: false,
                polyline: false,
            },
        });
        map.addControl(drawControl);

        const handleCreated = (e) => {
            // Solo permitimos un polígono por zona: si ya había uno, lo reemplazamos.
            drawnItems.eachLayer((l) => { if (l !== e.layer) drawnItems.removeLayer(l); });
            drawnItems.addLayer(e.layer);
            onCambiarPoligono(latLngsAArray(e.layer));
        };
        const handleEdited = (e) => {
            e.layers.eachLayer((layer) => onCambiarPoligono(latLngsAArray(layer)));
        };
        const handleDeleted = () => onCambiarPoligono(null);

        map.on(L.Draw.Event.CREATED, handleCreated);
        map.on(L.Draw.Event.EDITED, handleEdited);
        map.on(L.Draw.Event.DELETED, handleDeleted);

        return () => {
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.off(L.Draw.Event.EDITED, handleEdited);
            map.off(L.Draw.Event.DELETED, handleDeleted);
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
        };
        // Solo al montar: el FeatureGroup y el control se crean una única vez.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}

function MapaZona({ poligonoInicial, onCambiarPoligono }) {
    return (
        <MapContainer center={CENTRO_DEFECTO} zoom={11} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DrawControl poligonoInicial={poligonoInicial} onCambiarPoligono={onCambiarPoligono} />
        </MapContainer>
    );
}

// Ajusta el encuadre del mapa general para que quepan todos los polígonos
// dibujados, y fuerza un invalidateSize al montar dentro del modal.
function AjustarVistaGeneral({ zonasConPoligono }) {
    const map = useMap();

    useEffect(() => {
        const t = setTimeout(() => {
            map.invalidateSize();
            if (zonasConPoligono.length > 0) {
                const bounds = L.latLngBounds(zonasConPoligono.flatMap(z => z.poligono));
                map.fitBounds(bounds, { padding: [30, 30] });
            }
        }, 150);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    return null;
}

function MapaGeneralModal({ zonas, onClose }) {
    const zonasConPoligono = zonas.filter(z => z.poligono && z.poligono.length >= 3);

    const colorPorZona = {};
    zonasConPoligono.forEach((z, i) => { colorPorZona[z.id] = PALETA_ZONAS[i % PALETA_ZONAS.length]; });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[94vh]">
                <div className="p-6 border-b border-slate-100 flex items-start justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase mb-1">Mapa general de zonas</h3>
                        <p className="text-[10px] text-slate-400 uppercase">
                            Todas las zonas dibujadas y los visitadores asignados a cada una
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
                        <FaXmark size={18} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_300px]">
                    <div className="h-[720px] md:h-[720px]">
                        {zonasConPoligono.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center px-6 text-[11px] font-black text-slate-300 uppercase tracking-widest">
                                Ninguna zona tiene un polígono dibujado todavía
                            </div>
                        ) : (
                            <MapContainer center={CENTRO_DEFECTO} zoom={11} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <AjustarVistaGeneral zonasConPoligono={zonasConPoligono} />
                                {zonasConPoligono.map(z => (
                                    <Polygon
                                        key={z.id}
                                        positions={z.poligono}
                                        pathOptions={{ color: colorPorZona[z.id], fillColor: colorPorZona[z.id], fillOpacity: 0.3 }}
                                    >
                                        <Popup>
                                            <p className="font-black uppercase text-[11px] mb-1">{z.nombre}</p>
                                            <p className="text-[10px]">
                                                {z.visitadores?.length
                                                    ? z.visitadores.map(nombreVisitador).join(', ')
                                                    : 'Sin visitadores asignados'}
                                            </p>
                                        </Popup>
                                    </Polygon>
                                ))}
                            </MapContainer>
                        )}
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-slate-100 overflow-y-auto max-h-[720px] p-4 space-y-4">
                        {zonas.length === 0 ? (
                            <p className="text-[10px] text-slate-300 font-black uppercase text-center">Sin zonas</p>
                        ) : zonas.map(z => (
                            <div key={z.id} className="flex items-start gap-2">
                                <span
                                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                                    style={{ background: colorPorZona[z.id] ?? '#cbd5e1' }}
                                />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-slate-700 truncate">{z.nombre}</p>
                                    <p className="text-[9px] text-slate-400 leading-relaxed">
                                        {z.visitadores?.length
                                            ? z.visitadores.map(nombreVisitador).join(', ')
                                            : 'Sin visitadores'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ZonaFormModal({ zona, onClose }) {
    const isEditing = !!zona;
    const [nombre, setNombre] = useState(zona?.nombre || '');
    const [descripcion, setDescripcion] = useState(zona?.descripcion || '');
    const [poligono, setPoligono] = useState(zona?.poligono || null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        if (!nombre) return;
        setProcessing(true);
        setError(null);

        const payload = { nombre, descripcion, poligono };
        const opciones = {
            preserveScroll: true,
            onSuccess: onClose,
            onError: (errs) => setError(Object.values(errs)[0] || 'No se pudo guardar la zona.'),
            onFinish: () => setProcessing(false),
        };

        if (isEditing) {
            router.put(route('Gzonas.update', zona.id), payload, opciones);
        } else {
            router.post(route('Gzonas.store'), payload, opciones);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
                <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 uppercase mb-1">
                                {isEditing ? 'Editar zona' : 'Nueva zona'}
                            </h3>
                            <p className="text-[10px] text-slate-400 uppercase mb-4">
                                Dibuja el polígono de la zona sobre el mapa (herramienta de la esquina superior derecha)
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Nombre</label>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={e => setNombre(e.target.value)}
                                        placeholder="Ej: Zona Norte"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5">Descripción (opcional)</label>
                                    <input
                                        type="text"
                                        value={descripcion}
                                        onChange={e => setDescripcion(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                            {error && <p className="text-[10px] text-rose-500 font-bold mt-2">{error}</p>}
                        </div>

                        {/* Altura fija (no min-h): el hijo de Leaflet usa height:100%, que solo
                            se resuelve contra una altura explícita del padre, no un min-height. */}
                        <div className="h-[420px]">
                            <MapaZona poligonoInicial={zona?.poligono} onCambiarPoligono={setPoligono} />
                        </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                            {poligono ? `Polígono con ${poligono.length} puntos` : 'Sin polígono dibujado todavía'}
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose}
                                className="py-2.5 px-5 text-[10px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={processing || !nombre}
                                className="py-2.5 px-6 bg-[#3D3FD8] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-700 disabled:bg-slate-200 transition-all">
                                {processing ? 'Guardando...' : 'Guardar zona'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FilaZona({ zona, onEditar }) {
    const eliminar = () => {
        if (!confirm(`¿Eliminar la zona "${zona.nombre}"?`)) return;
        router.delete(route('Gzonas.destroy', zona.id), { preserveScroll: true });
    };

    return (
        <tr className="hover:bg-blue-50/20 transition-colors">
            <td className="px-5 py-3 border-r border-slate-50">
                <span className="text-[11px] font-black text-slate-700">{zona.nombre}</span>
            </td>
            <td className="px-4 py-3 border-r border-slate-50">
                <span className="text-[11px] font-medium text-slate-500">{zona.descripcion || '—'}</span>
            </td>
            <td className="px-4 py-3 border-r border-slate-50 text-center">
                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {zona.visitadores_count ?? 0}
                </span>
            </td>
            <td className="px-4 py-3 border-r border-slate-50 text-center">
                {zona.poligono ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                        <FaMapLocationDot className="h-2.5 w-2.5" /> Dibujado
                    </span>
                ) : (
                    <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-full uppercase">
                        Sin dibujar
                    </span>
                )}
            </td>
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                    <button
                        onClick={() => onEditar(zona)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase bg-[#3D3FD8] text-white hover:bg-blue-700 transition-all"
                    >
                        <FaPen className="h-2.5 w-2.5" /> Editar
                    </button>
                    <button
                        onClick={eliminar}
                        className="p-1.5 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"
                        title="Eliminar zona"
                    >
                        <FaTrash className="h-3 w-3" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function ZonasPanel({ zonas }) {
    const [modal, setModal] = useState(null); // null | {} (nueva) | zona (editar)
    const [mostrarMapaGeneral, setMostrarMapaGeneral] = useState(false);

    return (
        <div className="space-y-4">
            {modal !== null && (
                <ZonaFormModal zona={Object.keys(modal).length ? modal : null} onClose={() => setModal(null)} />
            )}
            {mostrarMapaGeneral && (
                <MapaGeneralModal zonas={zonas} onClose={() => setMostrarMapaGeneral(false)} />
            )}

            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => setMostrarMapaGeneral(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
                >
                    <FaMap className="h-3 w-3" /> Ver mapa general
                </button>
                <button
                    onClick={() => setModal({})}
                    className="flex items-center gap-2 px-4 py-3 bg-[#3D3FD8] text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-sm"
                >
                    <FaPlus className="h-3 w-3" /> Nueva zona
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600">
                                <th className="px-5 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Nombre</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Descripción</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Visitadores</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Mapa</th>
                                <th className="px-4 py-3 text-white text-[9px] font-black uppercase text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {zonas.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        No hay zonas registradas
                                    </td>
                                </tr>
                            ) : zonas.map(z => (
                                <FilaZona key={z.id} zona={z} onEditar={setModal} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
