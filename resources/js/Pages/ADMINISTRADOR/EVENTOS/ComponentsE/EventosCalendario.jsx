import React, { useMemo, useRef, useState } from 'react';
import { parseFecha, COLORES_ESTADO } from '../HooksE/useEventoForm';
import { getEstadoEstilo } from '../../VISITAS/ComponentsV/visitaHelpers';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MS_DIA = 86400000;
const MAX_VISIBLES = 3;

const inicioDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sumarDias = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
};
const clave = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const hora = (d) =>
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

const ESTILOS_VISITA_CALENDARIO = {
    'programada': 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
    'efectiva': 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    'sin programar': 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
    'No contactado': 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    'reprogramada': 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
    'cancelada': 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 line-through opacity-70',
};

const EventosCalendario = ({
    eventos = [],
    visitas = [],
    visitadores = [],
    onNew,
    onDayClick,
    onEventClick,
    onVisitaClick,
    onItemMove,
}) => {
    const [cursor, setCursor] = useState(() => {
        const h = new Date();
        return new Date(h.getFullYear(), h.getMonth(), 1);
    });

    const [filtroVisitador, setFiltroVisitador] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'visitas' | 'actividades'
    const [expandido, setExpandido] = useState(null);
    const [diaHover, setDiaHover] = useState(null);
    const arrastre = useRef(null);

    const hoy = inicioDia(new Date());

    // 42 celdas (6 semanas) empezando en lunes
    const dias = useMemo(() => {
        const offset = (cursor.getDay() + 6) % 7;
        const inicio = sumarDias(cursor, -offset);
        return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i));
    }, [cursor]);

    // Items combinados (visitas + actividades) agrupados por día
    const porDia = useMemo(() => {
        const mapa = {};

        // 1. Procesar Visitas
        if (filtroTipo === 'todos' || filtroTipo === 'visitas') {
            visitas
                .filter((v) => !filtroVisitador || String(v.visitador_id) === filtroVisitador)
                .forEach((v) => {
                    const ini = parseFecha(v.fecha_programada);
                    if (!ini || isNaN(ini)) return;

                    const d = inicioDia(ini);
                    const k = clave(d);
                    (mapa[k] ||= []).push({
                        tipo: 'visita',
                        id: `visita-${v.id}`,
                        rawId: v.id,
                        titulo: v.medico ? `${v.medico.nombre} ${v.medico.apellido || ''}`.trim() : 'Médico no asignado',
                        visitadorNombre: v.visitador?.nombre || '',
                        fechaIni: ini,
                        estado: v.estado,
                        raw: v,
                    });
                });
        }

        // 2. Procesar Eventos / Actividades
        if (filtroTipo === 'todos' || filtroTipo === 'actividades') {
            eventos
                .filter((e) => !filtroVisitador || String(e.visitador_id) === filtroVisitador)
                .forEach((e) => {
                    const ini = parseFecha(e.fecha_programada);
                    if (!ini || isNaN(ini)) return;
                    const fin = parseFecha(e.fecha_fin_programada);
                    const ultimo = fin && fin > ini ? inicioDia(new Date(fin.getTime() - 1)) : inicioDia(ini);

                    let d = inicioDia(ini);
                    for (let i = 0; d <= ultimo && i < 62; i++) {
                        const k = clave(d);
                        (mapa[k] ||= []).push({
                            tipo: 'actividad',
                            id: `evento-${e.id}-${i}`,
                            rawId: e.id,
                            titulo: e.nombre_evento || 'Actividad',
                            visitadorNombre: e.visitador?.nombre || '',
                            fechaIni: ini,
                            fechaFin: fin,
                            estado: e.estado,
                            raw: e,
                        });
                        d = sumarDias(d, 1);
                    }
                });
        }

        // Ordenar cada día por hora
        Object.values(mapa).forEach((lista) =>
            lista.sort((a, b) => a.fechaIni.getTime() - b.fechaIni.getTime())
        );

        return mapa;
    }, [eventos, visitas, filtroVisitador, filtroTipo]);

    const irMes = (n) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
    const irHoy = () => {
        const h = new Date();
        setCursor(new Date(h.getFullYear(), h.getMonth(), 1));
    };

    const soltar = (ev, dia) => {
        ev.preventDefault();
        setDiaHover(null);
        const a = arrastre.current;
        arrastre.current = null;
        if (!a) return;
        const delta = Math.round((inicioDia(dia) - inicioDia(a.desde)) / MS_DIA);
        if (delta !== 0 && onItemMove) {
            onItemMove(a.item.raw, delta, a.item.tipo);
        }
    };

    const titulo = cursor.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

    // Contadores de items en el mes actual
    const statsMes = useMemo(() => {
        let totalVisitas = 0;
        let totalActividades = 0;

        visitas.forEach((v) => {
            const d = parseFecha(v.fecha_programada);
            if (d && d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()) {
                if (!filtroVisitador || String(v.visitador_id) === filtroVisitador) totalVisitas++;
            }
        });

        eventos.forEach((e) => {
            const d = parseFecha(e.fecha_programada);
            if (d && d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()) {
                if (!filtroVisitador || String(e.visitador_id) === filtroVisitador) totalActividades++;
            }
        });

        return { totalVisitas, totalActividades };
    }, [cursor, visitas, eventos, filtroVisitador]);

    return (
        <div className="flex flex-col flex-1 p-4 gap-4">
            {/* BARRA SUPERIOR CON CONTROLES Y FILTROS */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50/70 p-3 rounded-2xl border border-slate-200">
                {/* Navegación por meses */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => irMes(-1)}
                            className="px-3 py-1.5 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                            title="Mes anterior"
                        >
                            ‹
                        </button>
                        <button
                            onClick={irHoy}
                            className="px-3 py-1.5 hover:bg-slate-100 text-xs font-black uppercase text-slate-700 border-x border-slate-200 transition-colors"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => irMes(1)}
                            className="px-3 py-1.5 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                            title="Mes siguiente"
                        >
                            ›
                        </button>
                    </div>

                    <h2 className="text-base sm:text-lg font-black capitalize text-slate-800 tracking-tight ml-2">
                        {titulo}
                    </h2>

                    {/* Resumen rápido */}
                    <div className="hidden md:flex items-center gap-2 ml-4">
                        <span className="text-[11px] font-bold bg-blue-100 text-[#3D3FD8] px-2.5 py-0.5 rounded-full">
                            🩺 {statsMes.totalVisitas} visitas
                        </span>
                        <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                            🎯 {statsMes.totalActividades} actividades
                        </span>
                    </div>
                </div>

                {/* Filtros y Botón de Creación */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Filtro por Tipo */}
                    <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setFiltroTipo('todos')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                                filtroTipo === 'todos' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-600'
                            }`}
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            onClick={() => setFiltroTipo('visitas')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                                filtroTipo === 'visitas' ? 'bg-white text-[#3D3FD8] shadow-sm font-black' : 'text-slate-600'
                            }`}
                        >
                            🩺 Visitas
                        </button>
                        <button
                            type="button"
                            onClick={() => setFiltroTipo('actividades')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                                filtroTipo === 'actividades' ? 'bg-white text-indigo-700 shadow-sm font-black' : 'text-slate-600'
                            }`}
                        >
                            🎯 Actividades
                        </button>
                    </div>

                    {/* Filtro por Visitador */}
                    <select
                        value={filtroVisitador}
                        onChange={(e) => setFiltroVisitador(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#3D3FD8] shadow-sm"
                    >
                        <option value="">Todos los visitadores</option>
                        {visitadores.map((v) => (
                            <option key={v.id} value={String(v.id)}>
                                {v.nombre}
                            </option>
                        ))}
                    </select>

                    {/* Botón Nueva Asignación */}
                    <button
                        onClick={() => onNew && onNew()}
                        className="px-4 py-2 bg-[#3D3FD8] text-white text-xs font-black rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                    >
                        <span>+</span>
                        <span>Nueva Asignación</span>
                    </button>
                </div>
            </div>

            {/* CUADRÍCULA DEL CALENDARIO */}
            <div className="grid grid-cols-7 border-t border-l border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                {/* Encabezado Días de la semana */}
                {DIAS.map((d) => (
                    <div
                        key={d}
                        className="bg-slate-100/80 text-center text-xs font-black text-slate-600 py-2.5 border-b border-r border-slate-200 uppercase tracking-wider"
                    >
                        {d}
                    </div>
                ))}

                {/* Celdas de días */}
                {dias.map((dia) => {
                    const k = clave(dia);
                    const lista = porDia[k] || [];
                    const abierto = expandido === k;
                    const visibles = abierto ? lista : lista.slice(0, MAX_VISIBLES);
                    const resto = lista.length - MAX_VISIBLES;
                    const dentro = dia.getMonth() === cursor.getMonth();
                    const esHoy = dia.getTime() === hoy.getTime();

                    return (
                        <div
                            key={k}
                            onClick={() => onDayClick && onDayClick(dia)}
                            onDragOver={(ev) => {
                                ev.preventDefault();
                                setDiaHover(k);
                            }}
                            onDragLeave={() => setDiaHover((h) => (h === k ? null : h))}
                            onDrop={(ev) => soltar(ev, dia)}
                            className={`min-h-[120px] sm:min-h-[135px] border-b border-r border-slate-200 p-1.5 cursor-pointer transition-colors relative flex flex-col justify-between ${
                                diaHover === k
                                    ? 'bg-blue-50 ring-2 ring-inset ring-blue-400'
                                    : dentro
                                    ? 'bg-white hover:bg-slate-50/70'
                                    : 'bg-slate-50/50 hover:bg-slate-100/60'
                            }`}
                        >
                            {/* Número del día */}
                            <div className="flex justify-between items-center mb-1">
                                <span
                                    className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold ${
                                        esHoy
                                            ? 'bg-[#3D3FD8] text-white shadow-sm font-black'
                                            : dentro
                                            ? 'text-slate-800'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    {dia.getDate()}
                                </span>

                                {/* Mini indicador de cantidad de items si hay muchos */}
                                {lista.length > 0 && (
                                    <span className="text-[10px] font-black text-slate-400 pr-1">
                                        {lista.length} {lista.length === 1 ? 'item' : 'items'}
                                    </span>
                                )}
                            </div>

                            {/* Lista de eventos y visitas */}
                            <div className="space-y-1 flex-1">
                                {visibles.map((item) => {
                                    const esVisita = item.tipo === 'visita';
                                    const estiloClase = esVisita
                                        ? ESTILOS_VISITA_CALENDARIO[item.estado] || ESTILOS_VISITA_CALENDARIO.programada
                                        : COLORES_ESTADO[item.estado] || COLORES_ESTADO.programado;

                                    return (
                                        <div
                                            key={item.id}
                                            draggable
                                            onDragStart={(ev) => {
                                                arrastre.current = { item, desde: dia };
                                                ev.dataTransfer.effectAllowed = 'move';
                                                ev.dataTransfer.setData('text/plain', String(item.rawId));
                                            }}
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                if (esVisita) {
                                                    onVisitaClick && onVisitaClick(item.raw);
                                                } else {
                                                    onEventClick && onEventClick(item.raw);
                                                }
                                            }}
                                            title={`${esVisita ? 'Visita Médica' : 'Actividad'}: ${item.titulo} — ${
                                                item.visitadorNombre
                                            } (${item.estado})`}
                                            className={`text-[11px] leading-snug px-1.5 py-1 rounded-lg border truncate cursor-grab active:cursor-grabbing transition-all shadow-xs ${estiloClase}`}
                                        >
                                            <span className="font-black opacity-80">{hora(item.fechaIni)}</span>{' '}
                                            <span>{esVisita ? '🩺' : '🎯'}</span>{' '}
                                            <span className="font-bold">{item.titulo}</span>
                                            {item.visitadorNombre && (
                                                <span className="opacity-75 font-normal text-[10px]">
                                                    {' '}
                                                    · {item.visitadorNombre}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}

                                {!abierto && resto > 0 && (
                                    <button
                                        type="button"
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            setExpandido(k);
                                        }}
                                        className="text-[10px] font-black text-[#3D3FD8] hover:underline block pt-0.5"
                                    >
                                        +{resto} más...
                                    </button>
                                )}
                                {abierto && lista.length > MAX_VISIBLES && (
                                    <button
                                        type="button"
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            setExpandido(null);
                                        }}
                                        className="text-[10px] font-black text-[#3D3FD8] hover:underline block pt-0.5"
                                    >
                                        Ver menos
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* LEYENDA Y GUÍA */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                        Leyenda:
                    </span>
                    <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 🩺 Visita Médica
                    </span>
                    <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> 🎯 Actividad / Evento
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Efectiva / Realizada
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cancelada
                    </span>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                    💡 Haz clic en cualquier día para programar una Visita o Actividad. Arrastra una tarjeta a otro día para reprogramar.
                </div>
            </div>
        </div>
    );
};

export default EventosCalendario;