import { BaseService } from '../base.service';
import type { PaginatedAuditLogs, AuditLogQueryParams } from '../../types/audit';
import type { ListQueryParams } from '../../types/query-params';

class AuditService extends BaseService {
  constructor() {
    super({ basePath: '/audit-logs' });
  }

  async list(params?: AuditLogQueryParams): Promise<PaginatedAuditLogs> {
    return this.getList<any>(params as ListQueryParams | undefined);
  }
}

export const auditService = new AuditService();
