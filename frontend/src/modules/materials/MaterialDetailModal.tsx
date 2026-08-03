import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Layers, AlertCircle, Tag } from 'lucide-react';
import type { MaterialData } from './MaterialFormModal';

interface MaterialDetailModalProps {
  open: boolean;
  onClose: () => void;
  material: MaterialData | null;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  open,
  onClose,
  material,
}) => {
  if (!material) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Raw Material: ${material.materialName}`}
      description="Material master specifications and inventory parameters"
      size="md"
    >
      <div className="space-y-4 font-sans text-xs">
        <div className="bg-surface-card border border-border-default rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Layers size={18} />
              </div>
              <div>
                <span className="font-bold text-sm text-text-primary block">
                  {material.materialName}
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  CODE: {material.materialCode}
                </span>
              </div>
            </div>

            <Badge tone={material.isActive ? 'green' : 'gray'}>
              {material.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border-default/50 pt-3">
          <div className="p-3 bg-background-primary/50 border border-border-default rounded-xl space-y-1">
            <span className="text-text-muted flex items-center gap-1 font-semibold text-[11px]">
              <Tag size={12} className="text-accent-primary" /> Category & UOM:
            </span>
            <span className="font-bold text-text-primary block text-xs">
              {material.category} ({material.unitOfMeasure})
            </span>
          </div>

          <div className="p-3 bg-background-primary/50 border border-border-default rounded-xl space-y-1">
            <span className="text-text-muted flex items-center gap-1 font-semibold text-[11px]">
              <AlertCircle size={12} className="text-status-warning" /> Reorder Point:
            </span>
            <span className="font-bold text-status-warning block text-xs">
              {material.reorderPoint} {material.unitOfMeasure}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
