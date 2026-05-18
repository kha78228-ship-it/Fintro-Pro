import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CurrencyProvider } from './lib/CurrencyContext';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

// @ts-ignore
const gaMeasurementId = import.meta.env.VITE_GA_TRACKING_ID;
if (gaMeasurementId) {
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // @ts-ignore
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    // @ts-ignore
    window.dataLayer.push(arguments);
  }
  // @ts-ignore
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaMeasurementId);
}

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  // @ts-ignore
  window.deferredPrompt = e;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </StrictMode>,
);
