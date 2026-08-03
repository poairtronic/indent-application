import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const applyTheme = (resolvedTheme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),
      setTheme: (theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ theme, resolvedTheme });
        applyTheme(resolvedTheme);
      },
      toggleTheme: () => {
        const { theme, resolvedTheme } = get();
        let nextTheme: ThemeMode;
        if (theme === 'system') {
          nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        } else {
          nextTheme = theme === 'dark' ? 'light' : 'dark';
        }
        const nextResolved = nextTheme;
        set({ theme: nextTheme, resolvedTheme: nextResolved });
        applyTheme(nextResolved);
      },
    }),
    {
      name: 'theme_settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.theme === 'system' ? getSystemTheme() : state.theme;
          state.resolvedTheme = resolved;
          applyTheme(resolved);
        }
      },
    },
  ),
);

// Listener for system media theme updates
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const theme = useThemeStore.getState().theme;
    if (theme === 'system') {
      const resolvedTheme = e.matches ? 'dark' : 'light';
      useThemeStore.setState({ resolvedTheme });
      applyTheme(resolvedTheme);
    }
  });
}
