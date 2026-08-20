import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export interface MaterialData {
  id?: string;
  materialCode: string;
  materialName: string;
  category: string;
  unitOfMeasure: string;
  unitOfMeasureLabel?: string;
  densityKgPerDm3?: number;
  isActive: boolean;
}

interface UnitOption {
  id: string;
  label: string;
  symbol: string;
}

interface MaterialFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (material: MaterialData) => Promise<void>;
  initialData?: MaterialData | null;
  unitOptions?: UnitOption[];
}

// Removed hardcoded default units that caused invalid UUID validation errors

export const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  unitOptions,
}) => {
  const units = unitOptions || [];

  const [materialCode, setMaterialCode] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [category, setCategory] = useState('METALS');
  const [unitOfMeasure, setUnitOfMeasure] = useState(units[0]?.id ?? '');
  const [densityKgPerDm3, setDensityKgPerDm3] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setMaterialCode(initialData.materialCode);
      setMaterialName(initialData.materialName);
      setCategory(initialData.category);
      setUnitOfMeasure(initialData.unitOfMeasure);
      setDensityKgPerDm3(initialData.densityKgPerDm3 ?? '');
      setIsActive(initialData.isActive);
    } else {
      setMaterialCode('');
      setMaterialName('');
      setCategory('METALS');
      setUnitOfMeasure(units[0]?.id ?? '');
      setDensityKgPerDm3('');
      setIsActive(true);
    }
    setError(null);
  }, [initialData, open, units]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialCode.trim() || !materialName.trim()) {
      setError('Material Code and Name are required.');
      return;
    }
    if (!unitOfMeasure) {
      setError('A valid Unit of Measure is required. Please create one first in the Units module.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        id: initialData?.id,
        materialCode: materialCode.trim().toUpperCase(),
        materialName: materialName.trim(),
        category,
        unitOfMeasure,
        densityKgPerDm3: densityKgPerDm3 === '' ? undefined : Number(densityKgPerDm3),
        isActive,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save material';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Raw Material' : 'Create New Material Master'}
      description="Define raw material item, category classification, and density for shape-based weight calculation"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-status-error font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="matCode"
            label="Material Code"
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            placeholder="e.g. MAT-3001"
            required
          />

          <Input
            id="matName"
            label="Material Name"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            placeholder="e.g. Stainless Steel Sheet Grade 304"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="matCat" className="block text-xs font-semibold text-text-primary mb-1">
              Category
            </label>
            <select
              id="matCat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="METALS">Metals & Steel</option>
              <option value="PLASTICS">Plastics & Polymers</option>
              <option value="ELECTRICAL">Electrical Wires</option>
              <option value="HARDWARE">Fasteners & Hardware</option>
              <option value="CHEMICALS">Chemicals & Paints</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div>
            <label htmlFor="matUom" className="block text-xs font-semibold text-text-primary mb-1">
              Unit of Measure
            </label>
            <select
              id="matUom"
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
              disabled={units.length === 0}
            >
              {units.length === 0 && <option value="">No Units Available</option>}
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.symbol} ({u.label})
                </option>
              ))}
            </select>
          </div>

          <Input
            id="densityKgPerDm3"
            label="Density (kg/dm³)"
            type="number"
            step="0.0001"
            value={densityKgPerDm3}
            onChange={(e) => setDensityKgPerDm3(e.target.value ? Number(e.target.value) : '')}
            placeholder="e.g. 7.8500"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="matActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
          />
          <label htmlFor="matActive" className="font-semibold text-text-primary cursor-pointer">
            Active Operating Material
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border-default/50">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={loading} type="submit">
            {initialData ? 'Update Material' : 'Create Material'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
