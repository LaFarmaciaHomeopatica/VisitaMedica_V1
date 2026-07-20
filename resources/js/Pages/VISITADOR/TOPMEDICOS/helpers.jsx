import {
    FaScaleBalanced,
    FaCartShopping,
    FaFlask,
} from 'react-icons/fa6';

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(n || 0);

// Redondea antes de formatear (igual que fmt() en el detalle de médico del
// admin) para que unidades no enteras se muestren igual en las dos vistas,
// en vez de depender de los decimales por defecto de Intl.NumberFormat.
export const formatNum = (n) => new Intl.NumberFormat('es-CO').format(Math.round(n || 0));

// ─── Configuración visual por modo ───────────────────────────────────────────
export const MODOS = {
    general: {
        label: 'General',
        icon: <FaScaleBalanced size={10} />,
        gradiente: 'from-[#1C85E8] to-[#0A69C2]',
        badge: 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white',
        acento: 'w-1.5 bg-gradient-to-b from-[#1C85E8] via-[#02CFE3] to-[#24C765]',
        activeBtn: 'bg-white text-gray-800 shadow-sm',
    },
    compradores: {
        label: 'Compradores',
        icon: <FaCartShopping size={10} />,
        gradiente: 'from-[#24C765] to-[#15B04F]',
        badge: 'bg-emerald-500 text-white',
        acento: 'w-1.5 bg-[#24C765]',
        activeBtn: 'bg-white text-gray-800 shadow-sm',
    },
    formuladores: {
        label: 'Formuladores',
        icon: <FaFlask size={10} />,
        gradiente: 'from-[#1C85E8] to-[#0A69C2]',
        badge: 'bg-blue-600 text-white',
        acento: 'w-1.5 bg-[#1C85E8]',
        activeBtn: 'bg-white text-gray-800 shadow-sm',
    },
};
