import React, { useState, useMemo } from 'react';
import { Layers, Plus, Search, Eye, Pencil, Trash2, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { MaterialFormModal } from './MaterialFormModal';
import type { MaterialData } from './MaterialFormModal';
import { MaterialDetailModal } from './MaterialDetailModal';
import { downloadFile } from '../../utils/download';

const INITIAL_MATERIALS: MaterialData[] = [
  {
    id: 'mat-201',
    materialCode: 'MAT-3001',
    materialName: 'Stainless Steel Sheet Grade 304 (2mm)',
    category: 'METALS',
    unitOfMeasure: 'KG',
    reorderPoint: 250,
    isActive: true,
  },
  {
    id: 'mat-202',
    materialCode: 'MAT-3002',
    materialName: 'Aluminum Alloy Bar 6061-T6',
    category: 'METALS',
    unitOfMeasure: 'KG',
    reorderPoint: 150,
    isActive: true,
  },
  {
    id: 'mat-203',
    materialCode: 'MAT-3003',
    materialName: 'High-Temp Insulated Copper Wire 2.5sqmm',
    category: 'ELECTRICAL',
    unitOfMeasure: 'METERS',
    reorderPoint: 500,
    isActive: true,
  },
  {
    id: 'mat-204',
    materialCode: 'MAT-3004',
    materialName: 'Industrial Polycarbonate Sheet Clear (5mm)',
    category: 'PLASTICS',
    unitOfMeasure: 'SHEETS',
    reorderPoint: 30,
    isActive: true,
  },
  {
    id: 'mat-205',
    materialCode: 'MAT-3005',
    materialName: 'M8 Stainless Steel Hex Bolts (50mm)',
    category: 'HARDWARE',
    unitOfMeasure: 'PCS',
    reorderPoint: 1000,
    isActive: true,
  },
];

export const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialData[]>(INITIAL_MATERIALS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingMat, setEditingMat] = useState<MaterialData | null>(null);
  const [detailMat, setDetailMat] = useState<MaterialData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialData | null>(null);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        !search.trim() ||
        m.materialName.toLowerCase().includes(search.toLowerCase()) ||
        m.materialCode.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || m.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [materials, search, categoryFilter]);

  const handleSaveMaterial = async (matData: MaterialData) => {
    if (matData.id) {
      setMaterials((prev) => prev.map((m) => (m.id === matData.id ? matData : m)));
    } else {
      const newMat: MaterialData = {
        ...matData,
        id: `mat-${Date.now()}`,
      };
      setMaterials((prev) => [newMat, ...prev]);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = (id: string) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m)));
  };

  const handleExportCSV = () => {
    const headers = [
      'Material Code',
      'Material Name',
      'Category',
      'UOM',
      'Reorder Point',
      'Status',
    ];
    const rows = filteredMaterials.map((m) => [
      m.materialCode,
      `"${m.materialName.replace(/"/g, '""')}"`,
      m.category,
      m.unitOfMeasure,
      m.reorderPoint.toString(),
      m.isActive ? 'ACTIVE' : 'INACTIVE',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, 'materials_master.csv', 'text/csv');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Raw Materials Master Catalog
          </h1>
          <p className="text-xs text-text-muted">
            Manage raw material classifications, inventory reorder thresholds, and stock UOMs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={16} />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingMat(null);
              setFormModalOpen(true);
            }}
          >
            Create Material
          </Button>
        </div>
      </div>

      {/* Controls Header: Search & Category Filter */}
      <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <Input
            id="matSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search material code or material description..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-background-primary border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="METALS">Metals & Steel</option>
              <option value="PLASTICS">Plastics & Polymers</option>
              <option value="ELECTRICAL">Electrical Wires</option>
              <option value="HARDWARE">Hardware</option>
              <option value="CHEMICALS">Chemicals</option>
            </select>
          </div>

          <span className="text-xs text-text-muted font-medium">
            Items: <strong className="text-text-primary">{filteredMaterials.length}</strong>
          </span>
        </div>
      </div>

      {/* Materials Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => (
          <div
            key={mat.id}
            className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card hover:border-border-strong transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary shrink-0">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-text-primary tracking-tight">
                      {mat.materialName}
                    </h3>
                    <span className="text-[10px] font-mono text-text-muted font-semibold">
                      CODE: {mat.materialCode}
                    </span>
                  </div>
                </div>

                <Badge tone={mat.isActive ? 'green' : 'gray'}>
                  {mat.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between items-center text-text-muted">
                  <span>Category:</span>
                  <span className="font-semibold text-text-primary">{mat.category}</span>
                </div>
                <div className="flex justify-between items-center text-text-muted">
                  <span>Reorder Threshold:</span>
                  <span className="font-bold text-status-warning">
                    {mat.reorderPoint} {mat.unitOfMeasure}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border-default/50 flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(mat.id!)}
                className={`text-[11px] font-semibold hover:underline ${
                  mat.isActive ? 'text-status-warning' : 'text-status-success'
                }`}
              >
                {mat.isActive ? 'Deactivate' : 'Activate'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDetailMat(mat)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
                  title="View Specs"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditingMat(mat);
                    setFormModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
                  title="Edit Material"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(mat)}
                  className="p-1.5 rounded-lg text-status-error/80 hover:text-status-error hover:bg-status-error/10"
                  title="Delete Material"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals & Dialogs */}
      <MaterialFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSaveMaterial}
        initialData={editingMat}
      />

      <MaterialDetailModal
        open={Boolean(detailMat)}
        onClose={() => setDetailMat(null)}
        material={detailMat}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Material: ${deleteTarget?.materialName}`}
        message="Are you sure you want to remove this raw material item from the master catalog?"
        tone="danger"
        confirmLabel="Delete Material"
      />
    </div>
  );
};
