import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import BarraNave from './barranave';

const ProductoCatalogo = () => {
    // RF - Buscador de Acción Rápida (Estado)
    const [search, setSearch] = useState("");

    // Datos simulados (RF - Ficha de Identificación Básica)
    const productos = [
        { id: 'PROD-001', nombre: "Arnica Montana 30CH", lab: "Boiron", cat: "Homeopatía" },
        { id: 'PROD-002', nombre: "Traumeel S", lab: "Heel", cat: "Antiinflamatorio" },
        { id: 'PROD-003', nombre: "Oscillococcinum", lab: "Boiron", cat: "Antigripal" },
        { id: 'PROD-004', nombre: "Luffeel", lab: "Heel", cat: "Alergias" },
        { id: 'PROD-005', nombre: "Nervoheel", lab: "Heel", cat: "Relajante" },
        { id: 'PROD-006', nombre: "Lymphomyosot", lab: "Heel", cat: "Drenaje" },
    ];

    const categorias = [
        { icon: 'fa-leaf', label: 'Esencias' },
        { icon: 'fa-droplet', label: 'Gotas' },
        { icon: 'fa-capsules', label: 'Glóbulos' },
        { icon: 'fa-Stethoscope', label: 'Cuidado' },
    ];

    // Lógica del Buscador (Filtra por Nombre, Lab o ID)
    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.lab.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-[#F4F7FF] min-h-screen pb-24 font-sans">
            <Head title="Catálogo de Productos - LFH" />

            {/* Header y Buscador (Estilo Imagen 2) */}
            <header className="bg-white p-6 rounded-b-[40px] shadow-sm sticky top-0 z-20">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/panel" className="text-blue-500 text-xl">
                        <i className="fa-solid fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-lg font-bold text-gray-800">Farmacia / Productos</h1>
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <i className="fa-solid fa-cart-shopping text-sm"></i>
                    </div>
                </div>

                {/* RF - Buscador de Acción Rápida */}
                <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-blue-400">
                        <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, laboratorio o ID..."
                        className="w-full bg-blue-50 border-none rounded-full py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <main className="p-6">
                {/* Categorías Rápidas */}
                <section className="mb-8">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Categorías</h2>
                        <span className="text-xs text-blue-500 font-bold">Ver Todo</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {categorias.map((cat, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-blue-50 flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white transition-all cursor-pointer">
                                    <i className={`fa-solid ${cat.icon} text-xl`}></i>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">{cat.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* RF - Vista General de Catálogo */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-700 mb-4 px-2">Resultados ({productosFiltrados.length})</h2>

                    <div className="grid grid-cols-1 gap-4">
                        {productosFiltrados.map((prod) => (
                            <div key={prod.id} className="bg-white p-4 rounded-[30px] shadow-sm border border-gray-50 flex items-center gap-4 active:scale-95 transition-transform group">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                                    <i className="fa-solid fa-pills text-2xl"></i>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{prod.nombre}</h3>
                                        <span className="text-[9px] font-black text-blue-400 bg-blue-50 px-2 py-1 rounded-lg tracking-tighter">
                                            {prod.id}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium">Laboratorio: {prod.lab}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">Disponible</span>
                                        <span className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-bold">{prod.cat}</span>
                                    </div>
                                </div>

                                <button className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all">
                                    <i className="fa-solid fa-chevron-right text-xs"></i>
                                </button>
                            </div>
                        ))}
                    </div>

                    {productosFiltrados.length === 0 && (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-box-open text-gray-200 text-5xl mb-4"></i>
                            <p className="text-gray-400 text-sm italic font-medium">No encontramos productos que coincidan.</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Banner Promocional (Estilo Imagen 2) */}
            <div className="px-6 mb-8">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-6 rounded-[35px] text-white relative overflow-hidden shadow-lg shadow-blue-200">
                    <div className="relative z-10">
                        <h4 className="font-black text-xl">20% OFF</h4>
                        <p className="text-xs opacity-90 font-medium uppercase tracking-widest">En toda la línea Heel</p>
                        <button className="mt-4 bg-white text-blue-600 text-[10px] font-black px-4 py-2 rounded-full uppercase">
                            Ver Promoción
                        </button>
                    </div>
                    <i className="fa-solid fa-tags absolute -right-4 -bottom-4 text-7xl opacity-20 rotate-12"></i>
                </div>
            </div>
            {/* Barra de Navegación Inferior */}
            <BarraNave />
        </div>

    );
};

export default ProductoCatalogo;