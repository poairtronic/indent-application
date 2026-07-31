import { useCallback, useEffect, useState } from 'react';

export interface DeletedRecordInfo {
  id: string;
  summary: string;
  deletedAt: string;
}

const STORAGE_PREFIX = 'deleted-records:';

function read(key: string): DeletedRecordInfo[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as DeletedRecordInfo[]) : [];
  } catch {
    return [];
  }
}

export function useDeletedRecords(moduleKey: string) {
  const [records, setRecords] = useState<DeletedRecordInfo[]>(() => read(moduleKey));

  useEffect(() => {
    sessionStorage.setItem(STORAGE_PREFIX + moduleKey, JSON.stringify(records));
  }, [moduleKey, records]);

  const addDeleted = useCallback((record: DeletedRecordInfo) => {
    setRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
  }, []);

  const removeDeleted = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { records, addDeleted, removeDeleted };
}
