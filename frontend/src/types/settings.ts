export interface SettingResponse {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingPayload {
  value: string;
  description?: string;
  category?: string;
}
