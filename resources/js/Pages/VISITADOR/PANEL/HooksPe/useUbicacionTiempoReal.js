import { useEffect, useRef, useState } from 'react';

const leerCookie = (nombre) => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + nombre + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
};

/**
 * Envía la ubicación del visitador al servidor cada `intervaloMs`.
 * estado: 'iniciando' | 'activa' | 'denegada' | 'no_disponible' | 'error'
 */
export function useUbicacionTiempoReal({ activo = true, intervaloMs = 30000 } = {}) {
    const [estado, setEstado] = useState('iniciando');
    const ultimaPosicion = useRef(null);

    useEffect(() => {
        if (!activo) return;

        if (!('geolocation' in navigator)) {
            setEstado('no_disponible');
            return;
        }

        const enviar = async () => {
            const pos = ultimaPosicion.current;
            if (!pos) return;

            try {
                const res = await fetch('/visitador/ubicacion', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': leerCookie('XSRF-TOKEN'),
                    },
                    body: JSON.stringify({
                        latitud: pos.latitude,
                        longitud: pos.longitude,
                    }),
                });
                setEstado(res.ok ? 'activa' : 'error');
            } catch {
                setEstado('error');
            }
        };

        // El GPS solo guarda la última posición; el envío lo controla el temporizador.
        let primerEnvioHecho = false;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                ultimaPosicion.current = pos.coords;
                if (!primerEnvioHecho) {
                    primerEnvioHecho = true;
                    enviar(); // primera posición: se envía de inmediato
                }
            },
            (err) => setEstado(err.code === 1 ? 'denegada' : 'error'),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
        );

        // Reenvía la última posición cada intervalo (aunque el visitador esté quieto),
        // solo si la pantalla está visible.
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') enviar();
        }, intervaloMs);

        // Al volver a la app, envía enseguida sin esperar al temporizador.
        const alVolver = () => {
            if (document.visibilityState === 'visible') enviar();
        };
        document.addEventListener('visibilitychange', alVolver);

        return () => {
            navigator.geolocation.clearWatch(watchId);
            clearInterval(timer);
            document.removeEventListener('visibilitychange', alVolver);
        };
    }, [activo, intervaloMs]);

    return { estado };
}