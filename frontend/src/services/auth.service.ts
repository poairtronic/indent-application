import { apiFetch } from './api';
import { API_ENDPOINTS } from '../constants/api';

export const authService = {
  login: async (credentials: any) => {
    const data = await apiFetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  logout: async () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async () => {
    return apiFetch(API_ENDPOINTS.AUTH.ME);
  },
};
