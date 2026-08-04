import { apiFetch } from './api';
import { API_ENDPOINTS } from '../constants/api';
import type { Indent } from '../types/indent';

export const businessTransactionService = {
  create: async (payload: { indent: any; costSheet: any }): Promise<Indent> => {
    return apiFetch(API_ENDPOINTS.INDENTS.BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAll: async (
    params?: Record<string, any>,
  ): Promise<{ data: Indent[]; total: number; meta?: any }> => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`${API_ENDPOINTS.INDENTS.BASE}${query}`);
  },

  getById: async (id: string): Promise<Indent> => {
    return apiFetch(API_ENDPOINTS.INDENTS.DETAIL(id));
  },

  update: async (id: string, payload: { indent?: any; costSheet?: any }): Promise<Indent> => {
    return apiFetch(API_ENDPOINTS.INDENTS.DETAIL(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // State Transition API (e.g. submit design)
  submitDesign: async (id: string, remarks?: string): Promise<Indent> => {
    return apiFetch(`${API_ENDPOINTS.INDENTS.DETAIL(id)}/submit`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  },

  // Accounts endpoints for Phase 19C-2
  enterActualCosts: async (id: string, dto: any): Promise<Indent> => {
    return apiFetch(`${API_ENDPOINTS.INDENTS.DETAIL(id)}/accounts/actual-cost`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateMaterialCost: async (id: string, dto: any): Promise<Indent> => {
    return apiFetch(`${API_ENDPOINTS.INDENTS.DETAIL(id)}/accounts/material-cost`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },

  financialClose: async (id: string, dto: any): Promise<Indent> => {
    return apiFetch(`${API_ENDPOINTS.INDENTS.DETAIL(id)}/accounts/financial-close`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
