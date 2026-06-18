import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import PanelAdmin from "@/Pages/ADMINISTRADOR/PanelAdmin";
import {
    FaArrowLeft, FaGear, FaEye, FaEyeSlash,
    FaDatabase, FaUser, FaKey, FaGlobe,
    FaTriangleExclamation, FaLock, FaFloppyDisk,
    FaCircleInfo, FaShield, FaCircleCheck, FaXmark
} from 'react-icons/fa6';

// ── Campo de formulario reutilizable ─────────────────────────────────────────
function ConfigField({ label, name, value, onChange, error, icon: Icon, placeholder, helpText, sensitive = false }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                {Icon && <Icon className="text-blue-400 text-[10px]" />}
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</label>
                {sensitive && (
                    <span className="text-[8px] font-black text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase ml-auto">
                        <FaLock className="inline mr-0.5 text-[7px]" /> Sensible
                    </span>
                )}
            </div>
            <div className="relative">
                <input
                    type={sensitive ? (visible ? 'text' : 'password') : 'text'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`w-full bg-[#F8FAFC] border rounded-xl py-2.5 px-4 text-[11px] font-medium focus:outline-none focus:ring-1 transition-all text-slate-700 placeholder:text-slate-300 font-mono ${
                        error ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    autoComplete="off"
                />
                {sensitive && (
                    <button type="button" onClick={() => setVisible(v => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-blue-500 transition-colors">
                        {visible ? <FaEyeSlash className="text-[11px]" /> : <FaEye className="text-[11px]" />}
                    </button>
                )}
            </div>
            {error && <p className="text-[10px] text-red-500 font-semibold pl-0.5">{error}</p>}
            {helpText && !error && (
                <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1 pl-0.5">
                    <FaCircleInfo className="text-[8px] text-slate-300" /> {helpText}
                </p>
            )}
        </div>
    );
}

// ── Indicador de campo ya configurado ────────────────────────────────────────
function CampoGuardado({ label, onCambiar, onBorrar }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <FaCircleCheck className="text-emerald-500 text-[10px]" />
                    <span className="text-[9px] font-black text-emerald-700 uppercase">
                        {label} configurado
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onCambiar}
                        className="text-[8px] font-black uppercase text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-full transition-colors">
                        ✎ Cambiar
                    </button>
                    <button type="button" onClick={onBorrar}
                        className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-full transition-colors">
                        <FaXmark className="text-[7px]" /> Borrar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Fila del panel .env ───────────────────────────────────────────────────────
function EnvRow({ label, saved, editando, borrar, newVal, isPassword }) {
    let valor;
    if (borrar) {
        valor = <span className="text-red-400 italic">{'<se borrará>'}</span>;
    } else if (editando && newVal) {
        valor = <span className="text-amber-300">{isPassword ? '••••••••' : newVal}</span>;
    } else if (saved) {
        valor = <span className="text-slate-500 italic">{'<configurado>'}</span>;
    } else {
        valor = <span className="text-slate-600 italic">{'<vacío>'}</span>;
    }
    return (
        <span className="block">
            <span className="text-emerald-400">{label}=</span>{valor}
        </span>
    );
}

// ── Vista de Configuración ───────────────────────────────────────────────────
export default function OdooConfig({ auth, config = {} }) {

    const { props } = usePage();
    const flash  = props.flash  ?? {};
    const errors = props.errors ?? {};

    // Modo de cada campo: 'guardado' | 'editando' | 'borrar'
    const modoInicial = (saved) => saved ? 'guardado' : 'editando';
    const [modo, setModo] = useState({
        url:      modoInicial(config.url_saved),
        db:       modoInicial(config.db_saved),
        username: modoInicial(config.username_saved),
        password: modoInicial(config.password_saved),
    });

    const { data, setData, post, processing, wasSuccessful } = useForm({
        url:             '',
        db:              '',
        username:        '',
        password:        '',
        borrar_url:      false,
        borrar_db:       false,
        borrar_username: false,
        borrar_password: false,
    });

    const handleChange = (e) => setData(e.target.name, e.target.value);

    const activarCambio = (campo) => {
        setModo(prev => ({ ...prev, [campo]: 'editando' }));
        setData(`borrar_${campo}`, false);
    };

    const activarBorrar = (campo) => {
        setModo(prev => ({ ...prev, [campo]: 'borrar' }));
        setData(campo, '');
        setData(`borrar_${campo}`, true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('odoo.config.save'));
    };

    return (
        <PanelAdmin user={auth?.user}>
            <Head title="Ajustes de Conexión · Odoo" />

            <div className="w-full min-h-screen bg-[#F0F4FA] pb-12">

                {/* ── HEADER ── */}
                <div className="w-full bg-white border-b border-slate-100 px-8 py-5 shadow-sm">
                    <Link href={route('odoo.medicos')}
                        className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-blue-600 transition mb-3">
                        <FaArrowLeft className="text-[8px]" /> Volver a Consulta Odoo
                    </Link>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded inline-block mb-1">
                                Configuración Restringida
                            </p>
                            <h1 className="text-[22px] font-black text-slate-800 leading-none uppercase flex items-center gap-2">
                                <FaGear className="text-slate-500 text-[18px]" />
                                Ajustes de Conexión · Odoo
                            </h1>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Parámetros de acceso al servidor Odoo — variables de entorno (.env)
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
                            <FaShield className="text-amber-500 text-[10px]" />
                            <span className="text-[9px] font-black text-amber-600 uppercase">Solo personal autorizado</span>
                        </div>
                    </div>
                </div>

                {/* ── FORMULARIO ── */}
                <div className="px-8 pt-7 max-w-2xl">

                    {flash.success && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 mb-5">
                            <FaCircleCheck className="text-emerald-500 text-sm shrink-0" />
                            <p className="text-[9px] font-black uppercase text-emerald-700">{flash.success}</p>
                        </div>
                    )}
                    {errors.error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 mb-5">
                            <FaTriangleExclamation className="text-red-400 text-sm shrink-0" />
                            <p className="text-[9px] font-black uppercase text-red-600">{errors.error}</p>
                        </div>
                    )}

                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
                        <FaTriangleExclamation className="text-amber-500 text-sm shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[9px] font-black uppercase text-amber-700 mb-0.5">Zona de acceso restringido</p>
                            <p className="text-[9px] font-medium text-amber-600 leading-relaxed">
                                Los valores actuales nunca se muestran en pantalla por seguridad.
                                Para cambiar un campo usa "Cambiar". Para eliminarlo usa "Borrar".
                                Los campos que no toques se mantendrán igual.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                        {/* Servidor */}
                        <div className="px-6 pt-5 pb-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
                                <FaGlobe className="text-blue-400" /> Servidor
                            </p>
                            <div className="space-y-5">

                                {/* URL */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <FaGlobe className="text-blue-400 text-[10px]" />
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">URL del servidor</label>
                                    </div>
                                    {modo.url === 'guardado' ? (
                                        <CampoGuardado label="URL" onCambiar={() => activarCambio('url')} onBorrar={() => activarBorrar('url')} />
                                    ) : modo.url === 'borrar' ? (
                                        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                            <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1.5">
                                                <FaXmark /> URL — se borrará al guardar
                                            </span>
                                            <button type="button" onClick={() => activarCambio('url')}
                                                className="text-[8px] font-black uppercase text-slate-500 hover:text-slate-700 transition">
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <ConfigField name="url" value={data.url} onChange={handleChange}
                                            error={errors?.url} icon={FaGlobe}
                                            placeholder="https://mi-empresa.odoo.com"
                                            helpText="Incluye el protocolo (https://)" />
                                    )}
                                </div>

                                {/* DB */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <FaDatabase className="text-blue-400 text-[10px]" />
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Base de datos</label>
                                    </div>
                                    {modo.db === 'guardado' ? (
                                        <CampoGuardado label="Base de datos" onCambiar={() => activarCambio('db')} onBorrar={() => activarBorrar('db')} />
                                    ) : modo.db === 'borrar' ? (
                                        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                            <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1.5">
                                                <FaXmark /> Base de datos — se borrará al guardar
                                            </span>
                                            <button type="button" onClick={() => activarCambio('db')}
                                                className="text-[8px] font-black uppercase text-slate-500 hover:text-slate-700 transition">
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <ConfigField name="db" value={data.db} onChange={handleChange}
                                            error={errors?.db} icon={FaDatabase}
                                            placeholder="nombre_de_la_base_de_datos"
                                            helpText="Sensible a mayúsculas" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 mx-6 mt-5" />

                        {/* Credenciales */}
                        <div className="px-6 pt-5 pb-6">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
                                <FaLock className="text-amber-400" /> Credenciales de acceso
                            </p>
                            <div className="space-y-5">

                                {/* Usuario */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <FaUser className="text-blue-400 text-[10px]" />
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Usuario administrador</label>
                                    </div>
                                    {modo.username === 'guardado' ? (
                                        <CampoGuardado label="Usuario" onCambiar={() => activarCambio('username')} onBorrar={() => activarBorrar('username')} />
                                    ) : modo.username === 'borrar' ? (
                                        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                            <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1.5">
                                                <FaXmark /> Usuario — se borrará al guardar
                                            </span>
                                            <button type="button" onClick={() => activarCambio('username')}
                                                className="text-[8px] font-black uppercase text-slate-500 hover:text-slate-700 transition">
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <ConfigField name="username" value={data.username} onChange={handleChange}
                                            error={errors?.username} icon={FaUser}
                                            placeholder="admin"
                                            helpText='Usuario con permisos de API en Odoo' />
                                    )}
                                </div>

                                {/* Contraseña */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <FaKey className="text-blue-400 text-[10px]" />
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Contraseña</label>
                                        <span className="text-[8px] font-black text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase ml-auto">
                                            <FaLock className="inline mr-0.5 text-[7px]" /> Sensible
                                        </span>
                                    </div>
                                    {modo.password === 'guardado' ? (
                                        <CampoGuardado label="Contraseña" onCambiar={() => activarCambio('password')} onBorrar={() => activarBorrar('password')} />
                                    ) : modo.password === 'borrar' ? (
                                        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                            <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1.5">
                                                <FaXmark /> Contraseña — se borrará al guardar
                                            </span>
                                            <button type="button" onClick={() => activarCambio('password')}
                                                className="text-[8px] font-black uppercase text-slate-500 hover:text-slate-700 transition">
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <ConfigField name="password" value={data.password} onChange={handleChange}
                                            error={errors?.password} icon={FaKey}
                                            placeholder="••••••••••••"
                                            helpText="Contraseña del usuario administrador de Odoo"
                                            sensitive />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <Link href={route('odoo.medicos')}
                                className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition">
                                Cancelar
                            </Link>
                            <button type="submit" disabled={processing}
                                className={`inline-flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm transition-colors ${
                                    wasSuccessful ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <FaFloppyDisk className="text-[10px]" />
                                {processing ? 'Guardando...' : wasSuccessful ? '¡Guardado!' : 'Guardar configuración'}
                            </button>
                        </div>
                    </form>

                    {/* Panel .env visual */}
                    <div className="mt-4 bg-slate-800 rounded-2xl px-5 py-4">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest">
                            Estado de variables en .env
                        </p>
                        <code className="text-[10px] font-mono leading-relaxed block space-y-1">
                            <span className="block text-slate-500"># Odoo Config</span>
                            <EnvRow label="ODOO_URL"      saved={config.url_saved}      editando={modo.url === 'editando'}      borrar={modo.url === 'borrar'}      newVal={data.url}      />
                            <EnvRow label="ODOO_DB"       saved={config.db_saved}       editando={modo.db === 'editando'}       borrar={modo.db === 'borrar'}       newVal={data.db}       />
                            <EnvRow label="ODOO_USERNAME" saved={config.username_saved} editando={modo.username === 'editando'} borrar={modo.username === 'borrar'} newVal={data.username} />
                            <EnvRow label="ODOO_PASSWORD" saved={config.password_saved} editando={modo.password === 'editando'} borrar={modo.password === 'borrar'} newVal={data.password} isPassword />
                        </code>
                    </div>

                </div>
            </div>
        </PanelAdmin>
    );
}