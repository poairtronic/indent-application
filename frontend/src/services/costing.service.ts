import { apiFetch } from './api';

export const costingService = {
  getEstimation: async (indentId: string) => {
    return apiFetch(`/costing/estimation/${indentId}`);
  },

  updateEstimation: async (indentId: string, costData: any) => {
    return apiFetch(`/costing/estimation/${indentId}`, {
      method: 'PUT',
      body: JSON.stringify(costData),
    });
  },
};
