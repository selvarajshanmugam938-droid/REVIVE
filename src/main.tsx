import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign ResizeObserver loop limit/undelivered notifications from bubbling to uncaught error boundary
if (typeof window !== 'undefined') {
  const isResizeObserverError = (msg?: string) => {
    return (
      typeof msg === 'string' &&
      (msg.includes('ResizeObserver loop completed with undelivered notifications') ||
        msg.includes('ResizeObserver loop limit exceeded') ||
        msg.includes('ResizeObserver'))
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      if (isResizeObserverError(event.message)) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isResizeObserverError(event.reason?.message || event.reason)) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
