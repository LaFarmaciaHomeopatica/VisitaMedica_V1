import React from 'react';
import ProductCard from './ProductCard';

// ─── Label de sección + grid de productos + estado vacío ─────────────────────
const ListaProductos = ({ cfg, modo, listaVisible, totalFiltrados, busqueda, pagina, porPagina }) => (
    <>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
            {cfg.icon}
            {cfg.label} — {totalFiltrados} producto{totalFiltrados !== 1 ? 's' : ''}
            {busqueda && <span className="normal-case font-bold text-gray-300">· "{busqueda}"</span>}
        </p>

        {listaVisible.length === 0 ? (
            <div className="text-center py-16 bg-white/50 rounded-[28px] border border-dashed border-gray-200 text-gray-400 text-sm italic">
                {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin productos registrados en este modo.'}
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {listaVisible.map((item, idx) => {
                    const rankGlobal = (pagina - 1) * porPagina + idx;
                    return (
                        <ProductCard
                            key={item.codigo || item.nombre || idx}
                            item={item}
                            index={rankGlobal}
                            modo={modo}
                        />
                    );
                })}
            </div>
        )}
    </>
);

export default ListaProductos;
