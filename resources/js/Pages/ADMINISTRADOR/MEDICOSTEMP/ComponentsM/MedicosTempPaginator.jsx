import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';

export default function MedicosTempPaginator({
    currentPage, onPageChange, totalPages,
    itemsPerPage, onItemsPerPageChange,
}) {

    // Función simplificada: Solo limpia caracteres no numéricos
    // La validación de rangos se hace en el Hook para evitar bloqueos
    const handleRawChange = (value, callback) => {
        // Elimina cualquier cosa que no sea un número (letras, signos, espacios)
        const cleanValue = value.replace(/\D/g, '');
        // Enviamos el string limpio al hook directamente
        callback(cleanValue);
    };

    return (
        <div className="bg-white px-8 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-8">
                {/* Checkbox seleccionar todo */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Todo</span>
                </div>

                {/* Items por página */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mostrar</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        // Mostramos vacío si el estado es 0 para permitir borrar
                        value={itemsPerPage === 0 ? '' : itemsPerPage}
                        onChange={e => handleRawChange(e.target.value, onItemsPerPageChange)}
                        className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Navegación */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    // Importante: si es 0 (borrado), lo tratamos como página 1 para el botón
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                >
                    <FaChevronLeft className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Página</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        // Mostramos vacío si es 0 para que el usuario pueda escribir desde cero
                        value={currentPage === 0 ? '' : currentPage}
                        onChange={(e) => {
                            // 1. Limpiamos: solo permitimos dígitos
                            const val = e.target.value.replace(/\D/g, '');

                            // 2. Enviamos al hook. Si es vacío, enviamos cadena vacía 
                            // (tu hook ya está preparado para convertir "" en 0)
                            onPageChange(val);
                        }}
                        // Al quitar el foco, si quedó vacío, podrías resetear a 1 (opcional)
                        onBlur={() => {
                            if (currentPage === 0) onPageChange(1);
                        }}
                        className="w-10 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-indigo-600 text-center p-1 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                    />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        DE {Math.max(1, totalPages)}
                    </span>
                </div>

                <button
                    type="button"
                    disabled={currentPage >= totalPages || totalPages === 0}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                >
                    <FaChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}