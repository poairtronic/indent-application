import { BaseService } from '../base.service';
import type {
  PaginatedCommunicationLogs,
  CommunicationLogQueryParams,
  CommunicationHealth,
  CommunicationQueueStats,
  CommunicationMetrics,
  TestEmailPayload,
} from '../../types/notification';
import type { ListQueryParams } from '../../types/query-params';

class CommunicationService extends BaseService {
  constructor() {
    super({ basePath: '/communication' });
  }

  async getLogs(params?: CommunicationLogQueryParams): Promise<PaginatedCommunicationLogs> {
    return this.get<PaginatedCommunicationLogs>(
      '/communication/logs',
      params as ListQueryParams | undefined,
    );
  }

  async testEmail(payload: TestEmailPayload): Promise<{ success: boolean; jobId?: string }> {
    return this.post<{ success: boolean; jobId?: string }>('/communication/test', payload);
  }

  async getHealth(): Promise<CommunicationHealth> {
    return this.get<CommunicationHealth>('/communication/health');
  }

  async getQueueStats(): Promise<CommunicationQueueStats> {
    return this.get<CommunicationQueueStats>('/communication/queue');
  }

  async getMetrics(): Promise<CommunicationMetrics> {
    return this.get<CommunicationMetrics>('/communication/metrics');
  }
}

export const communicationService = new CommunicationService();
