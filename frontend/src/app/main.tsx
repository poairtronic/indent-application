import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { reportFrontendError } from '../api/utils/errorTelemetry';

// Register global error telemetry handlers
window.addEventListener(
  'error',
  (event) => {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      const assetUrl = target.getAttribute('src') || target.getAttribute('href') || 'unknown asset';
      reportFrontendError('CHUNK_LOAD_FAILURE', `Failed to load static asset: ${assetUrl}`);
    } else {
      reportFrontendError(
        'UNCAUGHT_EXCEPTION',
        event.message || 'Unknown exception',
        event.error?.stack,
      );
    }
  },
  true,
);

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection');
  const stack = reason instanceof Error ? reason.stack : undefined;
  reportFrontendError('UNHANDLED_REJECTION', message, stack);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
