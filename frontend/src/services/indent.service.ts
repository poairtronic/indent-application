import { apiFetch } from './api';
import { API_ENDPOINTS } from '../constants/api';
import type { Indent, IndentStatus } from '../types/indent';

export const indentService = {
  create: async (indentData: Partial<Indent>): Promise<Indent> => {
    return apiFetch(API_ENDPOINTS.INDENTS.BASE, {
      method: 'POST',
      body: JSON.stringify(indentData),
    });
  },

  getAll: async (params?: Record<string, any>): Promise<{ data: Indent[]; total: number }> => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`${API_ENDPOINTS.INDENTS.BASE}${query}`);
  },

  getById: async (id: string): Promise<Indent> => {
    return apiFetch(API_ENDPOINTS.INDENTS.DETAIL(id));
  },

  update: async (id: string, indentData: Partial<Indent>): Promise<Indent> => {
    return apiFetch(API_ENDPOINTS.INDENTS.DETAIL(id), {
      method: 'PUT',
      body: JSON.stringify(indentData),
    });
  },

  updateStatus: async (id: string, status: IndentStatus): Promise<Indent> => {
    return apiFetch(API_ENDPOINTS.INDENTS.STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch(API_ENDPOINTS.INDENTS.DETAIL(id), {
      method: 'DELETE',
    });
  },
};
