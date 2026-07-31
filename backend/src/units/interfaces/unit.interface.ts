export interface IUnit {
  id: string;
  unitCode: string;
  unitName: string;
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUnitFilterParams {
  page?: number;
  limit?: number;
  search?: string;
}
