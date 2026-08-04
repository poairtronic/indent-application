import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/query-keys';
import { communicationService } from './service';

export function useCommunicationLogs() {
  return useQuery({
    queryKey: queryKeys.businessTransactions.list('communication'),
    queryFn: () => communicationService.getLogs(),
  });
}

export function useCommunicationHealth() {
  return useQuery({
    queryKey: queryKeys.businessTransactions.detail('communication', 'health'),
    queryFn: () => communicationService.getHealth(),
  });
}

export function useCommunicationQueue() {
  return useQuery({
    queryKey: queryKeys.businessTransactions.detail('communication', 'queue'),
    queryFn: () => communicationService.getQueueStats(),
  });
}

export function useCommunicationMetrics() {
  return useQuery({
    queryKey: queryKeys.businessTransactions.detail('communication', 'metrics'),
    queryFn: () => communicationService.getMetrics(),
  });
}
