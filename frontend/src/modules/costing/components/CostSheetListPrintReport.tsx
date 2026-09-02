import React from 'react';
import type { IndentData } from '../../../api/services/indents/service';
import {
  PrintDocument,
  PrintHeader,
  PrintSummary,
  PrintFilters,
  PrintTable,
  PrintTotals,
  PrintFooter,
  type PrintColumn,
  type SummaryMetric,
} from '../../../components/print';

export interface CostSheetListPrintReportProps {
  indents: IndentData[];
  totalCount: number;
  filters: {
    status?: string;
    search?: string;
    dateRange?: string;
  };
}

export const CostSheetListPrintReport: React.FC<CostSheetListPrintReportProps> = ({
  indents,
  totalCount,
  filters,
}) => {
  const verifiedCount = indents.filter(
    (i) =>
      i.currentState === 'ACCOUNTS_COST_VERIFICATION' ||
      i.currentState === 'ACTUAL_COST_UPDATED' ||
      i.currentState === 'ACCOUNTS_FINANCIAL_CLOSURE' ||
      i.currentState === 'COMPLETED',
  ).length;

  const totalEstSum = indents.reduce(
    (acc, curr) => acc + (Number(curr.costSheet?.predictedTotal) || 0),
    0,
  );

  const metrics: SummaryMetric[] = [
    { label: 'Total Cost Sheets', value: totalCount, highlight: true },
    { label: 'Accounts Verified', value: verifiedCount },
    {
      label: 'Estimated Valuation',
      value: `₹${totalEstSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      highlight: true,
    },
  ];

  const columns: PrintColumn<IndentData>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '28px', align: 'center' },
    {
      header: 'Cost Sheet #',
      accessor: (item) => (
        <span className="font-mono font-bold">
          {item.costSheet?.costNumber || item.indentNumber}
        </span>
      ),
      width: '15%',
    },
    {
      header: 'Indent Ref',
      accessor: (item) => <span className="font-mono">{item.indentNumber}</span>,
      width: '14%',
    },
    {
      header: 'Customer',
      accessor: (item) => item.customerName || '—',
      width: '15%',
    },
    {
      header: 'Department',
      accessor: (item) => item.departmentName || 'Administration',
      width: '14%',
    },
    {
      header: 'Financial Stage',
      accessor: (item) => item.currentState?.replace(/_/g, ' ') || 'DRAFT',
      width: '18%',
    },
    {
      header: 'Est. Total (₹)',
      accessor: (item) =>
        item.costSheet?.predictedTotal
          ? Number(item.costSheet.predictedTotal).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })
          : '0.00',
      align: 'right',
      width: '14%',
    },
    {
      header: 'Actual (₹)',
      accessor: (item) =>
        item.costSheet?.actualTotal
          ? Number(item.costSheet.actualTotal).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })
          : '—',
      align: 'right',
      width: '14%',
    },
  ];

  return (
    <PrintDocument orientation="landscape">
      <PrintHeader
        moduleName="FINANCIAL COSTING REGISTER"
        reportTitle="Process Cost Sheets Master Report"
        subtitle="Financial valuation and variance records for manufacturing operations"
      />

      <PrintSummary title="COSTING REGISTER SUMMARY" metrics={metrics} />

      <PrintFilters
        filters={[
          { label: 'Status Filter', value: filters.status?.replace(/_/g, ' ') },
          { label: 'Search Keyword', value: filters.search },
          { label: 'Date Range', value: filters.dateRange },
        ]}
      />

      <PrintTable
        columns={columns}
        data={indents}
        emptyMessage="No cost sheets found matching filter criteria."
      />

      <PrintTotals
        notes="Valuations calculated from active system cost models."
        rows={[
          { label: 'Total Records Count', value: totalCount, highlight: true },
          { label: 'Rendered Rows in Report', value: indents.length },
          {
            label: 'Total Estimated Value',
            value: `₹${totalEstSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            highlight: true,
          },
        ]}
      />

      <PrintFooter />
    </PrintDocument>
  );
};
