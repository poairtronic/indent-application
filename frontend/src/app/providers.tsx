import React, { useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useThemeStore } from '../store/theme.store';
import { useSettingsStore } from '../store/settingsStore';
import { GlobalErrorBoundary } from '../components/common/GlobalErrorBoundary';

import { useTabSync } from '../hooks/useTabSync';
import { createQueryClient } from '../api/hooks/query-client';
import { useAuthStore } from '../store/authStore';

const queryClient = createQueryClient();

import { OfflineBanner } from '../components/common/OfflineBanner';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const dataDensity = useSettingsStore((state) => state.dataDensity);

  useTabSync();
  // Initialize Auth
  useEffect(() => {
    const { initializeAuth } = useAuthStore.getState();
    initializeAuth();
  }, []);

  // Apply resolved theme to <html>
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

  // Apply data density to <html> so CSS rules can target it globally
  useEffect(() => {
    document.documentElement.setAttribute('data-density', dataDensity);
  }, [dataDensity]);

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
