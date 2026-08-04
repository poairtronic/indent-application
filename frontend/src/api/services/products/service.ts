import { BaseService } from '../base.service';
import type { ProductResponse, ProductQueryParams, PaginatedProducts } from '../../types/product';
import type { ListQueryParams } from '../../types/query-params';

class ProductService extends BaseService {
  constructor() {
    super({ basePath: '/products' });
  }

  async list(params: ProductQueryParams): Promise<PaginatedProducts> {
    return this.getList<ProductResponse>(params as ListQueryParams);
  }
}

export const productService = new ProductService();
