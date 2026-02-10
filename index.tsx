
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './onboarding.css';

// Fix for malformed URL from Telegram where query params are in the pathname
(() => {
  const { pathname, search } = window.location;
  if (pathname.startsWith('/tgWebAppData=')) {
    const fixedUrl = '/?' + pathname.substring(1) + search + window.location.hash;
    window.history.replaceState({}, '', fixedUrl);
  }
})();

// Глобальные ловушки ошибок для отладки на Android
window.addEventListener('error', (e) => {
  console.error('[GLOBAL ERROR]', e.message, e.error);
  try { (window as any).Telegram?.WebApp?.showAlert?.('Критическая ошибка: ' + e.message); } catch {}
});

window.addEventListener('unhandledrejection', (e: any) => {
  console.error('[UNHANDLED REJECTION]', e.reason);
  try { (window as any).Telegram?.WebApp?.showAlert?.('Сбой промиса: ' + (e?.reason?.message || e?.reason)); } catch {}
});


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
