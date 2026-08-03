import React, { useState, useMemo } from 'react';
import { Building2, Plus, Search, Eye, Pencil, Trash2, Users, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DepartmentFormModal } from './DepartmentFormModal';
import type { DepartmentData } from './DepartmentFormModal';
import { DepartmentDetailModal } from './DepartmentDetailModal';

const INITIAL_DEPARTMENTS: DepartmentData[] = [
  {
    id: 'dept-1',
    departmentName: 'Design & Technical',
    departmentCode: 'DES-01',
    headOfDepartment: 'Rajesh Sharma',
    isActive: true,
    memberCount: 14,
  },
  {
    id: 'dept-2',
    departmentName: 'Stores & Inventory',
    departmentCode: 'STR-02',
    headOfDepartment: 'Amit Verma',
    isActive: true,
    memberCount: 22,
  },
  {
    id: 'dept-3',
    departmentName: 'Production & Shopfloor',
    departmentCode: 'PRD-03',
    headOfDepartment: 'Suresh Kumar',
    isActive: true,
    memberCount: 45,
  },
  {
    id: 'dept-4',
    departmentName: 'Accounts & Finance',
    departmentCode: 'ACC-04',
    headOfDepartment: 'Priya Mehta',
    isActive: true,
    memberCount: 8,
  },
  {
    id: 'dept-5',
    departmentName: 'Quality Control',
    departmentCode: 'QC-05',
    headOfDepartment: 'Vikas Patel',
    isActive: true,
    memberCount: 11,
  },
];

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentData[]>(INITIAL_DEPARTMENTS);
  const [search, setSearch] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentData | null>(null);
  const [detailDept, setDetailDept] = useState<DepartmentData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentData | null>(null);

  const filteredDepartments = useMemo(() => {
    if (!search.trim()) return departments;
    const term = search.toLowerCase();
    return departments.filter(
      (d) =>
        d.departmentName.toLowerCase().includes(term) ||
        d.departmentCode.toLowerCase().includes(term) ||
        (d.headOfDepartment && d.headOfDepartment.toLowerCase().includes(term)),
    );
  }, [departments, search]);

  const handleSaveDepartment = async (deptData: DepartmentData) => {
    if (deptData.id) {
      setDepartments((prev) => prev.map((d) => (d.id === deptData.id ? deptData : d)));
    } else {
      const newDept: DepartmentData = {
        ...deptData,
        id: `dept-${Date.now()}`,
      };
      setDepartments((prev) => [newDept, ...prev]);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = (id: string) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d)));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Operating Departments Management
          </h1>
          <p className="text-xs text-text-muted">
            Configure business units, head of department assignments, and organizational structures
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingDept(null);
            setFormModalOpen(true);
          }}
        >
          Create Department
        </Button>
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-surface-card border border-border-default rounded-xl p-4 shadow-card">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <Input
            id="deptSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department name, code, or HOD..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
          <span>Operating Units:</span>
          <span className="font-bold text-text-primary bg-background-secondary px-2 py-1 rounded border border-border-default">
            {departments.length} Units
          </span>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartments.map((dept) => (
          <div
            key={dept.id}
            className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card hover:border-border-strong transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-text-primary tracking-tight">
                      {dept.departmentName}
                    </h3>
                    <span className="text-[10px] font-mono text-text-muted font-semibold">
                      CODE: {dept.departmentCode}
                    </span>
                  </div>
                </div>

                <Badge tone={dept.isActive ? 'green' : 'gray'}>
                  {dept.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <UserCheck size={14} className="text-accent-primary" /> HOD:
                  </span>
                  <span className="font-bold text-text-primary">
                    {dept.headOfDepartment || 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-accent-primary" /> Active Personnel:
                  </span>
                  <span className="font-semibold text-text-primary">
                    {dept.memberCount || 0} Members
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border-default/50 flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(dept.id!)}
                className={`text-[11px] font-semibold hover:underline ${
                  dept.isActive ? 'text-status-warning' : 'text-status-success'
                }`}
              >
                {dept.isActive ? 'Deactivate' : 'Activate'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDetailDept(dept)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors"
                  title="View Department Details"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditingDept(dept);
                    setFormModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors"
                  title="Edit Department"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(dept)}
                  className="p-1.5 rounded-lg text-status-error/80 hover:text-status-error hover:bg-status-error/10 transition-colors"
                  title="Delete Department"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals & Dialogs */}
      <DepartmentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSaveDepartment}
        initialData={editingDept}
      />

      <DepartmentDetailModal
        isOpen={Boolean(detailDept)}
        onClose={() => setDetailDept(null)}
        department={detailDept}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Department: ${deleteTarget?.departmentName}`}
        message="Are you sure you want to delete this department? Members assigned to this department will require re-assignment."
        tone="danger"
        confirmLabel="Delete Department"
      />
    </div>
  );
};
