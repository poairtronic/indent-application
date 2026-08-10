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
    const backendUrl = '/api/observability/frontend-errors';
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
