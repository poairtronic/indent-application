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

export interface IndentListPrintReportProps {
  indents: IndentData[];
  totalCount: number;
  filters: {
    status?: string;
    departmentName?: string;
    search?: string;
    dateRange?: string;
  };
}

export const IndentListPrintReport: React.FC<IndentListPrintReportProps> = ({
  indents,
  totalCount,
  filters,
}) => {
  // Aggregate Metrics based on total dataset
  const draftCount = indents.filter((i) => i.currentState === 'DRAFT').length;
  const storesCount = indents.filter(
    (i) => i.currentState === 'DESIGN_COMPLETED' || i.currentState === 'STORES_PROCESSING',
  ).length;
  const prodCount = indents.filter(
    (i) =>
      i.currentState === 'MATERIALS_ISSUED' ||
      i.currentState === 'PRODUCTION_PROCESSING' ||
      i.currentState === 'PRODUCTION_COMPLETED',
  ).length;
  const accountsCount = indents.filter(
    (i) =>
      i.currentState === 'ACCOUNTS_COST_VERIFICATION' ||
      i.currentState === 'ACTUAL_COST_UPDATED' ||
      i.currentState === 'ACCOUNTS_FINANCIAL_CLOSURE',
  ).length;
  const completedCount = indents.filter(
    (i) => i.currentState === 'ARCHIVED' || i.currentState === 'COMPLETED',
  ).length;

  const totalItemsSum = indents.reduce((acc, curr) => acc + (curr.items?.length || 0), 0);

  const metrics: SummaryMetric[] = [
    { label: 'Total Indents', value: totalCount, highlight: true },
    { label: 'Draft / Design', value: draftCount },
    { label: 'In Stores', value: storesCount },
    { label: 'In Production', value: prodCount },
    { label: 'In Accounts', value: accountsCount },
    { label: 'Completed', value: completedCount },
  ];

  const columns: PrintColumn<IndentData>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '28px', align: 'center' },
    {
      header: 'Indent Number',
      accessor: (item) => <span className="font-mono font-bold">{item.indentNumber}</span>,
      width: '14%',
    },
    {
      header: 'Purpose / PO',
      accessor: (item) => <span className="font-medium">{item.purpose || '—'}</span>,
      width: '14%',
    },
    {
      header: 'Customer',
      accessor: (item) => item.customerName || '—',
      width: '14%',
    },
    {
      header: 'Department',
      accessor: (item) => item.departmentName || 'Administration',
      width: '12%',
    },
    {
      header: 'Priority',
      accessor: (item) => (
        <span
          className={`font-semibold text-[8pt] ${
            item.priority === 'URGENT' || item.priority === 'HIGH' ? 'text-gray-900 font-bold' : ''
          }`}
        >
          {item.priority || 'MEDIUM'}
        </span>
      ),
      align: 'center',
      width: '8%',
    },
    {
      header: 'Current Status',
      accessor: (item) => (
        <span className="font-medium text-[8pt] text-gray-800">
          {item.currentState?.replace(/_/g, ' ') || 'DRAFT'}
        </span>
      ),
      width: '16%',
    },
    {
      header: 'Req. Date',
      accessor: (item) =>
        item.requiredDate ? new Date(item.requiredDate).toLocaleDateString('en-GB') : '—',
      align: 'center',
      width: '10%',
    },
    {
      header: 'Items',
      accessor: (item) => item.items?.length || 0,
      align: 'right',
      width: '6%',
    },
  ];

  return (
    <PrintDocument orientation="landscape">
      {/* Enterprise Header */}
      <PrintHeader
        moduleName="INDENT MANAGEMENT REGISTER"
        reportTitle="Manufacturing Indents Master Report"
        subtitle="Complete summary of material demand transactions across workflow stages"
      />

      {/* Summary Metrics */}
      <PrintSummary title="INDENT REGISTER SUMMARY" metrics={metrics} />

      {/* Active Filter Criteria */}
      <PrintFilters
        filters={[
          { label: 'Status Filter', value: filters.status?.replace(/_/g, ' ') },
          { label: 'Department', value: filters.departmentName },
          { label: 'Search Keyword', value: filters.search },
          { label: 'Date Range', value: filters.dateRange },
        ]}
      />

      {/* Report Table */}
      <PrintTable
        columns={columns}
        data={indents}
        emptyMessage="No indents found matching the current filter criteria."
      />

      {/* Totals Summary */}
      <PrintTotals
        notes="Total records count reflects the authoritative database query state. Generated for enterprise operations tracking."
        rows={[
          { label: 'Total Indent Records', value: totalCount, highlight: true },
          { label: 'Rendered Rows in Report', value: indents.length },
          { label: 'Total Material Line Items', value: totalItemsSum },
        ]}
      />

      {/* Standard Footer */}
      <PrintFooter />
    </PrintDocument>
  );
};
