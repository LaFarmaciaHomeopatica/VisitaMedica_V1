import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import PanelAdmin from "@/Pages/ADMINISTRADOR/PanelAdmin";
import {
    FaMagnifyingGlass, FaGear, FaPlug, FaCircleCheck,
    FaCircleXmark, FaTriangleExclamation, FaUser,
    FaIdCard, FaStethoscope, FaArrowLeft, FaDatabase,
    FaCircleNotch, FaSpinner
} from 'react-icons/fa6';

// ── Badge de estado de conexión ──────────────────────────────────────────────
function ConexionBadge({ estado = 'sin_probar' }) {
    const map = {
        conectado:  { color: '#10b981', Icon: FaCircleCheck,       label: 'Conectado' },
        error:      { color: '#ef4444', Icon: FaCircleXmark,        label: 'Sin conexión' },
        sin_probar: { color: '#94a3b8', Icon: FaTriangleExclamation, label: 'Sin configurar' },
    };
    const { color, Icon, label } = map[estado] ?? map.sin_probar;

    return (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border"
              style={{ color, background: `${color}12`, borderColor: `${color}30` }}>
            <Icon className="text-[8px]" />
            {label}
        </span>
    );
}

// ── Fila de resultado de médico ──────────────────────────────────────────────
function MedicoRow({ medico, index }) {
    return (
        <tr className={`hover:bg-blue-50/20 transition-colors ${index % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
            <td className="px-6 py-3 border-r border-slate-100">
                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    #{medico.id}
                </span>
            </td>
            <td className="px-6 py-3 border-r border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <FaUser className="text-blue-500 text-[10px]" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                            {medico.nombre} {medico.apellido}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">{medico.email ?? '—'}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-3 border-r border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-600 font-mono">{medico.documento ?? '—'}</span>
            </td>
            <td className="px-6 py-3 border-r border-slate-100 text-center">
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                    {medico.especialidad ?? 'No registrada'}
                </span>
            </td>
            <td className="px-6 py-3 text-center">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    medico.activo
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-red-500 bg-red-50'
                }`}>
                    {medico.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
        </tr>
    );
}

// ── Vista principal ──────────────────────────────────────────────────────────
export default function OdooMedicos({ auth, conexionEstado = 'sin_probar' }) {

    const [documento, setDocumento] = useState('');
    const [buscando, setBuscando]   = useState(false);
    const [resultados, setResultados] = useState([]);
    const [buscado, setBuscado]     = useState(false);
    const [errorMsg, setErrorMsg]   = useState('');

    // Simulación visual de búsqueda (sin API real aún)
    const handleBuscar = (e) => {
        e.preventDefault();
        if (!documento.trim()) return;

        setBuscando(true);
        setErrorMsg('');
        setResultados([]);
        setBuscado(false);

        // Placeholder — aquí irá la llamada real al controlador
        setTimeout(() => {
            setBuscando(false);
            setBuscado(true);
            // Sin datos reales aún — el controlador se implementará después
            setResultados([]);
            setErrorMsg('Controlador pendiente de implementación bajo supervisión.');
        }, 1200);
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Consulta Médicos · Odoo" />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* ── HEADER ─────────────────────────────────────────────── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1">
                                Integración Externa
                            </p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase flex items-center gap-2">
                                <FaDatabase className="text-blue-500 text-[18px]" />
                                Consulta de Médicos · Odoo
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Módulo de pruebas — validación de conexión con el servidor Odoo
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mt-1">
                            {/* Estado de conexión */}
                            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-full px-4 py-2 shadow-sm">
                                <FaPlug className="text-slate-400 text-[10px]" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Estado API:</span>
                                <ConexionBadge estado={conexionEstado} />
                            </div>

                            {/* Botón Ajustes */}
                            <Link
                                href={route('odoo.config')}
                                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full shadow-sm transition-colors"
                            >
                                <FaGear className="text-[10px]" />
                                Ajustes de Conexión
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────── */}
                <div className="px-8 pt-7 space-y-6">

                    {/* Buscador */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                            Consultar médico por número de documento
                        </p>
                        <form onSubmit={handleBuscar} className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <FaIdCard className="text-xs" />
                                </span>
                                <input
                                    type="text"
                                    value={documento}
                                    onChange={e => setDocumento(e.target.value)}
                                    placeholder="Ej: 1012345678"
                                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-700"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={buscando || !documento.trim()}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm transition-colors"
                            >
                                {buscando
                                    ? <><FaSpinner className="animate-spin text-[10px]" /> Consultando...</>
                                    : <><FaMagnifyingGlass className="text-[10px]" /> Consultar Odoo</>
                                }
                            </button>
                        </form>

                        {/* Aviso pendiente */}
                        <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <FaTriangleExclamation className="text-amber-500 text-[10px] mt-0.5 shrink-0" />
                            <p className="text-[9px] font-bold text-amber-700 uppercase">
                                Módulo en fase de pruebas — El controlador de integración será implementado bajo supervisión del responsable técnico.
                                Las consultas aún no retornan datos reales.
                            </p>
                        </div>
                    </div>

                    {/* Resultado de búsqueda */}
                    {buscado && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <FaStethoscope className="text-blue-500 text-sm" />
                                    <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        Resultado de consulta · Doc: {documento}
                                    </h3>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase">
                                    {resultados.length} registro(s) encontrado(s)
                                </span>
                            </div>

                            {resultados.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-blue-600">
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">ID Odoo</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500">Nombre Completo</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Documento</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase border-r border-blue-500 text-center">Especialidad</th>
                                            <th className="px-6 py-3 text-white text-[9px] font-black uppercase text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {resultados.map((m, i) => <MedicoRow key={m.id} medico={m} index={i} />)}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-16 text-slate-400">
                                    <FaUser className="text-4xl text-slate-200 mb-2 mx-auto block" />
                                    <p className="text-[11px] font-bold uppercase">
                                        {errorMsg || 'No se encontraron registros para este documento.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Estado inicial */}
                    {!buscado && !buscando && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                            <FaDatabase className="text-4xl text-slate-200 mb-2 mx-auto block" />
                            <p className="text-[11px] font-bold uppercase">
                                Ingresa un número de documento para consultar en Odoo
                            </p>
                            <p className="text-[9px] font-medium text-slate-300 mt-1 uppercase">
                                Los resultados aparecerán aquí
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PanelAdmin>
    );
}