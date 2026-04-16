import React from 'react';
import { Head, useForm } from '@inertiajs/react';
// Importamos los iconos necesarios
import {
    FaHouseMedical,
    FaUser,
    FaLock,
    FaRightToBracket
} from 'react-icons/fa6';

const Login_1 = () => {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Asegúrate de que 'route' esté disponible globalmente (Ziggy)
        post(route('login.attempt'));
    };

    return (
        <div className="min-h-screen bg-[#F4F7FF] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            <Head title="Login - LFH" />

            {/* Decoración */}
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#5D8BF4] rounded-full blur-3xl opacity-20"></div>

            <div className="w-full max-w-md z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-[28px] shadow-xl shadow-blue-100 flex items-center justify-center mb-6 border border-blue-50">
                        {/* Icono Principal actualizado */}
                        <FaHouseMedical className="text-[#5D8BF4] text-4xl" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight text-center uppercase">
                        La Farmacia <span className="text-[#5D8BF4]">Homeopática</span>
                    </h1>
                    <p className="text-gray-400 font-medium text-sm mt-2">Visitas Médicas</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-lg p-8 rounded-[40px] shadow-sm border border-white space-y-6">
                    {/* Campo Usuario */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-4 mb-2 block">Usuario</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-5 flex items-center text-blue-400">
                                {/* Icono Usuario actualizado */}
                                <FaUser className="text-sm" />
                            </span>
                            <input
                                type="text"
                                value={data.username}
                                placeholder="Ej: admin_lfh"
                                className={`w-full bg-white border-none rounded-full py-4 pl-12 pr-6 text-sm shadow-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all ${errors.username ? 'ring-2 ring-red-400' : ''}`}
                                onChange={(e) => setData('username', e.target.value)}
                            />
                        </div>
                        {errors.username && <p className="text-red-500 text-[10px] mt-2 ml-4 font-bold uppercase">{errors.username}</p>}
                    </div>

                    {/* Campo Password */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase ml-4 mb-2 block">Contraseña</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-5 flex items-center text-blue-400">
                                {/* Icono Password actualizado */}
                                <FaLock className="text-sm" />
                            </span>
                            <input
                                type="password"
                                value={data.password}
                                placeholder="••••••••"
                                className={`w-full bg-white border-none rounded-full py-4 pl-12 pr-6 text-sm shadow-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all ${errors.password ? 'ring-2 ring-red-400' : ''}`}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>
                        {errors.password && <p className="text-red-500 text-[10px] mt-2 ml-4 font-bold uppercase">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-[#5D8BF4] text-white py-4 rounded-full font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {processing ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
                        {/* Icono Botón actualizado */}
                        {!processing && <FaRightToBracket className="text-xs opacity-70" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login_1;