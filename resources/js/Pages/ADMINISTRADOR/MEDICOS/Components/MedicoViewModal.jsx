import React from 'react';

const MedicoViewModal = ({ isOpen, onClose, medico }) => {
    if (!isOpen || !medico) return null;

    // Función auxiliar para etiquetas de datos
    const InfoField = ({ label, value, icon }) => (
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-700">{value || '---'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay con desenfoque elegante */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-2xl rounded-[35px] shadow-2xl overflow-hidden">
                {/* Cabecera Estilo MAC */}
                <div className="bg-[#3D3FD8] p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-tighter">Ficha Médica Digital</span>
                            <h3 className="text-2xl font-black uppercase mt-2 leading-none">
                                {medico.nombre} {medico.apellido}
                            </h3>
                        </div>
                        <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Identificación */}
                        <InfoField label="Documento" value={`${medico.tipo_documento.nombre || ''} - ${medico.documento}`} />
                        <InfoField label="Especialidad" value={medico.especialidad} />

                        {/* Contacto y Categoría */}
                        <InfoField label="Teléfono de Contacto" value={medico.telefono_contacto} />
                        <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Categoría ID</p>
                            <p className="text-sm font-bold text-blue-700">{medico.categoria.nombre || 'Sin categoría'}</p>
                        </div>

                        {/* Ubicación y Horarios */}
                        <div className="col-span-1 md:col-span-2">
                            <InfoField label="Dirección Detalles" value={medico.direccion_detalles} />
                        </div>

                        <InfoField label="Horario de Atención" value={medico.horario_atencion} />
                        <InfoField label="Geolocalización" value={medico.geolocalizacion} />

                        {/* Datos de Gestión */}
                        <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">ID Visitador Asignado</p>
                                <p className="text-sm font-bold text-slate-600">{medico.visitador?.nombre + ' ' + medico.visitador?.apellido}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Inicio de Relación</p>
                                <p className="text-sm font-bold text-slate-600">{medico.fecha_inicio_relacion}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón de cierre inferior */}
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-lg"
                    >
                        Cerrar Vista Previa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicoViewModal;