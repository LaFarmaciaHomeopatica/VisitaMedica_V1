import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import {
    FaGear, FaEye, FaEyeSlash, FaDatabase, FaUser, FaKey, FaGlobe,
    FaLock, FaFloppyDisk, FaCircleInfo, FaShield, FaCircleCheck, FaXmark,
    FaTriangleExclamation,
} from 'react-icons/fa6';

// ── Campo de formulario reutilizable (ajustes de conexión Odoo) ────────────
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
    );
}

// ── Campo de ajuste de conexión con sus tres modos (guardado/editando/borrar) ─
function CampoConexion({ label, name, icon, placeholder, helpText, sensitive, modo, data, errors, onChange, onCambiar, onBorrar }) {
    if (modo === 'guardado') {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                    {icon && React.createElement(icon, { className: 'text-blue-400 text-[10px]' })}
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</label>
                </div>
                <CampoGuardado label={label} onCambiar={onCambiar} onBorrar={onBorrar} />
            </div>
        );
    }

    if (modo === 'borrar') {
        return (
            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                    {icon && React.createElement(icon, { className: 'text-blue-400 text-[10px]' })}
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</label>
                </div>
                <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1.5">
                        <FaXmark /> {label} — se borrará al guardar
                    </span>
                    <button type="button" onClick={onCambiar}
                        className="text-[8px] font-black uppercase text-slate-500 hover:text-slate-700 transition">
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ConfigField name={name} value={data} onChange={onChange} error={errors}
            icon={icon} placeholder={placeholder} helpText={helpText} sensitive={sensitive} />
    );
}

export default function OdooConfigPanel({ odooConfig }) {
    const { props } = usePage();
    const flash  = props.flash  ?? {};
    const errors = props.errors ?? {};

    const modoInicial = (saved) => saved ? 'guardado' : 'editando';
    const [modo, setModo] = useState({
        url:      modoInicial(odooConfig.url_saved),
        db:       modoInicial(odooConfig.db_saved),
        username: modoInicial(odooConfig.username_saved),
        password: modoInicial(odooConfig.password_saved),
    });

    const { data, setData, post, processing, wasSuccessful } = useForm({
        url: '', db: '', username: '', password: '',
        borrar_url: false, borrar_db: false, borrar_username: false, borrar_password: false,
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
        post(route('Gtarifas.odooConfigSave'), { preserveScroll: true });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-[14px] font-black text-slate-800 uppercase flex items-center gap-2">
                        <FaGear className="text-slate-500" /> Ajustes de Conexión · Odoo
                    </h2>
                    <p className="text-[9px] text-slate-400 mt-0.5">Parámetros de acceso al servidor Odoo — variables de entorno (.env)</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
                    <FaShield className="text-amber-500 text-[10px]" />
                    <span className="text-[9px] font-black text-amber-600 uppercase">Solo personal autorizado</span>
                </div>
            </div>

            <div className="px-6 pt-5">
                {flash.message && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 mb-5">
                        <FaCircleCheck className="text-emerald-500 text-sm shrink-0" />
                        <p className="text-[9px] font-black uppercase text-emerald-700">{flash.message}</p>
                    </div>
                )}
                {errors.error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 mb-5">
                        <FaTriangleExclamation className="text-red-400 text-sm shrink-0" />
                        <p className="text-[9px] font-black uppercase text-red-600">{errors.error}</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="px-6 pb-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
                        <FaGlobe className="text-blue-400" /> Servidor
                    </p>
                    <div className="grid sm:grid-cols-2 gap-5">
                        <CampoConexion
                            label="URL del servidor" name="url" icon={FaGlobe}
                            placeholder="https://mi-empresa.odoo.com" helpText="Incluye el protocolo (https://)"
                            modo={modo.url} data={data.url} errors={errors?.url}
                            onChange={handleChange} onCambiar={() => activarCambio('url')} onBorrar={() => activarBorrar('url')}
                        />
                        <CampoConexion
                            label="Base de datos" name="db" icon={FaDatabase}
                            placeholder="nombre_de_la_base_de_datos" helpText="Sensible a mayúsculas"
                            modo={modo.db} data={data.db} errors={errors?.db}
                            onChange={handleChange} onCambiar={() => activarCambio('db')} onBorrar={() => activarBorrar('db')}
                        />
                    </div>
                </div>

                <div className="border-t border-slate-100 mx-6 mt-5" />

                <div className="px-6 pt-5 pb-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4 flex items-center gap-1.5">
                        <FaLock className="text-amber-400" /> Credenciales de acceso
                    </p>
                    <div className="grid sm:grid-cols-2 gap-5">
                        <CampoConexion
                            label="Usuario administrador" name="username" icon={FaUser}
                            placeholder="admin" helpText="Usuario con permisos de API en Odoo"
                            modo={modo.username} data={data.username} errors={errors?.username}
                            onChange={handleChange} onCambiar={() => activarCambio('username')} onBorrar={() => activarBorrar('username')}
                        />
                        <CampoConexion
                            label="Contraseña" name="password" icon={FaKey} sensitive
                            placeholder="••••••••••••" helpText="Contraseña del usuario administrador de Odoo"
                            modo={modo.password} data={data.password} errors={errors?.password}
                            onChange={handleChange} onCambiar={() => activarCambio('password')} onBorrar={() => activarBorrar('password')}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <button type="submit" disabled={processing}
                        className={`inline-flex items-center gap-2 text-white text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm transition-colors ${
                            wasSuccessful ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                        } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <FaFloppyDisk className="text-[10px]" />
                        {processing ? 'Guardando...' : wasSuccessful ? '¡Guardado!' : 'Guardar configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
}
