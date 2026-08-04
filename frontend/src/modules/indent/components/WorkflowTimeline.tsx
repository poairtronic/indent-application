import React from 'react';
import { WorkflowTimeline as UIWorkflowTimeline } from '../../../components/ui/DataTimeline';

interface IndentWorkflowProps {
  currentStatus: string;
  className?: string;
}

const WORKFLOW_STAGES = [
  { id: '1', title: 'Draft', state: 'DRAFT', description: 'Design Dept' },
  { id: '2', title: 'Design Submitted', state: 'DESIGN_COMPLETED', description: 'Design Dept' },
  { id: '3', title: 'Stores Processing', state: 'STORES_PROCESSING', description: 'Stores Dept' },
  { id: '4', title: 'Materials Issued', state: 'MATERIALS_ISSUED', description: 'Stores Dept' },
  {
    id: '5',
    title: 'Production Processing',
    state: 'PRODUCTION_PROCESSING',
    description: 'Production Dept',
  },
  {
    id: '6',
    title: 'Production Completed',
    state: 'PRODUCTION_COMPLETED',
    description: 'Production Dept',
  },
  {
    id: '7',
    title: 'Customer Delivered',
    state: 'CUSTOMER_DELIVERED',
    description: 'Production Dept',
  },
  {
    id: '8',
    title: 'Accounts Verification',
    state: 'ACCOUNTS_COST_VERIFICATION',
    description: 'Accounts Dept',
  },
  {
    id: '9',
    title: 'Actual Cost Updated',
    state: 'ACTUAL_COST_UPDATED',
    description: 'Accounts Dept',
  },
  {
    id: '10',
    title: 'Financial Closure',
    state: 'ACCOUNTS_FINANCIAL_CLOSURE',
    description: 'Accounts Dept',
  },
  { id: '11', title: 'Archived', state: 'ARCHIVED', description: 'System' },
  { id: '12', title: 'Completed', state: 'COMPLETED', description: 'System' },
];

export const IndentWorkflowTimeline: React.FC<IndentWorkflowProps> = ({
  currentStatus,
  className = '',
}) => {
  const currentIndex = WORKFLOW_STAGES.findIndex((s) => s.state === currentStatus);

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
