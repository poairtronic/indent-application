import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Button } from '../../components/ui/Button';

export interface ProductData {
  id?: string;
  productCode: string;
  productName: string;
  category: string;
  unitOfMeasure: string;
  estimatedCost: number;
  description?: string;
  isActive: boolean;
}

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (product: ProductData) => Promise<void>;
  initialData?: ProductData | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('ELECTRICAL');
  const [unitOfMeasure, setUnitOfMeasure] = useState('PCS');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setProductCode(initialData.productCode);
      setProductName(initialData.productName);
      setCategory(initialData.category);
      setUnitOfMeasure(initialData.unitOfMeasure);
      setEstimatedCost(initialData.estimatedCost);
      setDescription(initialData.description || '');
      setIsActive(initialData.isActive);
    } else {
      setProductCode('');
      setProductName('');
      setCategory('ELECTRICAL');
      setUnitOfMeasure('PCS');
      setEstimatedCost(0);
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productCode.trim() || !productName.trim()) {
      setError('Product Code and Name are required.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        id: initialData?.id,
        productCode: productCode.trim().toUpperCase(),
        productName: productName.trim(),
        category,
        unitOfMeasure,
        estimatedCost: Number(estimatedCost) || 0,
        description: description.trim(),
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Product Specification' : 'Create New Product Master'}
      description="Define manufacturing catalog item, SKU, category, and base estimation"
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
            id="productCode"
            label="Product SKU / Code"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="e.g. AGIPL-PRD-001 (Auto-generated if blank)"
          />

          <Input
            id="productName"
            label="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Industrial Control Panel Box"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="category"
              className="block text-xs font-semibold text-text-primary mb-1"
            >
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="ELECTRICAL">Electrical</option>
              <option value="MECHANICAL">Mechanical</option>
              <option value="HARDWARE">Hardware</option>
              <option value="ASSEMBLY">Assembly</option>
              <option value="CUSTOM">Custom Engineering</option>
            </select>
          </div>

          <div>
            <label htmlFor="uom" className="block text-xs font-semibold text-text-primary mb-1">
              Unit of Measure
            </label>
            <select
              id="uom"
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="PCS">PCS (Pieces)</option>
              <option value="SETS">SETS (Sets)</option>
              <option value="BOX">BOX (Boxes)</option>
              <option value="KG">KG (Kilograms)</option>
              <option value="METERS">METERS (Meters)</option>
            </select>
          </div>

          <Input
            id="estimatedCost"
            label="Base Cost Est. (INR)"
            type="number"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(Number(e.target.value))}
            placeholder="e.g. 12500"
          />
        </div>

        <TextArea
          id="description"
          label="Technical Specifications & Notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter CAD references, material specs, or process notes..."
          rows={3}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="productActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-border-default text-accent-primary focus:ring-accent-primary"
          />
          <label htmlFor="productActive" className="font-semibold text-text-primary cursor-pointer">
            Active Catalog Item
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border-default/50">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={loading} type="submit">
            {initialData ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
