import { BaseService } from '../base.service';
import type { UnitResponse, PaginatedUnits, UnitQueryParams } from '../../../types/unit';
import type { ListQueryParams } from '../../types/query-params';

class UnitService extends BaseService {
  constructor() {
    super({ basePath: '/units' });
  }

  async list(params: UnitQueryParams): Promise<PaginatedUnits> {
    return this.getList<UnitResponse>(params as ListQueryParams);
  }

  async bulkRestore(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.restore(id);
    }
  }
}

export const unitService = new UnitService();
