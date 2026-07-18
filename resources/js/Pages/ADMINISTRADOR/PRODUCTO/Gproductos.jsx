import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import * as XLSX from 'xlsx';
import PanelAdmin from '../PanelAdmin';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Hooks
import ProductosToolbar from "./ComponentsP/ProductosToolbar";
import ProductosTable from "./ComponentsP/ProductosTable";
import ProductoFormModal from "./ComponentsP/ProductoFormModal";
import ProductoImportPreviewModal from "./ComponentsP/ProductoImportPreviewModal";
import ProductoImportWarningModal from "./ComponentsP/ProductoImportWarningModal";
import ProductoDeleteModal from "./ComponentsP/ProductoDeleteModal";

import { useProductosFilter } from "./HooksP/useProductosFilter";
import { useProductosSelection } from "./HooksP/useProductosSelection";
import { useProductosImport } from "./HooksP/useProductosImport";
import { useProductoForm } from "./HooksP/useProductoForm";

// ── helpers ────────────────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('es-CO').format(Math.round(n ?? 0));
// Valor completo en pesos, sin abreviar a K/M/B.
const fmtM = n => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n ?? 0);

const LAB_COLORS = ['#3D3FD8','#4184F0','#06b6d4','#10b981','#f59e0b','#8b5cf6','#ef4444','#ec4899','#14b8a6','#f97316'];
const MESES_ES   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const fmtMes = m => { const [y, mo] = m.split('-'); return `${MESES_ES[parseInt(mo) - 1]} ${y}`; };

function KpiCard({ label, value, sub, accent }) {
    return (
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4"
             style={{ borderTopColor: accent, borderTopWidth: 4 }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
            <p className="text-[22px] font-black text-slate-800 leading-none">{value}</p>
            {sub && <p className="text-[9px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

function ChartTooltip({ active, payload, label, isUnit = false }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-[10px]">
            <p className="font-black text-slate-500 mb-1 uppercase">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-bold">
                    {p.name}: {isUnit ? fmt(p.value) : fmtM(p.value)}
                </p>
            ))}
        </div>
    );
}

