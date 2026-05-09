// Centraliza los helpers compartidos entre Table, ViewModal, etc.

export const getEstadoEstilo = (estado) => {
    const estilos = {
        'sin programar': 'bg-slate-100 text-slate-600',
        'programada': 'bg-blue-100 text-blue-700',
        'efectiva': 'bg-emerald-100 text-emerald-700',
        'No contactado': 'bg-amber-100 text-amber-700',
        'reprogramada': 'bg-purple-100 text-purple-700',
        'cancelada': 'bg-rose-100 text-rose-700',
    };
    return estilos[estado] || 'bg-gray-100 text-gray-600';
};

export const getNameById = (list, id) =>
    list.find(item => item.id == id)?.nombre || 'NO ASIGNADO';