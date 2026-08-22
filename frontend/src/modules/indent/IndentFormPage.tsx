import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIndent, useCreateIndent, useUpdateIndent } from '../../api/services/indents/hooks';
import { IndentForm } from './components/IndentForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
export const IndentFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: indent, isLoading: isFetching } = useIndent(id || '');
  const { mutate: createIndent, isPending: isCreating } = useCreateIndent();
  const { mutate: updateIndent, isPending: isUpdating } = useUpdateIndent();

  const handleSubmit = (data: { indent: any; costSheet: any }) => {
    if (isEdit && id) {
      updateIndent(
        { id, payload: data },
        {
          onSuccess: () => navigate(`/indents/${id}`),
        },
      );
    } else {
      createIndent(data, {
        onSuccess: (newIndent) => {
          if (!newIndent || !newIndent.id) {
            throw new Error("Create transaction succeeded but no transaction ID was returned");
          }
          navigate(`/indents/${newIndent.id}`);
        },
        onError: (err: any) => {
          const errMsg = err.errors ? err.errors.join('\n') : err.message;
          alert(`Validation Error: ${errMsg}`);
          console.error('Backend validation failed:', err);
        },
      });
    }
  };

  if (isEdit && isFetching) {
    return <div className="flex justify-center p-12">Loading indent...</div>;
  }

  if (isEdit && indent && indent.currentState !== 'DRAFT') {
    return (
      <div className="bg-surface-card rounded-xl p-8 border border-border-default text-center space-y-4 max-w-lg mx-auto mt-12">
        <h2 className="text-xl font-bold text-text-primary">Indent Is Locked</h2>
        <p className="text-text-secondary text-sm">
          This indent has already been submitted (current status:{' '}
          {indent.currentState?.replace(/_/g, ' ')}). Design modifications are only permitted while
          the indent is in Draft status.
        </p>
        <Button variant="primary" onClick={() => navigate(`/indents/${id}`)}>
          View Indent Details
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/indents')} className="p-2">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEdit ? `Edit Indent ${indent?.indentNumber}` : 'Create New Indent'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isEdit
              ? 'Update the material requirements'
              : 'Define new material requirements for production'}
          </p>
        </div>
      </div>

      <IndentForm
        initialData={indent}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
};
