import { BaseService } from '../base.service';
import type { WorkflowState } from '../../types/enums';
import type { ListQueryParams } from '../../types/query-params';

export interface BusinessTransactionData {
  id: string;
  indentNumber: string;
  costNumber: string;
  productId: string;
  departmentId: string;
  currentState: WorkflowState;
  currentLoop: string;
  isLocked: boolean;
  predictedTotalCost: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

class BusinessTransactionService extends BaseService {
  constructor() {
    super({ basePath: '/business-transactions' });
  }

  async list(
    params?: Record<string, unknown>,
  ): Promise<{ items: BusinessTransactionData[]; total: number }> {
    return this.get('/business-transactions', params as ListQueryParams | undefined);
  }

  async submit(id: string, remarks?: string): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/submit`, { remarks });
  }

  async verifyStores(id: string): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/stores/verify`);
  }

  async issueStores(id: string, data?: Record<string, unknown>): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/stores/issue`, data);
  }

  async receiveProduction(id: string, remarks?: string): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/production/receive`, {
      remarks,
    });
  }

  async startProduction(id: string, remarks?: string): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/production/start`, {
      remarks,
    });
  }

  async updateProgress(
    id: string,
    data: Record<string, unknown>,
  ): Promise<BusinessTransactionData> {
    return this.patch<BusinessTransactionData>(
      `/business-transactions/${id}/production/progress`,
      data,
    );
  }

  async completeProduction(id: string, remarks?: string): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/production/complete`, {
      remarks,
    });
  }

  async deliverCustomer(
    id: string,
    data: Record<string, unknown>,
  ): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/delivery`, data);
  }

  async verifyAccounts(id: string, remarks?: string): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/accounts/verify`, {
      remarks,
    });
  }

  async enterActualCosts(
    id: string,
    data: Record<string, unknown>,
  ): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(
      `/business-transactions/${id}/accounts/actual-cost`,
      data,
    );
  }

  async updateMaterialCost(
    id: string,
    data: Record<string, unknown>,
  ): Promise<BusinessTransactionData> {
    return this.patch<BusinessTransactionData>(
      `/business-transactions/${id}/accounts/material-cost`,
      data,
    );
  }

  async financialClose(
    id: string,
    data?: Record<string, unknown>,
  ): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(
      `/business-transactions/${id}/accounts/financial-close`,
      data,
    );
  }

  async archive(id: string, remarks?: string): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/archive`, { remarks });
  }

  async complete(id: string, remarks?: string): Promise<BusinessTransactionData> {
    return this.post<BusinessTransactionData>(`/business-transactions/${id}/complete`, { remarks });
  }
}

export const businessTransactionService = new BusinessTransactionService();
