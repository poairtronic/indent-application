import { useState, useEffect } from 'react';

let currentTheme: 'light' | 'dark' = 'light';
const listeners = new Set<(theme: 'light' | 'dark') => void>();

const emit = () => {
  listeners.forEach((listener) => listener(currentTheme));
};

export const themeStore = {
  get theme() {
    return currentTheme;
  },
  setTheme(theme: 'light' | 'dark') {
    currentTheme = theme;
    emit();
  },
  toggle() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    emit();
  },
  subscribe(listener: (theme: 'light' | 'dark') => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(currentTheme);

  useEffect(() => {
    return themeStore.subscribe((newTheme) => {
      setThemeState(newTheme);
    });
  }, []);

  return {
    theme,
    toggleTheme: () => themeStore.toggle(),
  };
};
