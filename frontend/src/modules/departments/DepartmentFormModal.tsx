import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export interface DepartmentData {
  id?: string;
  departmentName: string;
  departmentCode: string;
  headOfDepartment?: string;
  isActive: boolean;
  memberCount?: number;
}

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dept: DepartmentData) => Promise<void>;
  initialData?: DepartmentData | null;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [headOfDepartment, setHeadOfDepartment] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setDepartmentName(initialData.departmentName);
      setDepartmentCode(initialData.departmentCode);
      setHeadOfDepartment(initialData.headOfDepartment || '');
      setIsActive(initialData.isActive);
    } else {
      setDepartmentName('');
      setDepartmentCode('');
      setHeadOfDepartment('');
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim() || !departmentCode.trim()) {
      setError('Department Name and Code are required.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        id: initialData?.id,
        departmentName: departmentName.trim(),
        departmentCode: departmentCode.trim().toUpperCase(),
        headOfDepartment: headOfDepartment.trim(),
        isActive,
        memberCount: initialData?.memberCount || 0,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Department' : 'Create New Operating Department'}
      description="Define organizational department parameters and head assignment"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-status-error font-medium">
            {error}
          </div>
        )}

        <Input
          id="deptName"
          label="Department Name"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          placeholder="e.g. Design & Technical"
          required
        />

        <Input
          id="deptCode"
          label="Department Code"
          value={departmentCode}
          onChange={(e) => setDepartmentCode(e.target.value)}
          placeholder="e.g. DES-01"
          required
        />

        <Input
          id="deptHead"
          label="Head of Department (HOD)"
          value={headOfDepartment}
          onChange={(e) => setHeadOfDepartment(e.target.value)}
          placeholder="e.g. Rajesh Sharma"
        />

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="deptActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
          />
          <label htmlFor="deptActive" className="font-semibold text-text-primary cursor-pointer">
            Active Operating Status
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border-default/50">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={loading} type="submit">
            {initialData ? 'Update Department' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
