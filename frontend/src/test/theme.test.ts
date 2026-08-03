import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../store/theme.store';

describe('Theme Store', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system', resolvedTheme: 'light' });
    localStorage.clear();
  });

  it('should initialize with system theme', () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe('system');
  });

  it('should allow setting an explicit theme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });

  it('should toggle theme correctly', () => {
    useThemeStore.getState().setTheme('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });
});
