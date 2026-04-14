import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';

const Login_1 = () => {
    const [data, setData] = useState({
        usuario: '',
        password: ''
    });

    return (
        <div className="min-h-screen bg-[#F4F7FF] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            <Head title="Login - LFH" />

            {/* Elementos decorativos de fondo (Estética actualizada) */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#5D8BF4] rounded-full blur-3xl opacity-20"></div>

            <div className="w-full max-w-md z-10">
                {/* Logo o Icono Principal */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-[28px] shadow-xl shadow-blue-100 flex items-center justify-center mb-6 border border-blue-50">
                        <i className="fa-solid fa-house-medical text-[#5D8BF4] text-4xl"></i>
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight text-center">
                        LA FARMACIA <span className="text-[#5D8BF4]">HOMEOPÁTICA</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-sm mt-2">
                        Bienvenido a Visitas Médicas
                    </p>
                </div>

                {/* Card de Login */}
                <div className="bg-white/80 backdrop-blur-lg p-8 rounded-[40px] shadow-sm border border-white space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-4 mb-2 block">Usuario</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-5 flex items-center text-blue-400">
                                <i className="fa-solid fa-user text-sm"></i>
                            </span>
                            <input
                                type="text"
                                placeholder="Ej: admin_lfh"
                                className="w-full bg-white border-none rounded-full py-4 pl-12 pr-6 text-sm shadow-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all text-gray-700"
                                onChange={(e) => setData({ ...data, usuario: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-4 mb-2 block">Contraseña</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-5 flex items-center text-blue-400">
                                <i className="fa-solid fa-lock text-sm"></i>
                            </span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-white border-none rounded-full py-4 pl-12 pr-6 text-sm shadow-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all text-gray-700"
                                onChange={(e) => setData({ ...data, password: e.target.value })}
                            />
                        </div>
                    </div>



                    {/* Botón de Acceso Directo */}
                    <Link
                        href="/panel"
                        as="button"
                        className="w-full bg-[#5D8BF4] text-white py-4 rounded-full font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        INICIAR SESIÓN
                        <i className="fa-solid fa-arrow-right-to-bracket text-xs opacity-70"></i>
                    </Link>
                </div>

                {/* Footer de la vista */}
                <p className="text-center mt-10 text-[10px] text-gray-400 font-bold uppercase tracking-[2px]">
                </p>
            </div>
        </div>
    );
};

export default Login_1;