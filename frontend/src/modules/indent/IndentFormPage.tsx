import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIndent, useCreateIndent, useUpdateIndent } from '../../hooks/useIndents';
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
        onSuccess: (newIndent) => navigate(`/indents/${newIndent.id}`),
      });
    }
  };

  if (isEdit && isFetching) {
    return <div className="flex justify-center p-12">Loading indent...</div>;
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
