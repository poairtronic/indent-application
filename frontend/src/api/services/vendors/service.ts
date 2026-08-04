import { BaseService } from '../base.service';
import type { VendorResponse, PaginatedVendors, VendorQueryParams } from '../../../types/vendor';
import type { ListQueryParams } from '../../types/query-params';

class VendorService extends BaseService {
  constructor() {
    super({ basePath: '/vendors' });
  }

  async list(params: VendorQueryParams): Promise<PaginatedVendors> {
    return this.getList<VendorResponse>(params as ListQueryParams);
  }

  async bulkRestore(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.restore(id);
    }
  }
}

export const vendorService = new VendorService();
