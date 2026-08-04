import { BaseService } from '../base.service';
import type {
  MaterialResponse,
  MaterialQueryParams,
  PaginatedMaterials,
} from '../../types/material';
import type { ListQueryParams } from '../../types/query-params';

class MaterialService extends BaseService {
  constructor() {
    super({ basePath: '/materials' });
  }

  async list(params: MaterialQueryParams): Promise<PaginatedMaterials> {
    return this.getList<MaterialResponse>(params as ListQueryParams);
  }
}

export const materialService = new MaterialService();
