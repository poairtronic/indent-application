import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { communicationService } from './service';
import type { CommunicationLogQueryParams } from '../../types/notification';

export function useCommunicationLogs(params?: CommunicationLogQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.communication.list('communication'), params],
    queryFn: () => communicationService.getLogs(params),
  });
}

export function useCommunicationHealth() {
  return useQuery({
    queryKey: queryKeys.communication.detail('communication', 'health'),
    queryFn: () => communicationService.getHealth(),
  });
}

export function useCommunicationQueue() {
  return useQuery({
    queryKey: queryKeys.communication.detail('communication', 'queue'),
    queryFn: () => communicationService.getQueueStats(),
  });
}

export function useCommunicationMetrics() {
  return useQuery({
    queryKey: queryKeys.communication.detail('communication', 'metrics'),
    queryFn: () => communicationService.getMetrics(),
  });
}
