import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIndent, useSubmitIndent } from '../../api/services/indents/hooks';
import { IndentDetails } from './components/IndentDetails';
import { ArrowLeft, Edit, Printer, Copy, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ToastViewport, useToasts } from '../../components/ui/toast';
import { useAuthStore } from '../../store/authStore';
import { AppPermission } from '../../constants/permissions';

export const IndentDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, show, dismiss } = useToasts();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { data: indent, isLoading } = useIndent(id || '');
  const { mutateAsync: submitIndent, isPending: isSubmitting } = useSubmitIndent();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const canEdit = hasPermission(AppPermission.INDENT_EDIT);
  const canSubmit = hasPermission(AppPermission.INDENT_SUBMIT);

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

  const isDraft = indent.currentState === 'DRAFT';

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await submitIndent({ id });
      show('success', `Indent ${indent.indentNumber} submitted successfully.`);
      setShowSubmitDialog(false);
    } catch {
      show('error', 'Failed to submit indent. Please try again.');
    }
  };

  const handleDuplicate = () => {
    // Navigate to create with the current indent data as initial state
    navigate('/indents/create', { state: { duplicateFrom: indent } });
  };

  return (
    <div className="space-y-6">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/indents')} className="p-2">
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Indent {indent.indentNumber}</h1>
            <p className="text-sm text-text-secondary mt-1">
              View comprehensive details and workflow progress
            </p>
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
          {isDraft && canSubmit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSubmitDialog(true)}
              className="flex items-center gap-2"
            >
              <Send size={16} />
              Submit Design
            </Button>
          )}
        </div>
      </div>

      <IndentDetails indent={indent} />

      <ConfirmDialog
        open={showSubmitDialog}
        onCancel={() => setShowSubmitDialog(false)}
        onConfirm={handleSubmit}
        title={`Submit Indent: ${indent.indentNumber}`}
        message="This will submit the design for Stores processing. The indent will no longer be editable. Continue?"
        tone="primary"
        confirmLabel="Submit Design"
        loading={isSubmitting}
      />
    </div>
  );
};
