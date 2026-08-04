export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  INDENTS: {
    BASE: '/business-transactions',
    DETAIL: (id: string) => `/business-transactions/${id}`,
    STATUS: (id: string) => `/business-transactions/${id}/status`,
  },
  USERS: {
    BASE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    STATUS: (id: string) => `/users/${id}/status`,
    RESTORE: (id: string) => `/users/${id}/restore`,
  },
};
