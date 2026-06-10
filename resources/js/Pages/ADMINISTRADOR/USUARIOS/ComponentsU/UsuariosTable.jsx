import React from 'react';

const getRolInfo = (roles, id_rol) => {
    const rol = roles.find(r => r.id === parseInt(id_rol));
    return {
        nombre: rol ? rol.nombre : 'Sin Rol',
        clase: 'bg-blue-50 text-blue-700 border border-blue-100',
    };
};

export default function UsuariosTable({ currentItems, roles, onEdit, onDelete }) {
    return (
        /* 
           mt-[30px]: Ajustado para dar espacio bajo la Toolbar fixed. 
           Si tu toolbar mide más, aumenta este valor.
        */
        <div className="flex-grow w-full mt-[30px]">
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse table-auto">
                    {/* ENCABEZADO ESTILO MÉDICOS (Sticky y Azul) */}
                    <thead className="sticky top-[-30px] z-30 shadow-sm">
                        <tr className="bg-blue-600 border-b border-slate-200">
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Id
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Username
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Rol Asignado
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase tracking-wider border-r border-slate-100">
                                Estado
                            </th>
                            <th className="px-6 py-4 text-white font-bold text-[10px] uppercase text-center">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                        {currentItems.length > 0 ? (
                            currentItems.map((u) => {
                                const rolInfo = getRolInfo(roles, u.id_rol);
                                return (
                                    <tr
                                        key={u.id}
                                        className="hover:bg-blue-50/30 transition-colors group"
                                    >
                                        <td className="px-6 py-2 border-r border-slate-50">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase leading-none">
                                                {u.id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2 border-r border-slate-50">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase leading-none">
                                                {u.username}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2 border-r border-slate-50">
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-tighter ${rolInfo.clase}`}>
                                                {rolInfo.nombre}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2 border-r border-slate-50">
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${u.estado === 'habilitado' ? 'text-emerald-600' : 'text-rose-600'
                                                }`}>
                                                {u.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-2 text-center flex gap-1 justify-center">
                                            <button
                                                onClick={() => onEdit(u)}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#3D3FD8] hover:text-white transition-all shadow-sm"
                                                title="Editar Usuario"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onDelete(u.id)}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                title="Eliminar Usuario"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                                    No se encontraron registros
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}