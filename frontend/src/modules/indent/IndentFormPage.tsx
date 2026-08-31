import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUnits } from '../../api/services/units/hooks';
import { useProcesses } from '../../api/services/processes/hooks';
import { useMaterials } from '../../api/services/materials/hooks';
import { useProducts } from '../../api/services/products/hooks';
import { useVendors } from '../../api/services/vendors/hooks';
import { useIndent, useCreateIndent, useUpdateIndent } from '../../api/services/indents/hooks';
import { IndentForm } from './components/IndentForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToasts } from '../../components/ui/toast';

export const IndentFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { show } = useToasts();

  const { data: indent, isLoading: isFetching } = useIndent(id || '');

  // PARALLELIZE MASTER DATA FETCHING (Eliminates waterfall when rendering IndentForm)
  useUnits({ page: 1, limit: 1000 });
  useProcesses({ page: 1, limit: 1000 });
  useMaterials({ page: 1, limit: 1000 });
  useProducts({ page: 1, limit: 1000 });
  useVendors({ page: 1, limit: 1000 });
  const { mutate: createIndent, isPending: isCreating } = useCreateIndent();
  const { mutate: updateIndent, isPending: isUpdating } = useUpdateIndent();

  const handleSubmit = (data: { indent: any; costSheet: any }) => {
    if (isEdit && id) {
      updateIndent(
        { id, payload: data },
        {
          onSuccess: () => {
            show('success', 'Indent updated successfully!');
            navigate(`/indents/${id}`);
          },
          onError: (err: any) => {
            let errMsg = 'An unknown error occurred';
            if (err.errors && Array.isArray(err.errors)) {
              errMsg = err.errors.join('\n');
            } else if (Array.isArray(err.message)) {
              errMsg = err.message.join('\n');
            } else if (err.message) {
              errMsg = err.message;
            }
            show('error', `Update Failed: ${errMsg}`);
            console.error('Update failed:', err);
          },
        },
      );
    } else {
      createIndent(data, {
        onSuccess: (newIndent: any) => {
          // Robust extraction of ID since backend might return { id }, { data: { id } }, or just ID string.
          let targetId = '';
          if (newIndent && typeof newIndent === 'object') {
            targetId = newIndent.id || (newIndent.data && newIndent.data.id);
          } else if (typeof newIndent === 'string') {
            targetId = newIndent;
          }

          if (!targetId) {
            console.error('Create transaction succeeded but no valid transaction ID was returned.');
            return;
          }
          show('success', 'Indent created successfully!');
          navigate(`/indents/${targetId}`);
        },
        onError: (err: any) => {
          let errMsg = 'An unknown error occurred';
          if (err.errors && Array.isArray(err.errors)) {
            errMsg = err.errors.join('\n');
          } else if (Array.isArray(err.message)) {
            errMsg = err.message.join('\n');
          } else if (err.message) {
            errMsg = err.message;
          }
          show('error', `Validation Error: ${errMsg}`);
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
