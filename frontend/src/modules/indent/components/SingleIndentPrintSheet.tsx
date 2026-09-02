import React from 'react';
import type { IndentData } from '../../../api/services/indents/service';
import {
  PrintDocument,
  PrintHeader,
  PrintTable,
  PrintTotals,
  PrintFooter,
  type PrintColumn,
  type SignatureBlock,
} from '../../../components/print';
import { parseItemRemarks, parseIndentRemarks } from './IndentForm';
import { useAuthStore } from '../../../store/authStore';

export interface SingleIndentPrintSheetProps {
  indent: IndentData;
}

export const SingleIndentPrintSheet: React.FC<SingleIndentPrintSheetProps> = ({ indent }) => {
  const user = useAuthStore((s) => s.user);
  const canViewCostSheet =
    user?.permissions.includes('costsheet.view') || user?.permissions.includes('settings.manage');

  const parsedIndent = parseIndentRemarks(indent.remarks);
  const formattedRequiredDate = indent.requiredDate
    ? new Date(indent.requiredDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const formattedCreatedDate = indent.createdAt
    ? new Date(indent.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  // 1. Materials Columns
  const materialColumns: PrintColumn<any>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '30px', align: 'center' },
    {
      header: 'Part / Product Name',
      accessor: (item) => {
        const parsed = parseItemRemarks(item.remarks);
        return <span className="font-semibold text-gray-900">{parsed.product || '—'}</span>;
      },
      width: '25%',
    },
    {
      header: 'Material Specification',
      accessor: (item) => (
        <div>
          <span className="font-medium text-gray-900">
            {item.material?.materialName || item.materialId || '—'}
          </span>
          {item.material?.materialCode && (
            <span className="block text-[8pt] text-gray-500 font-mono">
              {item.material.materialCode}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Shape & Dimensions',
      accessor: (item) => {
        const parsed = parseItemRemarks(item.remarks);
        if (parsed.size) return parsed.size;
        return 'Standard';
      },
      width: '18%',
    },
    {
      header: 'Qty',
      accessor: (item) => (
        <span className="font-bold">
          {item.quantity} {item.unit?.symbol || item.unit?.unitName || ''}
        </span>
      ),
      align: 'right',
      width: '10%',
    },
    {
      header: 'Weight (kg)',
      accessor: (item) => {
        const parsed = parseItemRemarks(item.remarks);
        return <span className="font-mono font-medium">{parsed.weight || '—'}</span>;
      },
      align: 'right',
      width: '12%',
    },
    {
      header: 'Issue Status',
      accessor: (item) => (
        <span className="text-[8pt] font-semibold text-gray-700">
          {item.status?.replace(/_/g, ' ') || 'PENDING'}
        </span>
      ),
      align: 'center',
      width: '12%',
    },
  ];

  // 2. Processes Columns
  const allProcesses = (indent.items || []).flatMap((item, itemIdx) => {
    const itemParsed = parseItemRemarks(item.remarks);
    return (item.indentProcesses || []).map((proc: any, pIdx: number) => ({
      itemNumber: itemIdx + 1,
      productName: itemParsed.product || `Item #${itemIdx + 1}`,
      processName: proc.process?.processName || 'Process',
      sequence: proc.sequence || pIdx + 1,
      estimatedHours: proc.estimatedHours ? `${proc.estimatedHours} hrs` : '—',
      source: itemParsed.processSources?.[pIdx] || 'In-House',
    }));
  });

  const processColumns: PrintColumn<any>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '30px', align: 'center' },
    { header: 'Part / Product', accessor: (p) => p.productName, width: '25%' },
    { header: 'Process Operation', accessor: (p) => p.processName, width: '30%' },
    { header: 'Seq', accessor: (p) => p.sequence, align: 'center', width: '50px' },
    { header: 'Est. Duration', accessor: (p) => p.estimatedHours, align: 'right', width: '15%' },
    { header: 'Source / Vendor', accessor: (p) => p.source, width: '20%' },
  ];

  // 3. Brought-Out Materials Columns
  const broughtMaterialColumns: PrintColumn<any>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '30px', align: 'center' },
    {
      header: 'Item Description',
      accessor: (bm) => <span className="font-semibold">{bm.name || bm.materialName || '—'}</span>,
      width: '40%',
    },
    {
      header: 'Quantity',
      accessor: (bm) => `${bm.quantity} ${bm.unit?.symbol || bm.unit?.unitName || ''}`,
      align: 'right',
      width: '20%',
    },
    {
      header: 'Expected Delivery',
      accessor: (bm) =>
        bm.expectedDeliveryDate
          ? new Date(bm.expectedDeliveryDate).toLocaleDateString('en-GB')
          : '—',
      align: 'center',
      width: '20%',
    },
    {
      header: 'Status',
      accessor: (bm) => bm.status?.replace(/_/g, ' ') || 'PENDING',
      align: 'center',
      width: '15%',
    },
  ];

  // 4. Department Signatures Block
  const signatures: SignatureBlock[] = [
    {
      title: 'Design Authorized',
      department: 'DESIGN DEPT',
      name: indent.creatorName || undefined,
      date: formattedCreatedDate,
    },
    {
      title: 'Stock Verified & Issued',
      department: 'STORES DEPT',
    },
    {
      title: 'Production Received',
      department: 'PRODUCTION DEPT',
    },
    {
      title: 'Financial Cost Verified',
      department: 'ACCOUNTS DEPT',
    },
  ];

  // Calculate totals
  const totalWeight = (indent.items || []).reduce((acc, curr) => {
    const parsed = parseItemRemarks(curr.remarks);
    return acc + (Number(parsed.weight) || 0);
  }, 0);
  const totalItemsCount = (indent.items || []).reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0),
    0,
  );

  return (
    <PrintDocument orientation="portrait">
      {/* Enterprise Header */}
      <PrintHeader
        moduleName="MANUFACTURING INDENT SHEET"
        reportTitle={`Indent Order: ${indent.indentNumber}`}
        documentNumber={indent.indentNumber}
        subtitle={`Purpose / PO: ${indent.purpose || 'N/A'}`}
        customMetadata={[
          { label: 'Customer', value: indent.customerName || parsedIndent.customerName || 'N/A' },
          { label: 'Layout No.', value: indent.layoutNumber || parsedIndent.layoutNumber || 'N/A' },
          { label: 'Department', value: indent.departmentName || 'Administration' },
          { label: 'Priority', value: indent.priority || 'MEDIUM' },
          { label: 'Required By', value: formattedRequiredDate },
          { label: 'Workflow State', value: indent.currentState?.replace(/_/g, ' ') || 'DRAFT' },
          { label: 'Created By', value: indent.creatorName || 'Design Team' },
          { label: 'Created Date', value: formattedCreatedDate },
        ]}
      />

      {/* User Remarks if any */}
      {parsedIndent.userRemarks && (
        <div className="mb-4 p-2.5 bg-gray-50 border border-gray-200 rounded text-xs print-break-inside-avoid">
          <span className="font-bold text-gray-700 block text-[9px] uppercase tracking-wider">
            Special Instructions / Indent Remarks:
          </span>
          <p className="text-gray-800 mt-0.5">{parsedIndent.userRemarks}</p>
        </div>
      )}

      {/* Section 1: Raw Materials & Components */}
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 pb-0.5 border-b border-gray-400">
          1. Raw Material Requirements & Bill of Materials
        </h3>
        <PrintTable columns={materialColumns} data={indent.items || []} />
      </div>

      {/* Section 2: Manufacturing Processes */}
      {allProcesses.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 pb-0.5 border-b border-gray-400">
            2. Manufacturing Process Sequence & Operations
          </h3>
          <PrintTable columns={processColumns} data={allProcesses} />
        </div>
      )}

      {/* Section 3: Brought-Out Items */}
      {indent.broughtMaterials && indent.broughtMaterials.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 pb-0.5 border-b border-gray-400">
            3. Brought-Out Components & Hardware
          </h3>
          <PrintTable columns={broughtMaterialColumns} data={indent.broughtMaterials} />
        </div>
      )}

      {/* Section 4: Quantitative & Costing Summary */}
      <PrintTotals
        notes="All materials must be inspected according to engineering specifications and ISO quality tolerances prior to production release."
        rows={[
          { label: 'Total Component Lines', value: (indent.items || []).length },
          { label: 'Total Output Quantity', value: `${totalItemsCount} units` },
          { label: 'Total Gross Weight', value: `${totalWeight.toFixed(2)} kg`, highlight: true },
          ...(canViewCostSheet && indent.costSheet
            ? [
                {
                  label: 'Estimated Material Cost',
                  value: `₹${(Number(indent.costSheet.predictedTotal) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                },
                {
                  label: 'Total Estimated Cost',
                  value: `₹${(Number(indent.costSheet.predictedTotal) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  highlight: true,
                },
              ]
            : []),
        ]}
      />

      {/* Sign-off and Footer */}
      <PrintFooter signatures={signatures} />
    </PrintDocument>
  );
};
