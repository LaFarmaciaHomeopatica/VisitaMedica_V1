import { useMemo, useState } from 'react';

// Unifica comprados+formulados según el modo, filtra por búsqueda y pagina
// el resultado. Reinicia a la página 1 cada vez que cambia el modo, la
// cantidad por página o la búsqueda (vía los handlers que expone).
export function useProductosPaginados({ modo, busqueda, productosComprados, productosFormulados }) {
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);

    const listaBase = useMemo(() => {
        if (modo === 'compradores') return productosComprados;
        if (modo === 'formuladores') return productosFormulados;
        const mapa = new Map();
        productosComprados.forEach((p) => {
            const key = p.codigo || p.nombre || p.producto;
            mapa.set(key, { ...p });
        });
        productosFormulados.forEach((p) => {
            const key = p.codigo || p.nombre || p.producto;
            if (mapa.has(key)) {
                const existing = mapa.get(key);
                mapa.set(key, {
                    ...existing,
                    cantidad_formulada: p.cantidad_formulada ?? p.cantidad ?? 0,
                    valor_formulado: p.valor_formulado ?? p.valor ?? 0,
                });
            } else {
                mapa.set(key, {
                    ...p,
                    cantidad_comprada: 0,
                    valor_comprado: 0,
                    cantidad_formulada: p.cantidad_formulada ?? p.cantidad ?? 0,
                    valor_formulado: p.valor_formulado ?? p.valor ?? 0,
                });
            }
        });
        // Por valor (comprado + formulado), igual que el ranking de
        // topProductos en el admin (Medico2Controller::usort) — antes
        // ordenaba por cantidad de unidades, lo que podía mostrar un
        // "top producto" distinto al que ve el admin para el mismo médico.
        return [...mapa.values()].sort(
            (a, b) =>
                ((b.valor_comprado ?? b.valor ?? 0) + (b.valor_formulado ?? 0)) -
                ((a.valor_comprado ?? a.valor ?? 0) + (a.valor_formulado ?? 0))
        );
    }, [modo, productosComprados, productosFormulados]);

    const listaFiltrada = useMemo(() => {
        if (!busqueda.trim()) return listaBase;
        const q = busqueda.toLowerCase();
        return listaBase.filter(
            (p) =>
                (p.nombre || p.producto || '').toLowerCase().includes(q) ||
                (p.codigo || '').toLowerCase().includes(q) ||
                (p.laboratorio || '').toLowerCase().includes(q)
        );
    }, [listaBase, busqueda]);

    const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / (porPagina || 1)));

    const handlePorPagina = (v) => { setPorPagina(v); setPagina(1); };
    const handlePagina    = (p) => setPagina(Math.max(1, Math.min(p, totalPaginas)));

    const listaVisible = useMemo(() => {
        const start = (pagina - 1) * (porPagina || listaFiltrada.length);
        return listaFiltrada.slice(start, start + (porPagina || listaFiltrada.length));
    }, [listaFiltrada, pagina, porPagina]);

    return {
        pagina,
        porPagina,
        setPagina,
        handlePorPagina,
        handlePagina,
        listaFiltrada,
        listaVisible,
    };
}
