import { apiConfig, featureFlags } from '../config';

export interface FrontendErrorReport {
  type: string;
  message: string;
  stack?: string;
  url?: string;
  timestamp?: string;
}

export function reportFrontendError(
  type: string,
  message: string,
  stack?: string,
  url?: string,
): void {
  // Telemetry must never block or degrade the application. It is disabled in
  // local development (featureFlags.enableErrorReporting is false) and, when
  // enabled, is sent to the real backend API base URL rather than a relative
  // path that resolves to the Vite dev server (which previously produced a
  // permanent 404 on POST /api/observability/frontend-errors).
  if (!featureFlags.enableErrorReporting) return;

  // Avoid recursion loops if error reporting endpoint fails
  const currentUrl = window.location.href;
  if (currentUrl.includes('/api/observability/frontend-errors')) {
    return;
  }

  const payload: FrontendErrorReport = {
    type,
    message,
    stack: stack || 'N/A',
    url: url || currentUrl,
    timestamp: new Date().toISOString(),
  };

  try {
    const backendUrl = `${apiConfig.baseURL}/observability/frontend-errors`;
    fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Passive ignore to prevent console logs pollution or recursion loops
    });
  } catch {
    // Passive ignore
  }
}
