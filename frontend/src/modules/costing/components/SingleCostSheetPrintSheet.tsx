import React from 'react';
import type { IndentData } from '../../../api/services/indents/service';
import {
  PrintDocument,
  PrintHeader,
  PrintSummary,
  PrintTable,
  PrintTotals,
  PrintFooter,
  type PrintColumn,
  type SummaryMetric,
  type SignatureBlock,
} from '../../../components/print';

export interface SingleCostSheetPrintSheetProps {
  indent: IndentData;
}

export const SingleCostSheetPrintSheet: React.FC<SingleCostSheetPrintSheetProps> = ({ indent }) => {
  const cs = indent.costSheet;
  const isActualAvailable =
    indent.currentState === 'ACTUAL_COST_UPDATED' ||
    indent.currentState === 'ACCOUNTS_FINANCIAL_CLOSURE' ||
    indent.currentState === 'ARCHIVED' ||
    indent.currentState === 'COMPLETED';

  // 1. Material Items Table
  const costItemColumns: PrintColumn<any>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '30px', align: 'center' },
    {
      header: 'Material Name / Spec',
      accessor: (item) => (
        <div>
          <span className="font-semibold">
            {item.material?.materialName || item.materialId || '—'}
          </span>
          {item.material?.materialCode && (
            <span className="block text-[7pt] text-gray-500 font-mono">
              {item.material.materialCode}
            </span>
          )}
        </div>
      ),
      width: '26%',
    },
    {
      header: 'Est. Qty',
      accessor: (item) => item.predictedQuantity || '0',
      align: 'right',
      width: '10%',
    },
    {
      header: 'Est. Rate (₹)',
      accessor: (item) =>
        (Number(item.predictedRate) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      align: 'right',
      width: '12%',
    },
    {
      header: 'Est. Total (₹)',
      accessor: (item) =>
        (Number(item.predictedAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      align: 'right',
      width: '14%',
    },
    ...(isActualAvailable
      ? [
          {
            header: 'Act. Rate (₹)',
            accessor: (item: any) =>
              item.actualRate !== null && item.actualRate !== undefined
                ? Number(item.actualRate).toLocaleString(undefined, { minimumFractionDigits: 2 })
                : '—',
            align: 'right' as const,
            width: '12%',
          },
          {
            header: 'Act. Total (₹)',
            accessor: (item: any) =>
              item.actualAmount !== null && item.actualAmount !== undefined
                ? Number(item.actualAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })
                : '—',
            align: 'right' as const,
            width: '14%',
          },
          {
            header: 'Var (₹)',
            accessor: (item: any) => {
              const pred = Number(item.predictedAmount) || 0;
              const act = Number(item.actualAmount) || 0;
              const diff = act - pred;
              return (
                <span
                  className={`font-mono font-bold ${diff > 0 ? 'text-gray-900' : 'text-gray-700'}`}
                >
                  {diff !== 0 ? (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)) : '0.00'}
                </span>
              );
            },
            align: 'right' as const,
            width: '12%',
          },
        ]
      : []),
  ];

  // 2. Process Costs Table
  const processCostColumns: PrintColumn<any>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '30px', align: 'center' },
    {
      header: 'Manufacturing Process',
      accessor: (pc) => (
        <span className="font-semibold">{pc.process?.processName || 'Process'}</span>
      ),
      width: '30%',
    },
    {
      header: 'Est. Hours',
      accessor: (pc) => `${pc.estimatedHours || 0} hrs`,
      align: 'right',
      width: '15%',
    },
    {
      header: 'Est. Cost (₹)',
      accessor: (pc) =>
        (Number(pc.predictedCost) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      align: 'right',
      width: '20%',
    },
    ...(isActualAvailable
      ? [
          {
            header: 'Act. Cost (₹)',
            accessor: (pc: any) =>
              pc.actualCost !== null && pc.actualCost !== undefined
                ? Number(pc.actualCost).toLocaleString(undefined, { minimumFractionDigits: 2 })
                : '—',
            align: 'right' as const,
            width: '20%',
          },
          {
            header: 'Variance (₹)',
            accessor: (pc: any) => {
              const diff = (Number(pc.actualCost) || 0) - (Number(pc.predictedCost) || 0);
              return (
                <span className="font-mono font-bold">
                  {diff !== 0 ? (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)) : '0.00'}
                </span>
              );
            },
            align: 'right' as const,
            width: '15%',
          },
        ]
      : []),
  ];

  const totalMaterialEst = (cs?.costItems || []).reduce(
    (acc, c) => acc + (Number(c.predictedAmount) || 0),
    0,
  );
  const totalProcessEst = (cs?.processCosts || []).reduce(
    (acc, p) => acc + (Number(p.predictedCost) || 0),
    0,
  );
  const designCost = Number(cs?.designCost) || 0;
  const overheadCost = Number(cs?.overheadCost) || 0;
  const contingencyCost = Number(cs?.contingencyCost) || 0;
  const grandTotalEst =
    totalMaterialEst + totalProcessEst + designCost + overheadCost + contingencyCost;

  const summaryMetrics: SummaryMetric[] = [
    {
      label: 'Estimated Total',
      value: `₹${grandTotalEst.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      highlight: true,
    },
    {
      label: 'Material Total',
      value: `₹${totalMaterialEst.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      label: 'Process Total',
      value: `₹${totalProcessEst.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      label: 'Design & Overhead',
      value: `₹${(designCost + overheadCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      label: 'Contingency',
      value: `₹${contingencyCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      label: 'Workflow Stage',
      value: indent.currentState?.replace(/_/g, ' ') || 'DRAFT',
    },
  ];

  const signatures: SignatureBlock[] = [
    { title: 'Cost Prepared By', department: 'DESIGN DEPT', name: indent.creatorName || undefined },
    { title: 'Materials Cost Verified', department: 'STORES DEPT' },
    { title: 'Final Financial Closure', department: 'ACCOUNTS DEPT' },
  ];

  return (
    <PrintDocument orientation="portrait">
      <PrintHeader
        moduleName="COSTING & FINANCIAL VALUATION"
        reportTitle={`Process Cost Sheet: ${cs?.costNumber || indent.indentNumber}`}
        documentNumber={cs?.costNumber || `CS-${indent.indentNumber}`}
        subtitle={`Associated Indent: ${indent.indentNumber} (${indent.purpose || 'Material Request'})`}
        customMetadata={[
          { label: 'Customer', value: indent.customerName || 'N/A' },
          { label: 'Layout No.', value: indent.layoutNumber || 'N/A' },
          { label: 'Department', value: indent.departmentName || 'Administration' },
          { label: 'Financial Status', value: indent.currentState?.replace(/_/g, ' ') || 'DRAFT' },
        ]}
      />

      <PrintSummary title="FINANCIAL VALUATION SUMMARY" metrics={summaryMetrics} />

      {/* 1. Material Costs */}
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 pb-0.5 border-b border-gray-400">
          1. Direct Raw Material Costs
        </h3>
        <PrintTable columns={costItemColumns} data={cs?.costItems || []} />
      </div>

      {/* 2. Process Costs */}
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-1.5 pb-0.5 border-b border-gray-400">
          2. Direct Manufacturing Process Costs
        </h3>
        <PrintTable columns={processCostColumns} data={cs?.processCosts || []} />
      </div>

      {/* Totals Summary */}
      <PrintTotals
        notes="All rates are in Indian Rupees (₹). Cost sheet is strictly confidential and protected under corporate governance policies."
        rows={[
          { label: 'Total Material Cost', value: `₹${totalMaterialEst.toFixed(2)}` },
          { label: 'Total Process Operations Cost', value: `₹${totalProcessEst.toFixed(2)}` },
          { label: 'Design Allocation Cost', value: `₹${designCost.toFixed(2)}` },
          { label: 'Overhead Allocation Cost', value: `₹${overheadCost.toFixed(2)}` },
          { label: 'Contingency Allocation', value: `₹${contingencyCost.toFixed(2)}` },
          {
            label: 'Grand Total Estimated Valuation',
            value: `₹${grandTotalEst.toFixed(2)}`,
            highlight: true,
          },
        ]}
      />

      <PrintFooter signatures={signatures} />
    </PrintDocument>
  );
};
