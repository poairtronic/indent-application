import { VendorStatus } from '@prisma/client';

export interface IVendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  email: string;
  phone?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status: VendorStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVendorFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorStatus;
}
