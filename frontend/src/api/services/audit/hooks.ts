import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { auditService } from './service';
import type { AuditLogQueryParams } from '../../types/audit';

export function useAuditLogs(params?: AuditLogQueryParams, enabled?: boolean) {
  return useQuery({
    queryKey: [...queryKeys.audit.list('audit'), params],
    queryFn: () => auditService.list(params),
    enabled,
    staleTime: 30000,
    retry: false,
  });
}
