import { BaseService } from '../base.service';
import type { WorkflowState } from '../../types/enums';
import type { ListQueryParams } from '../../types/query-params';
import type { PaginatedData } from '../../types/api-response';

export interface IndentData {
  id: string;
  indentNumber: string;
  costNumber?: string;
  customerName?: string | null;
  layoutNumber?: string | null;
  productId: string;
  productName?: string;
  departmentId: string;
  departmentName?: string;
  priority: string;
  currentState: WorkflowState;
  currentLoop?: string;
  predictedTotal?: number;
  creatorName?: string;
  requiredDate: string;
  requiredDeliveryDate?: string | null;
  purpose?: string | null;
  remarks?: string | null;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  issuedItemsCount?: number;
  totalItemsCount?: number;
  items?: IndentItemData[];
  broughtMaterials?: IndentBroughtMaterialData[];
  attachments?: IndentAttachmentData[];
  costSheet?: CostSheetData;
  workflowHistory?: WorkflowHistoryData[];
  allowedNextStates?: WorkflowState[];
  productionReceipt?: unknown;
}

export interface IndentItemData {
  id: string;
  materialId: string;
  material?: { id: string; materialName: string; materialCode: string };
  quantity: number;
  unitId: string;
  unit?: { id: string; unitName: string; symbol: string };
  remarks?: string;
  status?: string;
  indentProcesses?: Array<{ process: { id: string; processName: string } }>;
}

export interface IndentBroughtMaterialData {
  id: string;
  name: string;
  quantity: number;
  issuedQuantity?: number;
  status?: string;
  specification?: string | null;
  amount?: number | null;
  actualAmount?: number | null;
}

export interface DocumentUploader {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface DocumentIndentSummary {
  id: string;
  indentNumber: string;
  customerName?: string | null;
  layoutNumber?: string | null;
  status: string;
  currentState: string;
  purpose?: string | null;
  createdAt: string;
  product?: {
    id: string;
    productName: string;
    productCode: string;
  } | null;
  department?: {
    id: string;
    departmentName: string;
    departmentCode: string;
  } | null;
}

export interface IndentAttachmentData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string | DocumentUploader;
  createdAt: string;
  mimeType?: string;
  fileSize?: number;
  department?: string;
  remarks?: string;
  storageFileName?: string;
}

export interface IndentDocumentItem {
  id: string;
  indentId: string;
  indent?: DocumentIndentSummary | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedBy?: DocumentUploader | string;
  createdAt: string;
  mimeType?: string;
  fileSize?: number;
  department?: string;
  remarks?: string;
  costSheetId?: string | null;
  storageFileName?: string;
}

export interface DocumentSearchParams {
  businessTransactionId?: string;
  costSheetId?: string;
  documentType?: string;
  department?: string;
  uploadedBy?: string;
  uploadDate?: string;
  fileName?: string;
  indentNumber?: string;
  search?: string;
}

export interface CostSheetData {
  id: string;
  costNumber: string;
  designCost?: number;
  overheadCost?: number;
  contingencyCost?: number;
  actualDesignCost?: number | null;
  actualOverheadCost?: number | null;
  actualContingencyCost?: number | null;
  predictedTotal: number;
  actualTotal?: number;
  varianceAmount?: number;
  variancePercentage?: number;
  status: string;
  costItems?: CostItemData[];
  processCosts?: ProcessCostData[];
}

export interface CostItemData {
  id: string;
  materialId: string;
  material?: { id: string; materialName: string };
  vendorId?: string;
  vendor?: { id: string; vendorName: string };
  predictedRate: number;
  predictedQuantity: number;
  predictedAmount: number;
  actualRate?: number;
  actualQuantity?: number;
  actualAmount?: number;
  remarks?: string;
}

export interface ProcessCostData {
  id: string;
  processId: string;
  process?: { id: string; processName: string };
  predictedCost: number;
  estimatedHours?: number;
  actualCost?: number;
  actualHours?: number;
  variance?: number;
}

export interface WorkflowHistoryData {
  id: string;
  movedAt: string;
  mover?: { id: string; firstName: string; lastName: string };
  toDepartment?: { id: string; name: string };
  remarks?: string;
}

export interface CreateIndentPayload {
  indent: {
    productId: string;
    departmentId: string;
    priority: string;
    requiredDate: string;
    requiredDeliveryDate?: string;
    purpose?: string;
    remarks?: string;
    items: Array<{
      materialId: string;
      quantity: number;
      unitId: string;
      remarks?: string;
      processes?: Array<{
        processId: string;
        sequence: number;
        estimatedHours?: number;
      }>;
    }>;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
    }>;
  };
  costSheet: {
    predictedTotal: number;
    costItems: Array<{
      materialId: string;
      vendorId?: string;
      predictedRate: number;
      predictedQuantity: number;
      predictedAmount: number;
      remarks?: string;
    }>;
    processCosts: Array<{
      processId: string;
      predictedCost: number;
      estimatedHours?: number;
      vendorType?: string;
      vendorId?: string;
    }>;
  };
}

