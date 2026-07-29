import { apiFetch } from './api';
import { API_ENDPOINTS } from '../constants/api';

export const indentService = {
  create: async (indentData: any) => {
    return apiFetch(API_ENDPOINTS.INDENTS.BASE, {
      method: 'POST',
      body: JSON.stringify(indentData),
    });
  },

  getAll: async () => {
    return apiFetch(API_ENDPOINTS.INDENTS.BASE);
  },

  getById: async (id: string) => {
    return apiFetch(API_ENDPOINTS.INDENTS.DETAIL(id));
  },

  updateStatus: async (id: string, status: string) => {
    return apiFetch(API_ENDPOINTS.INDENTS.STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
