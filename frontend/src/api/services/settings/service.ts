import { BaseService } from '../base.service';
import type { SettingResponse, UpdateSettingPayload } from '../../../types/settings';

class SettingsService extends BaseService {
  constructor() {
    super({ basePath: '/settings' });
  }

  async list(category?: string): Promise<SettingResponse[]> {
    const url = category ? `/settings?category=${category}` : '/settings';
    return this.get<SettingResponse[]>(url);
  }

  async getByKey(key: string): Promise<SettingResponse> {
    return this.get<SettingResponse>(`/settings/${key}`);
  }

  async updateSetting(key: string, payload: UpdateSettingPayload): Promise<SettingResponse> {
    return this.patch<SettingResponse>(`/settings/${key}`, payload);
  }
}

export const settingsService = new SettingsService();
