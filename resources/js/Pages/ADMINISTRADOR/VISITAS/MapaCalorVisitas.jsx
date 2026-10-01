import React, { useEffect, useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import PanelAdmin from '../PanelAdmin';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaArrowLeft, FaUserTie, FaCalendarAlt, FaFilter } from 'react-icons/fa';

const MapaCalorVisitas = ({ auth, puntos = [], visitadores = [] }) => {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    
    // Estados de Filtros
    const [selectedVisitador, setSelectedVisitador] = useState('');
    const [tipoFiltroFecha, setTipoFiltroFecha] = useState('mes'); // 'mes' | 'rango' | 'todos'
    
    // Inicializar mes actual (formato YYYY-MM)
    const currentMonthStr = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }, []);

    const [selectedMes, setSelectedMes] = useState(currentMonthStr);
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // 1. Filtrado dinámico de puntos
    const puntosFiltrados = useMemo(() => {
        return puntos.filter(p => {
            // Filtro por Visitador
            if (selectedVisitador && p.visitador_id !== Number(selectedVisitador)) {
                return false;
            }

            // Usar fecha_realizada o fecha_programada
            const fechaRefStr = p.fecha_realizada || p.fecha_programada;
            if (!fechaRefStr) return false;

            // Filtro por Fecha
            if (tipoFiltroFecha === 'mes' && selectedMes) {
                return fechaRefStr.startsWith(selectedMes);
            }

            if (tipoFiltroFecha === 'rango') {
                const fechaItem = new Date(fechaRefStr.substring(0, 10));
                if (fechaDesde) {
                    const desde = new Date(fechaDesde);
                    if (fechaItem < desde) return false;
                }
                if (fechaHasta) {
                    const hasta = new Date(fechaHasta);
                    if (fechaItem > hasta) return false;
                }
            }

            return true;
        });
    }, [puntos, selectedVisitador, tipoFiltroFecha, selectedMes, fechaDesde, fechaHasta]);

    // 2. Cargar script de leaflet-heat
    useEffect(() => {
        if (window.L && window.L.heatLayer) {
            setScriptLoaded(true);
            return;
        }

        window.L = L;

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // 3. Renderizar mapa
    useEffect(() => {
        if (!scriptLoaded) return;

        const container = L.DomUtil.get('heatmap-container');
        if (container != null) {
            container._leaflet_id = null;
        }

        const defaultLat = puntosFiltrados.length > 0 ? puntosFiltrados[0].lat : 4.60971;
        const defaultLng = puntosFiltrados.length > 0 ? puntosFiltrados[0].lng : -74.08175;
        const zoomLevel = puntosFiltrados.length > 0 ? 14 : 12;

        const map = L.map('heatmap-container').setView([defaultLat, defaultLng], zoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const heatPoints = puntosFiltrados.map(p => [p.lat, p.lng, 1.0]);

        if (window.L.heatLayer && heatPoints.length > 0) {
            window.L.heatLayer(heatPoints, {
                radius: 35,
                blur: 20,
                maxZoom: 17,
                gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
            }).addTo(map);
        }

        puntosFiltrados.forEach(p => {
            const circleMarker = L.circleMarker([p.lat, p.lng], {
                radius: 8,
                fillColor: '#3D3FD8',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(map);

            circleMarker.bindPopup(`
                <div style="font-family: sans-serif; font-size: 11px; line-height: 1.4;">
                    <b style="color: #3D3FD8;">VISITA REGISTRADA</b><br>
                    <b>Médico:</b> ${p.medico}<br>
                    <b>Visitador:</b> ${p.visitador}<br>
                    <b>Fecha:</b> ${p.fecha_realizada || p.fecha_programada || 'Sin fecha'}
                </div>
            `);
        });

        return () => {
            map.remove();
        };
    }, [scriptLoaded, puntosFiltrados]);

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Mapa de Calor de Visitas" />

            <div className="w-full min-h-screen flex flex-col bg-slate-50 p-4">
                {/* BARRA SUPERIOR DE CONTROL */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    
                    {/* ENCABEZADO Y REGRESO */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route('Gvisitas.index'))}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                        >
                            <FaArrowLeft size={14} /> Volver
                        </button>
                        <h1 className="text-sm font-black text-slate-800 uppercase tracking-wide border-l border-slate-200 pl-3">
                            Mapa de Calor
                        </h1>
                    </div>

                    {/* CONTROLES DE FILTRADO */}
                    <div className="flex flex-wrap items-center gap-3">
                        
                        {/* 1. FILTRO VISITADOR */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5">
                            <FaUserTie className="text-slate-400" size={13} />
                            <select
                                value={selectedVisitador}
                                onChange={(e) => setSelectedVisitador(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                            >
                                <option value="">Todos los Visitadores</option>
                                {visitadores.map(v => (
                                    <option key={v.id} value={v.id}>{v.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. SELECTOR MODO DE FECHA */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setTipoFiltroFecha('mes')}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                                    tipoFiltroFecha === 'mes' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                                }`}
                            >
                                Por Mes
                            </button>
                            <button
                                onClick={() => setTipoFiltroFecha('rango')}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                                    tipoFiltroFecha === 'rango' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                                }`}
                            >
                                Rango Libre
                            </button>
                            <button
                                onClick={() => setTipoFiltroFecha('todos')}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                                    tipoFiltroFecha === 'todos' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                                }`}
                            >
                                Histórico
                            </button>
                        </div>

                        {/* 3A. INPUT DE MES */}
                        {tipoFiltroFecha === 'mes' && (
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5">
                                <FaCalendarAlt className="text-slate-400" size={12} />
                                <input
                                    type="month"
                                    value={selectedMes}
                                    onChange={(e) => setSelectedMes(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                                />
                            </div>
                        )}

                        {/* 3B. INPUTS DE RANGO LIBRE */}
                        {tipoFiltroFecha === 'rango' && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5">
                                    <span className="text-[10px] font-bold text-slate-400">DEL:</span>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(e) => setFechaDesde(e.target.value)}
                                        className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5">
                                    <span className="text-[10px] font-bold text-slate-400">AL:</span>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(e) => setFechaHasta(e.target.value)}
                                        className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* INDICADOR DE PUNTOS */}
                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 whitespace-nowrap">
                            Puntos: {puntosFiltrados.length}
                        </span>
                    </div>
                </div>

                {/* CONTENEDOR DEL MAPA */}
                <div className="w-full flex-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm min-h-[550px] relative">
                    <div id="heatmap-container" className="w-full h-[600px] rounded-lg z-10" />
                </div>
            </div>
        </PanelAdmin>
    );
};

export default MapaCalorVisitas;