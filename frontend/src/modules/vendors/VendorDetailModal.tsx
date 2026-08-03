import React from 'react';
import { Pencil, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/date';
import type { VendorResponse, VendorStatus } from '../../types/vendor';

export const vendorStatusTone: Record<VendorStatus, BadgeTone> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  PENDING_APPROVAL: 'yellow',
  BLACKLISTED: 'red',
};

export const vendorStatusLabel: Record<VendorStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING_APPROVAL: 'Pending Approval',
  BLACKLISTED: 'Blacklisted',
};

interface VendorDetailModalProps {
  open: boolean;
  vendor: VendorResponse | null;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: (vendor: VendorResponse) => void;
  onDelete: (vendor: VendorResponse) => void;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 border-b border-border-default last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted sm:w-36 shrink-0">
      {label}
    </span>
    <span className="text-sm text-text-primary break-words">{value || '-'}</span>
  </div>
);

export const VendorDetailModal: React.FC<VendorDetailModalProps> = ({
  open,
  vendor,
  canUpdate,
  canDelete,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!vendor) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vendor Details"
      description={vendor.vendorName}
      size="lg"
      footer={
        <>
          {canUpdate && (
            <Button variant="primary" icon={<Pencil size={14} />} onClick={() => onEdit(vendor)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={() => onDelete(vendor)}>
              Delete
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center gap-4 pb-4 border-b border-border-default">
        <div className="w-14 h-14 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-semibold text-lg ring-1 ring-border-default">
          {vendor.vendorName.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-text-primary">{vendor.vendorName}</span>
            <Badge tone={vendorStatusTone[vendor.status]}>{vendorStatusLabel[vendor.status]}</Badge>
          </div>
          <div className="text-sm text-text-muted">{vendor.vendorCode}</div>
        </div>
      </div>

      <div className="mt-3">
        <DetailRow
          label="Email"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Mail size={13} className="text-text-muted" /> {vendor.email}
            </span>
          }
        />
        <DetailRow
          label="Phone"
          value={
            vendor.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={13} className="text-text-muted" /> {vendor.phone}
              </span>
            ) : (
              '-'
            )
          }
        />
        <DetailRow label="GST Number" value={vendor.gstNumber || '-'} />
        <DetailRow label="PAN Number" value={vendor.panNumber || '-'} />
        <DetailRow
          label="Address"
          value={
            <span className="inline-flex items-start gap-1.5">
              <MapPin size={13} className="text-text-muted mt-0.5" />
              <span>
                {vendor.address}, {vendor.city}, {vendor.state}, {vendor.country} - {vendor.pincode}
              </span>
            </span>
          }
        />
        <DetailRow label="Created" value={formatDateTime(vendor.createdAt)} />
        <DetailRow label="Last Updated" value={formatDateTime(vendor.updatedAt)} />
      </div>
    </Modal>
  );
};
