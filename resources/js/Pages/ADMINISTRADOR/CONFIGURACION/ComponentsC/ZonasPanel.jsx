import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet-draw'; // side-effect: registra L.Control.Draw / L.Draw.Event en Leaflet
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { FaPlus, FaTrash, FaMapLocationDot, FaPen } from 'react-icons/fa6';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Centro por defecto: Bogotá. Solo importa cuando la zona todavía no tiene polígono.
const CENTRO_DEFECTO = [4.7110, -74.0721];

const latLngsAArray = (layer) => layer.getLatLngs()[0].map(p => [p.lat, p.lng]);

// Integración directa con la API imperativa de Leaflet: react-leaflet-draw (el
// wrapper "oficial") no genera un export ESM compatible con el bundler de este
// proyecto, así que se maneja leaflet-draw a mano vía L.Control.Draw.
function DrawControl({ poligonoInicial, onCambiarPoligono }) {
    const map = useMap();

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
                polygon: { allowIntersection: false, showArea: true },
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

                    <div className="flex-1 min-h-[420px]">
                        <MapaZona poligonoInicial={zona?.poligono} onCambiarPoligono={setPoligono} />
                    </div>

                    <div className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100">
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

    return (
        <div className="space-y-4">
            {modal !== null && (
                <ZonaFormModal zona={Object.keys(modal).length ? modal : null} onClose={() => setModal(null)} />
            )}

            <div className="flex items-center justify-end">
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
