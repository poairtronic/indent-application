import React, { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useThemeStore } from '../store/theme.store';
import { GlobalErrorBoundary } from '../components/common/GlobalErrorBoundary';

import { useTabSync } from '../hooks/useTabSync';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { OfflineBanner } from '../components/common/OfflineBanner';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { resolvedTheme } = useThemeStore();

  useTabSync();
  useSessionTimeout();

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OfflineBanner />
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};
