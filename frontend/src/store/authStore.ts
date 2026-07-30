import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: {
    id: string;
    departmentCode: string;
    departmentName: string;
  };
  role: {
    id: string;
    roleName: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedUser = localStorage.getItem('auth_user');
  const savedToken = localStorage.getItem('auth_access_token');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedToken || null,
    isAuthenticated: !!savedToken,
    isLoading: false,
    login: (accessToken, refreshToken, user) => {
      localStorage.setItem('auth_access_token', accessToken);
      localStorage.setItem('auth_refresh_token', refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ accessToken, user, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
      set({ accessToken: null, user: null, isAuthenticated: false });
    },
    setAccessToken: (accessToken) => {
      localStorage.setItem('auth_access_token', accessToken);
      set({ accessToken, isAuthenticated: true });
    },
    setLoading: (isLoading) => set({ isLoading }),
  };
});
