import { useState, useEffect } from 'react';
import type { User } from '../types/user';
import { authService } from '../services/auth.service';

// Simple pub-sub store logic for React state sharing without external deps
let currentUser: User | null = null;
let isAuthenticated = false;
const listeners = new Set<(user: User | null) => void>();

const emit = () => {
  listeners.forEach((listener) => listener(currentUser));
};

export const authStore = {
  get currentUser() {
    return currentUser;
  },
  get isAuthenticated() {
    return isAuthenticated;
  },
  setUser(user: User | null) {
    currentUser = user;
    isAuthenticated = !!user;
    emit();
  },
  subscribe(listener: (user: User | null) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useAuth = () => {
  const [user, setUserState] = useState<User | null>(currentUser);

  useEffect(() => {
    return authStore.subscribe((newUser) => {
      setUserState(newUser);
    });
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    login: async (credentials: any) => {
      const data = await authService.login(credentials);
      authStore.setUser(data.user);
      return data;
    },
    logout: async () => {
      await authService.logout();
      authStore.setUser(null);
    },
  };
};
