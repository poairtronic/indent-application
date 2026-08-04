import React, { useState } from 'react';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Download } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  status: 'Success' | 'Failed' | 'Warning';
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    user: 'EMP001',
    action: 'Created Indent #IND-2026-0001',
    module: 'Indent',
    status: 'Success',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    user: 'EMP002',
    action: 'Approved Cost Sheet #CS-001',
    module: 'Costing',
    status: 'Success',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    user: 'EMP005',
    action: 'Failed Login Attempt',
    module: 'Auth',
    status: 'Failed',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    user: 'SYSTEM',
    action: 'Batch Cost Recalculation',
    module: 'Costing',
    status: 'Success',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    user: 'EMP001',
    action: 'Exported Financial Report',
    module: 'Reports',
    status: 'Success',
  },
];

export const AuditLogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = MOCK_LOGS.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Audit Logs</h2>
          <p className="text-text-secondary text-sm">
            Comprehensive system event tracking for compliance and security.
          </p>
        </div>
        <Button variant="outline" icon={<Download size={16} />}>
          Export CSV
        </Button>
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl p-4 flex-1 flex flex-col">
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-auto rounded-lg border border-border-default">
          <Table
            data={filteredLogs}
            columns={[
              {
                key: 'timestamp',
                header: 'Timestamp',
                render: (row) => new Date(row.timestamp).toLocaleString(),
              },
              { key: 'user', header: 'User/System' },
              { key: 'action', header: 'Event Action' },
              { key: 'module', header: 'Module' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      row.status === 'Success'
                        ? 'bg-status-success/10 text-status-success'
                        : row.status === 'Failed'
                          ? 'bg-status-error/10 text-status-error'
                          : 'bg-status-warning/10 text-status-warning'
                    }`}
                  >
                    {row.status}
                  </span>
                ),
              },
            ]}
          />
        </div>
        <div className="mt-4 flex justify-between items-center text-xs text-text-secondary">
          <span>Showing {filteredLogs.length} events</span>
          <span>Data retained for 90 days as per enterprise policy</span>
        </div>
      </div>
    </div>
  );
};
