import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useCurrencyFormatter } from '../../utils/currencyFormatter';
import { Package, Tag, Coins } from 'lucide-react';
import type { ProductData } from './ProductFormModal';

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductData | null;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  open,
  onClose,
  product,
}) => {
  const formatCurrency = useCurrencyFormatter({ maximumFractionDigits: 0 });

  if (!product) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Product Specification: ${product.productName}`}
      description="Manufacturing SKU metadata and technical parameters"
      size="md"
    >
      <div className="space-y-4 font-sans text-xs">
        <div className="bg-surface-card border border-border-default rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Package size={18} />
              </div>
              <div>
                <span className="font-bold text-sm text-text-primary block">
                  {product.productName}
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  SKU: {product.productCode}
                </span>
              </div>
            </div>

            <Badge tone={product.isActive ? 'green' : 'gray'}>
              {product.isActive ? 'ACTIVE' : 'ARCHIVED'}
            </Badge>
          </div>

          <p className="text-text-secondary leading-relaxed">
            {product.description || 'No detailed technical specifications provided.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border-default/50 pt-3">
          <div className="p-3 bg-background-primary/50 border border-border-default rounded-xl space-y-1">
            <span className="text-text-muted flex items-center gap-1 font-semibold text-[11px]">
              <Tag size={12} className="text-accent-primary" /> Category & Unit:
            </span>
            <span className="font-bold text-text-primary block text-xs">
              {product.category} ({product.unitOfMeasure})
            </span>
          </div>

          <div className="p-3 bg-background-primary/50 border border-border-default rounded-xl space-y-1">
            <span className="text-text-muted flex items-center gap-1 font-semibold text-[11px]">
              <Coins size={12} className="text-status-success" /> Base Estimated Cost:
            </span>
            <span className="font-bold text-status-success block text-xs">
              {formatCurrency(product.estimatedCost)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