function MedicosTabla({ title, subtitle, data = [], metric, accent = '#4184F0' }) {
    const maxVal = Math.max(...data.map(d => Number(d[metric])), 1);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{subtitle}</p>
                <p className="text-[13px] font-black text-slate-800">{title}</p>
            </div>
            <div className="divide-y divide-slate-50">
                {data.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-slate-300 text-[11px]">Sin datos</div>
                ) : data.map((m, i) => {
                    const val = Number(m[metric]);
                    const pct = Math.round((val / maxVal) * 100);
                    return (
                        <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                            <span className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black text-white shrink-0"
                                  style={{ background: accent }}>{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-slate-700 truncate uppercase">{m.nombre_medico}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
                                    </div>
                                    <span className="text-[9px] font-black shrink-0" style={{ color: accent }}>{fmtM(val)}</span>
                                </div>
                                <p className="text-[8px] text-slate-400 mt-0.5 font-mono">
                                    {fmt(m.unidades_compradas)} un.c · {fmt(m.unidades_formuladas)} un.f · {fmt(m.transacciones)} tx
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── página ─────────────────────────────────────────────────────────────────────
const Gproductos = ({
    productos = [],
    productoActivo = null,
    statsProductos = {},
    topProductos = [],
    topCompradores = [],
    topFormuladores = [],
    porLaboratorio = [],
    tendencia = [],
}) => {
    const filter    = useProductosFilter(productos);
    const selection = useProductosSelection();
    const importHook = useProductosImport(productos);
    const form      = useProductoForm();

    const [vista, setVista] = useState('lista'); // 'lista' | 'estadisticas'
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // ── exportar ──────────────────────────────────────────────────────────────
    const handleExport = () => {
        const data = selection.selectedIds.length > 0
            ? productos.filter(p => selection.selectedIds.includes(p.id))
            : filter.filteredProductos;
        if (!data.length) return;
        const ws = XLSX.utils.json_to_sheet(data.map(p => ({
            codigo: p.codigo, nombre: p.nombre, laboratorio: p.laboratorio || 'N/A',
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        XLSX.writeFile(wb, `Reporte_Productos_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    // ── data para gráficos ────────────────────────────────────────────────────
    const tendenciaData = tendencia.map(d => ({
        mes:      d.mes,
        comprado: Number(d.valor_comprado),
        formulado:Number(d.valor_formulado),
        un_comp:  Number(d.unidades_compradas  ?? 0),
        un_form:  Number(d.unidades_formuladas ?? 0),
    }));

    const meses = tendenciaData.map(d => d.mes);
    const [mesDesde, setMesDesde] = useState(() => meses[Math.max(0, meses.length - 12)] ?? '');
    const [mesFin,   setMesFin]   = useState(() => meses[meses.length - 1] ?? '');
    const [metrica,  setMetrica]  = useState('valor');

    useEffect(() => {
        const ms = (tendencia ?? []).map(d => d.mes);
        setMesDesde(ms[Math.max(0, ms.length - 12)] ?? '');
        setMesFin(ms[ms.length - 1] ?? '');
    }, [tendencia]);

    const tendenciaFiltrada = tendenciaData.filter(
        d => (!mesDesde || d.mes >= mesDesde) && (!mesFin || d.mes <= mesFin)
    );

    const compBarData = topProductos.map(p => ({
        name:      p.nombre.length > 22 ? p.nombre.slice(0, 21) + '…' : p.nombre,
        comprado:  metrica === 'valor' ? Number(p.valor_comprado)    : Number(p.unidades_compradas),
        formulado: metrica === 'valor' ? Number(p.valor_formulado)   : Number(p.unidades_formuladas ?? 0),
    }));

    const maxTop = topProductos[0]?.valor_comprado ?? 1;

    // ── buscador de producto ──────────────────────────────────────────────────
    const prodRef = useRef(null);
    const [prodSearch, setProdSearch] = useState(
        () => productoActivo ? (productos.find(p => p.codigo === productoActivo)?.nombre ?? '') : ''
    );
    const [prodOpen, setProdOpen] = useState(false);

    useEffect(() => {
        const handler = e => { if (prodRef.current && !prodRef.current.contains(e.target)) setProdOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const prodSugerencias = useMemo(() => {
        const term = prodSearch.toLowerCase().trim();
        if (!term) return productos.slice(0, 25);
        return productos.filter(p =>
            p.nombre.toLowerCase().includes(term) ||
            (p.laboratorio && p.laboratorio.toLowerCase().includes(term)) ||
            p.codigo.toLowerCase().includes(term)
        ).slice(0, 25);
    }, [prodSearch, productos]);

    return (
        <PanelAdmin>
            <Head title="Gestión de Productos" />

            <div className="w-full min-h-screen flex flex-col bg-white">

                {/* ── TOOLBAR ──────────────────────────────────────────────── */}
                <ProductosToolbar
                    searchTerm={filter.searchTerm}
                    onSearchChange={filter.setSearchTerm}
                    selectedIds={selection.selectedIds}
                    fileInputRef={importHook.fileInputRef}
                    onImport={importHook.handleImportClick}
                    onFileChange={importHook.handleFileChange}
                    onTemplate={importHook.handleDownloadTemplate}
                    onExport={handleExport}
                    onDelete={() => { if (selection.selectedIds.length > 0) setIsDeleteModalOpen(true); }}
                    onNew={form.openCreateModal}
                    currentItems={filter.currentItems}
                    onSelectAll={selection.handleSelectAll}
                    itemsPerPage={filter.itemsPerPage}
                    onItemsPerPageChange={filter.setItemsPerPage}
                    currentPage={filter.currentPage}
                    onPageChange={filter.setCurrentPage}
                    totalPages={filter.totalPages}
                />

                {/* ── TABS LISTA / ESTADÍSTICAS ─────────────────────────────── */}
                <div className="flex gap-1 px-6 pt-16 pb-2 border-b border-slate-100 bg-white sticky top-20 z-40">
                    {[['lista', 'Lista'], ['estadisticas', 'Estadísticas']].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setVista(key)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                vista === key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── VISTA: LISTA ──────────────────────────────────────────── */}
                {vista === 'lista' && (
                    <ProductosTable
                        currentItems={filter.currentItems}
                        selectedIds={selection.selectedIds}
                        onSelectOne={selection.handleSelectOne}
                        onEdit={form.openEditModal}
                    />
                )}

                {/* ── VISTA: ESTADÍSTICAS ───────────────────────────────────── */}
                {vista === 'estadisticas' && (
                    <div className="px-6 py-6 space-y-6 bg-[#F0F4FA] flex-1">

                        {/* ── FILTROS ──────────────────────────────────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex flex-wrap gap-6 items-start">

                            {/* Buscador de producto */}
                            <div className="relative" ref={prodRef}>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Producto</p>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, laboratorio o código…"
                                        value={prodSearch}
                                        onFocus={() => setProdOpen(true)}
                                        onChange={e => { setProdSearch(e.target.value); setProdOpen(true); }}
                                        className="text-[10px] font-bold text-slate-700 border border-slate-200 rounded-lg pl-3 pr-7 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-[270px]"
                                    />
                                    {prodSearch ? (
                                        <button
                                            onClick={() => { setProdSearch(''); setProdOpen(false); router.get(route('Gproductos.index'), {}, { preserveState: true }); }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-[11px] leading-none"
                                        >✕</button>
                                    ) : (
                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 text-[13px] leading-none pointer-events-none">⌕</span>
                                    )}
                                </div>

                                {prodOpen && (
                                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-[270px] max-h-60 overflow-y-auto">
                                        <button
                                            onMouseDown={e => { e.preventDefault(); setProdSearch(''); setProdOpen(false); router.get(route('Gproductos.index'), {}, { preserveState: true }); }}
                                            className={`w-full text-left px-4 py-2.5 text-[10px] border-b border-slate-50 transition-colors ${!productoActivo ? 'bg-blue-50 font-black text-blue-700' : 'font-bold text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            Todos los productos
                                        </button>
                                        {prodSugerencias.length === 0 ? (
                                            <p className="px-4 py-3 text-[10px] text-slate-400 italic">Sin coincidencias</p>
                                        ) : prodSugerencias.map(p => (
                                            <button
                                                key={p.id}
                                                onMouseDown={e => { e.preventDefault(); setProdSearch(p.nombre); setProdOpen(false); router.get(route('Gproductos.index'), { producto_codigo: p.codigo }, { preserveState: true }); }}
                                                className={`w-full text-left px-4 py-2.5 transition-colors hover:bg-blue-50 ${productoActivo === p.codigo ? 'bg-blue-50 font-black text-blue-700' : 'font-bold text-slate-700'}`}
                                            >
                                                <p className="text-[10px] truncate">{p.nombre}</p>
                                                {p.laboratorio && <p className="text-[8px] text-slate-400 font-normal truncate">{p.laboratorio}</p>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Rango del histórico */}
                            {meses.length > 0 && (
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Rango del histórico</p>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={mesDesde}
                                            onChange={e => { const v = e.target.value; setMesDesde(v); if (v > mesFin) setMesFin(v); }}
                                            className="text-[10px] font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        >
                                            {meses.filter(m => !mesFin || m <= mesFin).map(m => (
                                                <option key={m} value={m}>{fmtMes(m)}</option>
                                            ))}
                                        </select>
                                        <span className="text-slate-300 font-black text-sm select-none">→</span>
                                        <select
                                            value={mesFin}
                                            onChange={e => { const v = e.target.value; setMesFin(v); if (v < mesDesde) setMesDesde(v); }}
                                            className="text-[10px] font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        >
                                            {meses.filter(m => !mesDesde || m >= mesDesde).map(m => (
                                                <option key={m} value={m}>{fmtMes(m)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── KPIs ─────────────────────────────────────────────── */}
                        <div className="flex gap-4">
                            <KpiCard label="Total productos"   value={fmt(statsProductos.total)}               accent="#4184F0" />
                            <KpiCard label="Laboratorios"      value={fmt(statsProductos.laboratorios)}         accent="#3D3FD8" />
                            <KpiCard label="Con transacciones" value={fmt(statsProductos.activos)}              accent="#06b6d4" />
                            <KpiCard label="Transacciones"     value={fmt(statsProductos.total_transacciones)}  accent="#8b5cf6" />
                            <KpiCard label="Valor comprado"    value={fmtM(statsProductos.valor_comprado)}      accent="#10b981" />
                            <KpiCard label="Valor formulado"   value={fmtM(statsProductos.valor_formulado)}     accent="#f59e0b" />
                            <KpiCard label="Un. compradas"     value={fmt(statsProductos.unidades_compradas)}   accent="#ef4444" />
                            <KpiCard label="Un. formuladas"    value={fmt(statsProductos.unidades_formuladas)}  accent="#ec4899" />
                        </div>

                        {/* ── TENDENCIA + TOP 10 ───────────────────────────────── */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Histórico</p>
                                <p className="text-[13px] font-black text-slate-800 mb-4">
                                    Valor comprado vs formulado{mesDesde && mesFin ? ` · ${mesDesde} → ${mesFin}` : ''}
                                </p>
                                {tendenciaFiltrada.length === 0 ? (
                                    <div className="flex items-center justify-center h-56 text-slate-300 text-[11px]">Sin datos en el rango seleccionado</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={tendenciaFiltrada} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gc2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#4184F0" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#4184F0" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="gf2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="mes" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                                            <YAxis tickFormatter={v => fmtM(v)} tick={{ fontSize: 8, fill: '#94a3b8' }} width={55} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                            <Area type="monotone" dataKey="comprado"  name="Comprado"  stroke="#4184F0" fill="url(#gc2)" strokeWidth={2} dot={false} />
                                            <Area type="monotone" dataKey="formulado" name="Formulado" stroke="#8b5cf6" fill="url(#gf2)" strokeWidth={2} dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ranking</p>
                                <p className="text-[13px] font-black text-slate-800 mb-4">Top 10 por valor comprado</p>
                                <div className="space-y-3">
                                    {topProductos.map((p, i) => {
                                        const pct = Math.round((p.valor_comprado / maxTop) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 bg-slate-400">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-700 flex-1 truncate" title={p.nombre}>{p.nombre}</span>
                                                    <span className="text-[9px] font-black text-slate-700 shrink-0">{fmtM(p.valor_comprado)}</span>
                                                </div>
                                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: LAB_COLORS[i % LAB_COLORS.length] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── COMPARACIÓN COMPRADO vs FORMULADO ───────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Comparación</p>
                                    <p className="text-[13px] font-black text-slate-800">Comprado vs Formulado por producto</p>
                                </div>
                                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                    {[['valor', '$ Valor'], ['unidades', '# Unidades']].map(([key, label]) => (
                                        <button key={key} onClick={() => setMetrica(key)}
                                                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${
                                                    metrica === key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                }`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {compBarData.length === 0 ? (
                                <div className="flex items-center justify-center h-48 text-slate-300 text-[11px]">Sin datos</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={Math.max(180, compBarData.length * 46)}>
                                    <BarChart layout="vertical" data={compBarData} margin={{ top: 4, right: 30, left: 0, bottom: 4 }}>
                                        <XAxis type="number"
                                               tickFormatter={metrica === 'valor' ? v => fmtM(v) : v => fmt(v)}
                                               tick={{ fontSize: 8, fill: '#94a3b8' }} />
                                        <YAxis type="category" dataKey="name" width={148}
                                               tick={{ fontSize: 9, fontWeight: 700, fill: '#475569' }} />
                                        <Tooltip content={props => <ChartTooltip {...props} isUnit={metrica === 'unidades'} />} />
                                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                                        <Bar dataKey="comprado"  name="Comprado"  fill="#4184F0" radius={[0, 4, 4, 0]} barSize={10} />
                                        <Bar dataKey="formulado" name="Formulado" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={10} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* ── TOP MÉDICOS ──────────────────────────────────────── */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <MedicosTabla
                                title="Top compradores"
                                subtitle="Mayor valor comprado"
                                data={topCompradores}
                                metric="valor_comprado"
                                accent="#4184F0"
                            />
                            <MedicosTabla
                                title="Top formuladores"
                                subtitle="Mayor valor formulado"
                                data={topFormuladores}
                                metric="valor_formulado"
                                accent="#8b5cf6"
                            />
                        </div>

                        {/* ── RANKING LABORATORIOS ─────────────────────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Distribución</p>
                                <p className="text-[13px] font-black text-slate-800">Ranking por laboratorio</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400">#</th>
                                            <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400">Laboratorio</th>
                                            <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Productos</th>
                                            <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Médicos</th>
                                            <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Un. compradas</th>
                                            <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400">Valor comprado</th>
                                            <th className="px-5 py-3 text-[9px] font-black uppercase text-slate-400">Valor formulado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {porLaboratorio.map((lab, i) => {
                                            const maxLab = porLaboratorio[0]?.valor_comprado ?? 1;
                                            const pct = Math.round((lab.valor_comprado / maxLab) * 100);
                                            return (
                                                <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white bg-slate-400">
                                                            {i + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <p className="text-[10px] font-black text-slate-700 uppercase">{lab.laboratorio ?? 'Sin laboratorio'}</p>
                                                    </td>
                                                    <td className="px-5 py-3 text-center text-[10px] font-black text-slate-600">{fmt(lab.num_productos)}</td>
                                                    <td className="px-5 py-3 text-center text-[10px] font-black text-slate-600">{fmt(lab.medicos)}</td>
                                                    <td className="px-5 py-3 text-center text-[10px] font-black text-slate-600">{fmt(lab.unidades_compradas)}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: LAB_COLORS[i % LAB_COLORS.length] }} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-emerald-600 whitespace-nowrap w-16 text-right">{fmtM(lab.valor_comprado)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-[10px] font-black text-purple-600">{fmtM(lab.valor_formulado)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* ── MODALES ─────────────────────────────────────────────────────── */}
            <ProductoFormModal
                isOpen={form.isModalOpen}
                onClose={() => form.setIsModalOpen(false)}
                isEditing={form.isEditing}
                data={form.data}
                setData={form.setData}
                processing={form.processing}
                onSubmit={form.handleSubmit}
            />
            <ProductoImportPreviewModal
                isOpen={importHook.isPreviewModalOpen}
                onClose={() => importHook.setIsPreviewModalOpen(false)}
                onConfirm={importHook.handleProcessImport}
                previewData={importHook.previewData}
                productos={productos}
                activeTab={importHook.activeTab}
                setActiveTab={importHook.setActiveTab}
            />
            <ProductoImportWarningModal
                isOpen={importHook.isWarningModalOpen}
                duplicatesCount={importHook.duplicatesFound.length}
                onConfirm={() => importHook.executeServerImport(true)}
                onCancel={() => importHook.setIsWarningModalOpen(false)}
            />
            <ProductoDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    if (!selection.selectedIds.length) return;
                    router.post(route('Gproductos.destroy'), { ids: selection.selectedIds }, {
                        onSuccess: () => { setIsDeleteModalOpen(false); selection.clearSelection(); },
                        preserveScroll: true,
                    });
                }}
                count={selection.selectedIds.length}
            />
        </PanelAdmin>
    );
};

export default Gproductos;
