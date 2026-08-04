import React from 'react';
import { ActivityTimeline } from '../../../components/ui/DataTimeline';
import type { WorkflowHistory } from '../../../types/indent';

interface ActivityFeedProps {
  history?: WorkflowHistory[];
  className?: string;
}

export const IndentActivityFeed: React.FC<ActivityFeedProps> = ({ history, className = '' }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-xs">
        No workflow activity recorded yet.
      </div>
    );
  }

  const items = history.map((item) => ({
    id: item.id,
    title: `Stage Changed: ${item.fromStage} → ${item.toStage}`,
    description: item.remarks || `Updated by ${item.actor?.name || item.actionBy}`,
    timestamp: new Date(item.createdAt).toLocaleString(),
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
