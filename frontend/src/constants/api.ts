export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  INDENTS: {
    BASE: '/indents',
    DETAIL: (id: string) => `/indents/${id}`,
    STATUS: (id: string) => `/indents/${id}/status`,
  },
  USERS: {
    BASE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
  },
};
