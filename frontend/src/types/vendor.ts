export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'BLACKLISTED';

export interface VendorResponse {
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
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedVendors {
  items: VendorResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VendorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorStatus;
}

export interface CreateVendorPayload {
  vendorCode: string;
  vendorName: string;
  email: string;
  phone?: string;
  gstNumber?: string;
  panNumber?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status?: VendorStatus;
}

export interface UpdateVendorPayload {
  vendorCode?: string;
  vendorName?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  status?: VendorStatus;
}