export interface UpdateIndentPayload {
  indent?: {
    priority?: string;
    requiredDate?: string;
    requiredDeliveryDate?: string;
    purpose?: string;
    remarks?: string;
    items?: Array<{
      materialId: string;
      quantity: number;
      unitId: string;
      remarks?: string;
      processes?: Array<{
        processId: string;
        sequence: number;
        estimatedHours?: number;
      }>;
    }>;
  };
  costSheet?: {
    predictedTotal?: number;
    costItems?: Array<{
      materialId: string;
      vendorId?: string;
      predictedRate: number;
      predictedQuantity: number;
      predictedAmount: number;
      remarks?: string;
    }>;
    processCosts?: Array<{
      processId: string;
      predictedCost: number;
      estimatedHours?: number;
      vendorType?: string;
      vendorId?: string;
    }>;
  };
}

export interface IndentQueryParams {
  page?: number;
  limit?: number;
  state?: WorkflowState;
  search?: string;
  departmentId?: string;
}

class IndentService extends BaseService {
  constructor() {
    super({ basePath: '/business-transactions' });
  }

  async list(params: IndentQueryParams): Promise<PaginatedData<IndentData>> {
    return this.getList<IndentData>(params as ListQueryParams);
  }

  async getOperationalSummary(): Promise<{
    totalTransactions: number;
    activeTransactions: number;
    inProduction: number;
    completedTransactions: number;
    stageDistribution: Array<{ stageName: string; count: number; percentage: number }>;
  }> {
    return this.getRaw(`${this.basePath}/operational-summary`);
  }

  async getDetail(id: string): Promise<IndentData> {
    return this.get<IndentData>(`${this.basePath}/${id}`);
  }

  // Design workflow
  async submit(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/submit`, { remarks });
  }

  // Stores workflow
  async verifyStores(id: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/stores/verify`);
  }

  async issueStores(id: string, data?: Record<string, unknown>): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/stores/issue`, data);
  }

  async issueItem(id: string, itemId: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/items/${itemId}/issue`);
  }

  // Production workflow
  async receiveProduction(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/production/receive`, { remarks });
  }

  async startProduction(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/production/start`, { remarks });
  }

  async updateProgress(id: string, data: Record<string, unknown>): Promise<IndentData> {
    return this.patch<IndentData>(`${this.basePath}/${id}/production/progress`, data);
  }

  async completeProduction(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/production/complete`, { remarks });
  }

  async deliverCustomer(id: string, data: Record<string, unknown>): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/delivery`, data);
  }

  // Accounts workflow
  async verifyAccounts(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/accounts/verify`, { remarks });
  }

  async enterActualCosts(id: string, data: Record<string, unknown>): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/accounts/actual-cost`, data);
  }

  async updateMaterialCost(id: string, data: Record<string, unknown>): Promise<IndentData> {
    return this.patch<IndentData>(`${this.basePath}/${id}/accounts/material-cost`, data);
  }

  async financialClose(id: string, data?: Record<string, unknown>): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/accounts/financial-close`, data);
  }

  // System workflow
  async archive(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/archive`, { remarks });
  }

  async complete(id: string, remarks?: string): Promise<IndentData> {
    return this.post<IndentData>(`${this.basePath}/${id}/complete`, { remarks });
  }

  // Attachments
  async uploadAttachment(
    id: string,
    file: File,
    remarks?: string,
    onProgress?: (progress: number) => void,
  ): Promise<IndentAttachmentData> {
    return this.upload<IndentAttachmentData>(
      `${this.basePath}/${id}/attachments`,
      file,
      remarks ? { remarks } : undefined,
      onProgress,
    );
  }

  async downloadAttachment(fileName: string): Promise<void> {
    await this.download(`${this.basePath}/attachments/download/${fileName}`, fileName);
  }

  async getAttachmentSummary(id: string): Promise<{
    businessTransactionId: string;
    indentNumber: string;
    totalDocuments: number;
    designDocuments: number;
    accountsDocuments: number;
    cadFiles: number;
    pdfFiles: number;
    excelFiles: number;
    imageFiles: number;
    otherFiles: number;
    totalFileSize: number;
  }> {
    return this.get(`${this.basePath}/${id}/attachments/summary`);
  }

  async searchAttachments(params?: DocumentSearchParams): Promise<IndentDocumentItem[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.get<IndentDocumentItem[]>(`${this.basePath}/attachments/search${queryString}`);
  }

  async removeAttachment(id: string, attachmentId: string): Promise<void> {
    await this.delete(`${this.basePath}/${id}/attachments/${attachmentId}`);
  }
}

export const indentService = new IndentService();
