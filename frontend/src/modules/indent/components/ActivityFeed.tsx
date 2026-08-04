import React from 'react';
import { ActivityTimeline } from '../../../components/ui/DataTimeline';
import type { WorkflowHistoryData } from '../../../api/services/indents/service';

interface ActivityFeedProps {
  history?: WorkflowHistoryData[];
  className?: string;
}

export const IndentActivityFeed: React.FC<ActivityFeedProps> = ({ history, className = '' }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 bg-surface-card rounded-xl border border-border-default shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-4">Workflow Activity</h3>
        <div className="text-center py-8 text-text-muted text-xs">
          No workflow activity recorded yet.
        </div>
      </div>
    );
  }

  const items = history.map((item) => ({
    id: item.id,
    title: `Moved to ${item.toDepartment?.name || 'Unknown'}`,
    description:
      item.remarks || `By ${item.mover?.firstName} ${item.mover?.lastName}` || 'No remarks',
    timestamp: new Date(item.movedAt).toLocaleString(),
  }));

  return (
    <div
      className={`p-4 bg-surface-card rounded-xl border border-border-default shadow-card ${className}`}
    >
      <h3 className="text-sm font-bold text-text-primary mb-6">Workflow Activity</h3>
      <ActivityTimeline items={items} />
    </div>
  );
};
