import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// 🔥 DESACTIVAR SERVICE WORKER (CLAVE PARA TU ERROR)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
    });
}

// --- INTERCEPTOR DE SEGURIDAD ---
router.on('success', (event) => {
    const user = event.detail.page.props.auth?.user;
    const currentPath = window.location.pathname.toLowerCase();

    if (user) {
        if (user.id_rol === 1 && currentPath.includes('/panel')) {
            window.location.href = '/PanelAdmin';
        }

        if (user.id_rol === 2 && currentPath.includes('/admin')) {
            window.location.href = '/panel';
        }
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#3D3FD8',
    },
});