import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import '../shared/styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App/></React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Evitar interrumpir a alguien que esta usando el editor de planos.
  let interacted = false;
  window.addEventListener('pointerdown', () => { interacted = true; }, {passive: true});
  window.addEventListener('keydown', () => { interacted = true; });
  const alreadyControlled = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // La primera instalacion no necesita recargar: ya tiene el build nuevo.
    if (!alreadyControlled) return;
    if (!interacted) {
      window.location.reload();
      return;
    }
    if (document.getElementById('fcm-update-banner')) return;

    const banner = document.createElement('aside');
    banner.id = 'fcm-update-banner';
    banner.setAttribute('role', 'status');
    Object.assign(banner.style, {
      position: 'fixed', bottom: '16px', left: '16px', right: '16px',
      maxWidth: '580px', margin: '0 auto', padding: '14px',
      borderRadius: '10px', background: '#173966', color: '#fff',
      boxShadow: '0 4px 24px #0005', zIndex: '2147483647',
      fontFamily: 'system-ui, sans-serif', fontSize: '14px',
      display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap'
    });
    const message = document.createElement('span');
    message.textContent = 'Nueva versión disponible. Si estás editando, exportá primero tu JSON.';
    message.style.flex = '1 1 240px';

    const update = document.createElement('button');
    update.type = 'button';
    update.textContent = 'Actualizar ahora';
    update.style.cssText = 'cursor:pointer;padding:8px 12px;border:0;border-radius:6px;background:#fff;color:#173966;font-weight:600';
    update.addEventListener('click', () => window.location.reload());

    const later = document.createElement('button');
    later.type = 'button';
    later.textContent = 'Más tarde';
    later.style.cssText = 'cursor:pointer;padding:8px;background:transparent;color:#fff;border:1px solid #ffffff88;border-radius:6px';
    later.addEventListener('click', () => banner.remove());

    banner.append(message, update, later);
    document.body.append(banner);
  });

  // Solicitar la version mas reciente del script SW en cada visita.
  navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'})
    .then((registration) => registration.update())
    .catch(() => {});
}
