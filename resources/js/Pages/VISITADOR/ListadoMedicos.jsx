import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import BarraNave from './barranave';
import {
    FaArrowLeft,
    FaMagnifyingGlass,
    FaLocationDot,
    FaChevronRight,
    FaChevronLeft,
    FaUserDoctor,
    FaCalendarDays,
    FaStethoscope
} from 'react-icons/fa6';

const ListadoMedicos = ({ medicosDb = {}, filters = {} }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');
    const [perPageInput, setPerPageInput] = useState(filters.per_page || '10');

    const medicos = medicosDb.data || [];

    const meta = medicosDb.meta ?? {
        total:        medicosDb.total        ?? 0,
        from:         medicosDb.from         ?? 0,
        to:           medicosDb.to           ?? 0,
        current_page: medicosDb.current_page ?? 1,
        last_page:    medicosDb.last_page    ?? 1,
    };

    const links = {
        prev: medicosDb.meta ? (medicosDb.links?.prev ?? null) : (medicosDb.prev_page_url ?? null),
        next: medicosDb.meta ? (medicosDb.links?.next ?? null) : (medicosDb.next_page_url ?? null),
    };

    const currentPage = meta.current_page ?? 1;
    const lastPage    = meta.last_page    ?? 1;

    const [pageInput, setPageInput] = useState(String(currentPage));

    const applyFilters = (newFilters) => {
        router.get('/ListadoMedicos', newFilters, {
            preserveState: true,
            replace: true,
            preserveScroll: false
        });
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        applyFilters({ search: value, per_page: perPage });
    };

    const commitPerPage = () => {
        const value = Math.max(1, parseInt(perPageInput) || 10);
        setPerPage(String(value));
        setPerPageInput(String(value));
        applyFilters({ search, per_page: value });
    };

    const handlePerPageKeyDown = (e) => {
        if (e.key === 'Enter') commitPerPage();
    };

    const commitPage = () => {
        const value = Math.min(Math.max(1, parseInt(pageInput) || 1), lastPage);
        setPageInput(String(value));
        applyFilters({ search, per_page: perPage, page: value });
    };

    const handlePageKeyDown = (e) => {
        if (e.key === 'Enter') commitPage();
    };

    const goToPage = (url) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: false });
    };

    return (
        <>
            <Head title="Directorio Médico - LFH" />

            {/* ── Header glassmorphism ── */}
            <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md shadow-sm rounded-b-[30px] md:rounded-b-[40px] border-b border-white/20">

                {/* Fila 1: back + título + búsqueda */}
                <div className="max-w-[1440px] mx-auto p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-6">

                        <Link
                            href="/panel"
                            className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-[#1C85E8] hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                        >
                            <FaArrowLeft className="text-xs" />
                        </Link>

                        <div className="hidden md:flex flex-col min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1C85E8]/70 leading-none mb-0.5">
                                LFH Portal
                            </p>
                            <h1 className="text-xs md:text-sm font-black text-[#1C85E8] uppercase tracking-wider whitespace-nowrap">
                                Directorio Médico
                            </h1>
                        </div>

                        <div className="relative flex-grow max-w-4xl">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                <FaMagnifyingGlass className="text-xs md:text-sm" />
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Buscar médico, especialidad..."
                                className="w-full bg-blue-50/50 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner placeholder:text-gray-300 font-medium text-gray-700"
                            />
                        </div>

                    </div>
                </div>

                {/* Fila 2: paginador — con gradiente del sistema */}
                <div className="bg-gradient-to-r from-[#1C85E8] via-[#02CFE3] to-[#24C765] rounded-b-[30px] md:rounded-b-[40px]">
                    <div className="max-w-[1440px] mx-auto px-5 py-2.5 flex items-center justify-between gap-3">

                        {/* Total */}
                        <p className="text-[11px] text-white/80 font-medium whitespace-nowrap">
                            <span className="text-white font-black">{meta.total ?? 0}</span>
                            <span className="ml-1 hidden sm:inline">médicos</span>
                        </p>

                        {/* Navegación */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { goToPage(links.prev); setPageInput(String(currentPage - 1)); }}
                                disabled={!links.prev}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/35 transition-colors active:scale-95"
                            >
                                <FaChevronLeft className="text-[9px]" />
                            </button>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-white/70 uppercase tracking-wider">Pág.</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={lastPage}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    onBlur={commitPage}
                                    onKeyDown={handlePageKeyDown}
                                    className="w-10 bg-white/25 border-none rounded-lg py-1 px-1.5 text-xs font-black text-white text-center focus:ring-2 focus:ring-white/50 outline-none placeholder:text-white/50"
                                />
                                <span className="text-[10px] font-black text-white/70 uppercase">/ {lastPage}</span>
                            </div>

                            <button
                                onClick={() => { goToPage(links.next); setPageInput(String(currentPage + 1)); }}
                                disabled={!links.next}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/35 transition-colors active:scale-95"
                            >
                                <FaChevronRight className="text-[9px]" />
                            </button>
                        </div>

                        {/* Por página */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-wider whitespace-nowrap hidden sm:inline">Ver</span>
                            <input
                                type="number"
                                min="1"
                                value={perPageInput}
                                onChange={(e) => setPerPageInput(e.target.value)}
                                onBlur={commitPerPage}
                                onKeyDown={handlePerPageKeyDown}
                                className="w-12 bg-white/25 border-none rounded-lg py-1 px-1.5 text-xs font-black text-white text-center focus:ring-2 focus:ring-white/50 outline-none"
                            />
                            <span className="text-[10px] font-black text-white/70 hidden sm:inline">/ pág.</span>
                        </div>

                    </div>
                </div>
            </header>

            {/* ── Contenido ── */}
            <div className="bg-[#E5F4FF] min-h-screen pb-28 font-sans text-gray-800 pt-36 md:pt-32">

                <main className="max-w-5xl mx-auto px-4 md:px-6">

                    <h3 className="text-xs font-black text-gray-400 px-1 uppercase tracking-widest mb-4">
                        Directorio de Médicos ({meta.total ?? 0})
                    </h3>

                    {medicos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {medicos.map((medico) => {
                                const nombreCompleto = `${medico.nombre || ''} ${medico.apellido || ''}`.trim();

                                return (
                                    <div
                                        key={medico.id}
                                        className="bg-white/80 backdrop-blur-md rounded-[24px] flex gap-0 items-stretch shadow-sm border border-white/40 hover:shadow-md transition-shadow duration-300 overflow-hidden"
                                    >
                                        {/* Acento lateral con gradiente — igual al hero del panel */}
                                        <div className="w-1.5 shrink-0 bg-gradient-to-b from-[#1C85E8] via-[#02CFE3] to-[#24C765] rounded-l-[24px]" />

                                        {/* Ícono especialidad */}
                                        <div className="flex items-center justify-center px-3.5 shrink-0">
                                            
                                        </div>

                                        {/* Info principal — clickeable a detalle */}
                                        <Link
                                            href={`/visitador/top-medicos/${medico.documento}?origen=listado`}
                                            className="flex-1 min-w-0 py-4 pr-2 active:scale-[0.98] transition-transform"
                                        >
                                             <h4 className="font-bold text-gray-800 text-sm leading-tight truncate">
                                                {nombreCompleto || 'Médico sin nombre'}
                                            </h4>
                                            <p className="text-xs text-[#1C85E8] font-bold uppercase tracking-tight mt-0.5">
                                                {medico.especialidad || 'General'}
                                            </p>
                                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                                                <FaLocationDot className="text-slate-300 shrink-0" />
                                                {medico.direccion_detalles || medico.direccion || 'Dirección no registrada'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className="bg-gradient-to-r from-[#1C85E8]/10 to-[#02CFE3]/10 text-[#1C85E8] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight border border-[#1C85E8]/10">
                                                    {medico.tipo_documento?.nombre || 'Doc'}: {medico.documento || '---'}
                                                </span>
                                                <span className="text-[11px] font-bold text-gray-400">
                                                    {medico.telefono_contacto || medico.telefono_contactos || '---'}
                                                </span>
                                            </div>
                                        </Link>

                                        {/* Acciones */}
                                        <div className="flex items-center gap-2 shrink-0 pr-4">
                                            <Link
                                                href={`/MisVisitas?medico_id=${medico.id}`}
                                                className="bg-gradient-to-r from-[#1C85E8] to-[#02CFE3] hover:from-[#156DBF] hover:to-[#02B2C4] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-blue-100 hover:scale-105 active:scale-95 flex items-center gap-1.5"
                                            >
                                                <FaCalendarDays className="text-[10px]" />
                                                <span className="hidden sm:inline">Agendar</span>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[30px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                            <FaUserDoctor className="text-4xl text-gray-200 mb-3 mx-auto block" />
                            No se encontraron médicos registrados.
                        </div>
                    )}
                </main>

                <BarraNave />
            </div>
        </>
    );
};

export default ListadoMedicos;