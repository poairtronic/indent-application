import { BaseService } from '../base.service';
import type { CostSheet } from '../../../types/costing';

class CostSheetService extends BaseService {
  constructor() {
    super({ basePath: '/cost-sheets' });
  }

  async getByIndent(indentId: string): Promise<CostSheet> {
    return this.get<CostSheet>(`/cost-sheets/indent/${indentId}`);
  }

  async getEstimation(indentId: string): Promise<CostSheet> {
    return this.get<CostSheet>(`/costing/estimation/${indentId}`);
  }

  async updateEstimation(indentId: string, data: Record<string, unknown>): Promise<CostSheet> {
    return this.put<CostSheet>(`/costing/estimation/${indentId}`, data);
  }
}

export const costSheetService = new CostSheetService();
