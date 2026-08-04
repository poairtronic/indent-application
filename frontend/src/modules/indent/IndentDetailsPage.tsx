import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIndent } from '../../api/services/indents/hooks';
import { IndentDetails } from './components/IndentDetails';
import { WorkflowActions } from './components/WorkflowActions';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';
import {
  getWorkflowStage,
  formatWorkflowState,
  getWorkflowStateTone,
  getWorkflowProgress,
} from '../../constants/workflow';
import { ArrowLeft, Edit, Printer, Copy, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { WorkflowState } from '../../constants/workflow';

export const IndentDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, show, dismiss } = useToasts();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data: indent, isLoading, refetch } = useIndent(id || '');

  const canEdit = hasPermission(AppPermission.INDENT_EDIT);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="flex items-center gap-3 text-text-muted">
          <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          Loading indent details...
        </div>
      </div>
    );
  }

  if (!indent) {
    return <div className="flex justify-center p-12 text-status-error">Indent not found.</div>;
  }

  const currentState = indent.currentState as WorkflowState;
  const stage = getWorkflowStage(currentState);
  const progress = getWorkflowProgress(currentState);
  const isDraft = currentState === 'DRAFT';
  const isCompleted = currentState === 'COMPLETED';

  const handleWorkflowSuccess = () => {
    show('success', 'Workflow action completed successfully.');
    refetch();
  };

  const handleDuplicate = () => {
    navigate('/indents/create', { state: { duplicateFrom: indent } });
  };

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/indents')} className="p-2">
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">Indent {indent.indentNumber}</h1>
              <Badge tone={getWorkflowStateTone(currentState)}>
                {formatWorkflowState(currentState)}
              </Badge>
            </div>
            <p className="text-sm text-text-secondary mt-1">{stage.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Printer size={16} />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicate}
            className="flex items-center gap-2"
          >
            <Copy size={16} />
            Duplicate
          </Button>
          {isDraft && canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/indents/${id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit size={16} />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Progress Bar */}
      <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-accent-primary" />
            <span className="text-sm font-bold text-text-primary">
              Workflow Progress -{' '}
              {stage.loop === 'MANUFACTURING_LOOP' ? 'Manufacturing Loop' : 'Financial Loop'}
            </span>
          </div>
          <span className="text-xs font-medium text-text-secondary">
            Step {progress.currentSequence} of {progress.totalSteps} ({progress.percentage}%)
          </span>
        </div>
        <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        {progress.isLoopBoundary && (
          <div className="flex items-center gap-1 mt-2">
            <CheckCircle size={12} className="text-status-success" />
            <span className="text-[10px] text-status-success font-medium">
              {stage.isTerminalState ? 'Transaction Closed' : 'Loop Boundary Reached'}
            </span>
          </div>
        )}
      </div>

      {/* Workflow Actions */}
      {!isCompleted && (
        <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-accent-primary" />
            <span className="text-sm font-bold text-text-primary">Available Actions</span>
          </div>
          <WorkflowActions
            currentState={currentState}
            indentId={indent.id}
            indentNumber={indent.indentNumber}
            onSuccess={handleWorkflowSuccess}
          />
        </div>
      )}

      {isCompleted && (
        <div className="bg-status-success/10 rounded-xl p-4 border border-status-success/20 flex items-center gap-3">
          <CheckCircle size={20} className="text-status-success" />
          <div>
            <p className="text-sm font-bold text-status-success">Transaction Completed</p>
            <p className="text-xs text-text-secondary">
              This business transaction has been fully completed and archived.
            </p>
          </div>
        </div>
      )}

      {/* Indent Details */}
      <IndentDetails indent={indent} />
    </div>
  );
};
