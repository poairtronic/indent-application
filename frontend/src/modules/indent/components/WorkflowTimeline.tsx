import React from 'react';
import { WorkflowTimeline as UIWorkflowTimeline } from '../../../components/ui/DataTimeline';
import { IndentStatus } from '../../../types/indent';

interface IndentWorkflowProps {
  currentStatus: IndentStatus;
  className?: string;
}

// Ordered stages for the timeline
const WORKFLOW_STAGES = [
  { id: '1', title: 'Draft', status: IndentStatus.DRAFT, description: 'Design Dept' },
  { id: '2', title: 'Design', status: IndentStatus.DESIGN_COMPLETED, description: 'Design Dept' },
  { id: '3', title: 'Stores', status: IndentStatus.STORES_PROCESSING, description: 'Stores Dept' },
  {
    id: '4',
    title: 'Production',
    status: IndentStatus.PRODUCTION_PROCESSING,
    description: 'Production Dept',
  },
  {
    id: '5',
    title: 'Delivery',
    status: IndentStatus.CUSTOMER_DELIVERED,
    description: 'Production Dept',
  },
  {
    id: '6',
    title: 'Accounts',
    status: IndentStatus.ACCOUNTS_COST_VERIFICATION,
    description: 'Accounts Dept',
  },
  {
    id: '7',
    title: 'Closure',
    status: IndentStatus.ACCOUNTS_FINANCIAL_CLOSURE,
    description: 'Accounts Dept',
  },
  { id: '8', title: 'Archive', status: IndentStatus.ARCHIVED, description: 'System' },
  { id: '9', title: 'Completed', status: IndentStatus.COMPLETED, description: 'System' },
];

export const IndentWorkflowTimeline: React.FC<IndentWorkflowProps> = ({
  currentStatus,
  className = '',
}) => {
  // Find index of current status. Fallback to -1 if custom/unmapped status.
  const currentIndex = WORKFLOW_STAGES.findIndex((s) => s.status === currentStatus);

  const items = WORKFLOW_STAGES.map((stage, index) => {
    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex;

    let iconClass = 'w-1.5 h-1.5 rounded-full ';
    if (isCompleted) iconClass += 'bg-status-success';
    else if (isCurrent) iconClass += 'bg-accent-primary animate-pulse';
    else iconClass += 'bg-border-strong';

    return {
      id: stage.id,
      title: stage.title,
      description: stage.description,
      timestamp: '',
      icon: <span className={iconClass} />,
    };
  });

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <UIWorkflowTimeline items={items} />
    </div>
  );
};
