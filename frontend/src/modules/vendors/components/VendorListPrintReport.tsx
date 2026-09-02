import React from 'react';
import type { VendorResponse } from '../../../types/vendor';
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

export interface VendorListPrintReportProps {
  vendors: VendorResponse[];
  totalCount: number;
  filters: {
    status?: string;
    search?: string;
  };
}

export const VendorListPrintReport: React.FC<VendorListPrintReportProps> = ({
  vendors,
  totalCount,
  filters,
}) => {
  const activeCount = vendors.filter((v) => v.status === 'ACTIVE').length;
  const inactiveCount = vendors.filter((v) => v.status === 'INACTIVE').length;

  const metrics: SummaryMetric[] = [
    { label: 'Total Vendors', value: totalCount, highlight: true },
    { label: 'Active Status', value: activeCount },
    { label: 'Inactive Status', value: inactiveCount },
  ];

  const columns: PrintColumn<VendorResponse>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '30px', align: 'center' },
    {
      header: 'Vendor Code',
      accessor: (v) => <span className="font-mono font-bold">{v.vendorCode || '—'}</span>,
      width: '15%',
    },
    {
      header: 'Vendor / Company Name',
      accessor: (v) => <span className="font-semibold">{v.vendorName}</span>,
      width: '25%',
    },
    {
      header: 'Location',
      accessor: (v) => <span>{[v.city, v.state].filter(Boolean).join(', ') || '—'}</span>,
      width: '18%',
    },
    {
      header: 'Phone / Email',
      accessor: (v) => (
        <div>
          <span>{v.phone || '—'}</span>
          {v.email && <span className="block text-[7pt] text-gray-500">{v.email}</span>}
        </div>
      ),
      width: '22%',
    },
    {
      header: 'Status',
      accessor: (v) => (
        <span
          className={`font-semibold text-[8pt] ${v.status === 'ACTIVE' ? 'text-gray-900' : 'text-gray-500'}`}
        >
          {v.status || 'ACTIVE'}
        </span>
      ),
      align: 'center',
      width: '12%',
    },
  ];

  return (
    <PrintDocument orientation="portrait">
      <PrintHeader
        moduleName="SUPPLIER & VENDOR MANAGEMENT"
        reportTitle="Vendor Directory Master Report"
        subtitle="Approved suppliers, manufacturing subcontractors, and material vendors"
      />

      <PrintSummary title="VENDOR DIRECTORY SUMMARY" metrics={metrics} />

      <PrintFilters
        filters={[
          { label: 'Status Filter', value: filters.status },
          { label: 'Search Keyword', value: filters.search },
        ]}
      />

      <PrintTable
        columns={columns}
        data={vendors}
        emptyMessage="No vendors found matching filter criteria."
      />

      <PrintTotals
        notes="Official supplier directory. All vendor engagements must adhere to IMCMS procurement guidelines."
        rows={[
          { label: 'Total Registered Vendors', value: totalCount, highlight: true },
          { label: 'Rendered in Report', value: vendors.length },
        ]}
      />

      <PrintFooter />
    </PrintDocument>
  );
};
