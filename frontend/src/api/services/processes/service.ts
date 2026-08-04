import { BaseService } from '../base.service';
import type {
  ProcessResponse,
  PaginatedProcesses,
  ProcessQueryParams,
} from '../../../types/process';
import type { ListQueryParams } from '../../types/query-params';

class ProcessService extends BaseService {
  constructor() {
    super({ basePath: '/manufacturing-processes' });
  }

  async list(params: ProcessQueryParams): Promise<PaginatedProcesses> {
    return this.getList<ProcessResponse>(params as ListQueryParams);
  }

  async bulkRestore(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.restore(id);
    }
  }
}

export const processService = new ProcessService();
