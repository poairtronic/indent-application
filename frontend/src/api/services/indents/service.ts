import { BaseService } from '../base.service';
import type { WorkflowState } from '../../types/enums';
import type { ListQueryParams } from '../../types/query-params';

export interface IndentData {
  id: string;
  indentNumber: string;
  productId: string;
  departmentId: string;
  priority: string;
  currentState: WorkflowState;
  requiredDate: string;
  requiredDeliveryDate?: string | null;
  purpose?: string | null;
  remarks?: string | null;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIndentPayload {
  indent: Record<string, unknown>;
  costSheet: Record<string, unknown>;
}

export interface UpdateIndentPayload {
  indent?: Record<string, unknown>;
  costSheet?: Record<string, unknown>;
}

export interface IndentQueryParams {
  page?: number;
  limit?: number;
  state?: WorkflowState;
  search?: string;
  departmentId?: string;
}

export type PaginatedIndents = import('../../types/enums').PaginatedData<IndentData>;

class IndentService extends BaseService {
  constructor() {
    super({ basePath: '/business-transactions' });
  }

  async list(params: IndentQueryParams): Promise<PaginatedIndents> {
    return this.getList<IndentData>(params as ListQueryParams);
  }

  async submit(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/submit`, { remarks });
  }

  async verifyStores(id: string): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/stores/verify`);
  }

  async issueStores(id: string, data?: Record<string, unknown>): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/stores/issue`, data);
  }

  async receiveProduction(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/production/receive`, { remarks });
  }

  async startProduction(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/production/start`, { remarks });
  }

  async updateProgress(id: string, data: Record<string, unknown>): Promise<IndentData> {
    return this.patch<IndentData>(`/business-transactions/${id}/production/progress`, data);
  }

  async completeProduction(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/production/complete`, { remarks });
  }

  async deliverCustomer(id: string, data: Record<string, unknown>): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/delivery`, data);
  }

  async verifyAccounts(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/accounts/verify`, { remarks });
  }

  async enterActualCosts(id: string, data: Record<string, unknown>): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/accounts/actual-cost`, data);
  }

  async updateMaterialCost(id: string, data: Record<string, unknown>): Promise<IndentData> {
    return this.patch<IndentData>(`/business-transactions/${id}/accounts/material-cost`, data);
  }

  async financialClose(id: string, data?: Record<string, unknown>): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/accounts/financial-close`, data);
  }

  async archive(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/archive`, { remarks });
  }

  async complete(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`/business-transactions/${id}/complete`, { remarks });
  }

  async uploadAttachment(
    id: string,
    file: File,
    remarks?: string,
    onProgress?: (progress: number) => void,
  ): Promise<unknown> {
    return this.upload(
      `/business-transactions/${id}/attachments`,
      file,
      remarks ? { remarks } : undefined,
      onProgress,
    );
  }

  async downloadAttachment(fileName: string): Promise<void> {
    await this.download(`/business-transactions/attachments/download/${fileName}`, fileName);
  }

  async getAttachmentSummary(id: string): Promise<unknown> {
    return this.get(`/business-transactions/${id}/attachments/summary`);
  }

  async removeAttachment(id: string, attachmentId: string): Promise<void> {
    await this.delete(`/business-transactions/${id}/attachments/${attachmentId}`);
  }
}

export const indentService = new IndentService();
