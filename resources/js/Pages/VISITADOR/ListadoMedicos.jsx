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
    FaCalendarDays
} from 'react-icons/fa6';

const ListadoMedicos = ({ medicosDb = {}, filters = {} }) => {
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || '10');
    const [perPageInput, setPerPageInput] = useState(filters.per_page || '10');

    const medicos = medicosDb.data || [];

    // Soporta ambas estructuras que puede enviar Inertia+Laravel
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

    const getAvatarConfig = (id) => {
        const configs = [
            { bg: "bg-blue-100", text: "text-blue-600" },
            { bg: "bg-indigo-100", text: "text-indigo-600" },
            { bg: "bg-purple-100", text: "text-purple-600" },
            { bg: "bg-cyan-100", text: "text-cyan-600" },
        ];
        return configs[id % configs.length];
    };

    return (
        <div className="bg-[#F4F7FF] min-h-screen font-sans text-gray-800 pb-28">
            <Head title="Directorio Médico - LFH" />

            {/* Bloque sticky: header + barra de paginación */}
            <div className="sticky top-0 z-20">

                {/* Header */}
                <header className="bg-white">
                    <div className="max-w-[1440px] mx-auto p-3 md:p-4">
                        <div className="flex items-center gap-3 md:gap-6">
                            <Link
                                href="/panel"
                                className="w-9 h-9 flex items-center justify-center bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors shrink-0 shadow-sm active:scale-90"
                            >
                                <FaArrowLeft className="text-xs" />
                            </Link>

                            <div className="hidden md:flex flex-col min-w-0 flex-grow md:flex-grow-0">
                                <h1 className="text-xs md:text-sm font-black text-[#5D8BF4] uppercase tracking-wider whitespace-nowrap">
                                    Listado de Médicos
                                </h1>
                            </div>

                            <div className="relative flex-grow max-w-4xl">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-400">
                                    <FaMagnifyingGlass className="text-[10px] md:text-xs" />
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={handleSearch}
                                    placeholder="Buscar médico, especialidad..."
                                    className="w-full bg-blue-50 border-none rounded-full py-2.5 md:py-3 pl-10 md:pl-12 pr-4 text-xs md:text-sm focus:ring-2 focus:ring-blue-300 outline-none transition-all shadow-inner font-medium text-gray-700 placeholder:text-gray-300"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Barra de paginación */}
                <div className="bg-white border-t border-gray-100 shadow-md rounded-b-[20px]">
                    <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center justify-between gap-3">

                        {/* Contador total */}
                        <p className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                            <span className="text-blue-500 font-bold">{meta.total ?? 0}</span> médicos
                        </p>

                        {/* Navegación: < PÁG. [n] DE n > */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { goToPage(links.prev); setPageInput(String(currentPage - 1)); }}
                                disabled={!links.prev}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
                            >
                                <FaChevronLeft className="text-[9px]" />
                            </button>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Pág.</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={lastPage}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    onBlur={commitPage}
                                    onKeyDown={handlePageKeyDown}
                                    className="w-10 bg-blue-50 border-none rounded-lg py-1 px-1.5 text-xs font-bold text-blue-600 text-center focus:ring-2 focus:ring-blue-300 outline-none"
                                />
                                <span className="text-[10px] font-bold text-gray-400">DE {lastPage}</span>
                            </div>

                            <button
                                onClick={() => { goToPage(links.next); setPageInput(String(currentPage + 1)); }}
                                disabled={!links.next}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
                            >
                                <FaChevronRight className="text-[9px]" />
                            </button>
                        </div>

                        {/* Registros por página: VER [n] */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Ver</span>
                            <input
                                type="number"
                                min="1"
                                value={perPageInput}
                                onChange={(e) => setPerPageInput(e.target.value)}
                                onBlur={commitPerPage}
                                onKeyDown={handlePerPageKeyDown}
                                className="w-12 bg-blue-50 border-none rounded-lg py-1 px-1.5 text-xs font-bold text-blue-600 text-center focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                        </div>

                    </div>
                </div>

            </div>

            {/* Listado */}
            <main className="max-w-5xl mx-auto p-4 md:p-6 mt-2">
                {medicos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {medicos.map((medico) => {
                            const config = getAvatarConfig(medico.id);
                            const nombreCompleto = `${medico.nombre || ''} ${medico.apellido || ''}`.trim();
                            const inicial = nombreCompleto ? nombreCompleto.charAt(0).toUpperCase() : '?';

                            return (
                                // ✅ Card entera va a detalle del médico, calendario va a MisVisitas
                                <div
                                    key={medico.id}
                                    className="bg-white p-4 rounded-[24px] border border-gray-50 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow"
                                >
                                    {/* Info — clickeable a detalle */}
                                    <Link
                                        href={`/MedicoDetalle/${medico.id}`}
                                        className="flex-1 min-w-0 active:scale-[0.98] transition-transform"
                                    >
                                        <p className="text-[13px] font-bold text-gray-800 truncate">
                                            {nombreCompleto || 'Médico sin nombre'}
                                        </p>
                                        <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-tight">
                                            {medico.especialidad || 'General'}
                                        </p>
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                            <FaLocationDot className="text-blue-300 shrink-0" />
                                            {medico.direccion_detalles || 'Sin dirección registrada'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                {medico.tipo_documento?.nombre || 'Doc'}: {medico.documento || '---'}
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-500">
                                                {medico.telefono_contacto || medico.telefono_contactos || '---'}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* ✅ Calendario → MisVisitas */}
                                    <Link
                                        href="/MisVisitas"
                                        className="w-9 h-9 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors active:scale-95 shrink-0"
                                    >
                                        <FaCalendarDays className="text-blue-500 text-base" />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                        <FaUserDoctor className="text-4xl text-gray-200 mb-3 mx-auto block" />
                        <p className="text-gray-400 text-sm">No se encontraron médicos registrados.</p>
                    </div>
                )}
            </main>

            <BarraNave />
        </div>
    );
};

export default ListadoMedicos;