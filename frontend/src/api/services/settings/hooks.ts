import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { settingsService } from './service';
import type { UpdateSettingPayload } from '../../../types/settings';

export function useSettings(category?: string) {
  return useQuery({
    queryKey: category ? [...queryKeys.settings.list('settings'), category] : queryKeys.settings.list('settings'),
    queryFn: () => settingsService.list(category),
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: queryKeys.settings.detail('settings', key),
    queryFn: () => settingsService.getByKey(key),
    retry: false, // Don't retry if setting doesn't exist yet
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, payload }: { key: string; payload: UpdateSettingPayload }) =>
      settingsService.updateSetting(key, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.list('settings') });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.detail('settings', variables.key) });
    },
  });
}
