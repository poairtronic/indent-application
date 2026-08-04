import React from 'react';
import { WorkflowTimeline as UIWorkflowTimeline } from '../../../components/ui/DataTimeline';
import { WORKFLOW_STAGES, ALL_WORKFLOW_STATES } from '../../../constants/workflow';
import type { WorkflowState } from '../../../constants/workflow';

interface IndentWorkflowProps {
  currentStatus: string;
  className?: string;
}

export const IndentWorkflowTimeline: React.FC<IndentWorkflowProps> = ({
  currentStatus,
  className = '',
}) => {
  const currentState = currentStatus as WorkflowState;
  const currentIndex = ALL_WORKFLOW_STATES.indexOf(currentState);

  const items = ALL_WORKFLOW_STATES.map((state, index) => {
    const stage = WORKFLOW_STAGES[state];
    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex;
    const isLoopBoundary = stage.isLoopBoundary;

    let iconClass = 'w-1.5 h-1.5 rounded-full ';
    if (isCompleted) iconClass += 'bg-status-success';
    else if (isCurrent) iconClass += 'bg-accent-primary animate-pulse';
    else iconClass += 'bg-border-strong';

    return {
      id: stage.state,
      title: stage.shortLabel,
      description: isLoopBoundary
        ? `${stage.owningDepartmentCode} Dept (Loop Boundary)`
        : `${stage.owningDepartmentCode} Dept`,
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
