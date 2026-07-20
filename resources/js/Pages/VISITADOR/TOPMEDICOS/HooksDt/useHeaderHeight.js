import { useEffect, useRef, useState } from 'react';

// Observa el header flotante y devuelve su alto real, para usarlo como
// padding-top del contenido y que nada quede tapado detrás.
export function useHeaderHeight() {
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(160);

    useEffect(() => {
        if (!headerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            for (let e of entries) {
                setHeaderHeight(e.contentBoxSize[0].blockSize + 16);
            }
        });
        ro.observe(headerRef.current);
        return () => ro.disconnect();
    }, []);

    return { headerRef, headerHeight };
}
