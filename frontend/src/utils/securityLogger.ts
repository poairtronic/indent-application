import { useAuthStore } from '../store/authStore';

export interface SecurityAuditEvent {
  user: string;
  department: string;
  permission: string;
  resource: string;
  timestamp: string;
  action: string;
}

export function logSecurityDenial(permission: string, resource: string, action: string): void {
  const user = useAuthStore.getState().user;
  const event: SecurityAuditEvent = {
    user: user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Anonymous',
    department: user?.department?.departmentName || 'N/A',
    permission,
    resource,
    timestamp: new Date().toISOString(),
    action,
  };

  // Structured warning print
  console.warn('[SECURITY AUDIT EVENT] Permission Denied:', event);

  // Persistence to local storage audit trails
  try {
    const existingLogs = JSON.parse(localStorage.getItem('security_audit_events') || '[]');
    existingLogs.push(event);
    localStorage.setItem('security_audit_events', JSON.stringify(existingLogs.slice(-100)));
  } catch {
    // silent execution
  }
}
