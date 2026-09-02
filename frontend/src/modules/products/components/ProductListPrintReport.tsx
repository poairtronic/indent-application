import React from 'react';
import type { ProductResponse } from '../../../api/types/product';
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

export interface ProductListPrintReportProps {
  products: ProductResponse[];
  totalCount: number;
  filters: {
    status?: string;
    search?: string;
  };
}

export const ProductListPrintReport: React.FC<ProductListPrintReportProps> = ({
  products,
  totalCount,
  filters,
}) => {
  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const inactiveCount = products.filter((p) => p.status === 'INACTIVE').length;

  const metrics: SummaryMetric[] = [
    { label: 'Total Products', value: totalCount, highlight: true },
    { label: 'Active Catalog', value: activeCount },
    { label: 'Inactive Items', value: inactiveCount },
  ];

  const columns: PrintColumn<ProductResponse>[] = [
    { header: '#', accessor: (_, i) => i + 1, width: '30px', align: 'center' },
    {
      header: 'Product Code',
      accessor: (p) => <span className="font-mono font-bold">{p.productCode || '—'}</span>,
      width: '18%',
    },
    {
      header: 'Product / Part Name',
      accessor: (p) => <span className="font-semibold">{p.productName}</span>,
      width: '32%',
    },
    {
      header: 'Description',
      accessor: (p) => p.description || '—',
      width: '30%',
    },
    {
      header: 'Status',
      accessor: (p) => (
        <span
          className={`font-semibold text-[8pt] ${p.status === 'ACTIVE' ? 'text-gray-900' : 'text-gray-500'}`}
        >
          {p.status || 'ACTIVE'}
        </span>
      ),
      align: 'center',
      width: '12%',
    },
  ];

  return (
    <PrintDocument orientation="portrait">
      <PrintHeader
        moduleName="FINISHED GOODS & PRODUCT MASTER"
        reportTitle="Master Product Catalog Report"
        subtitle="Manufactured components, assembly products, and finished goods catalogue"
      />

      <PrintSummary title="PRODUCT CATALOG SUMMARY" metrics={metrics} />

      <PrintFilters
        filters={[
          { label: 'Status Filter', value: filters.status },
          { label: 'Search Keyword', value: filters.search },
        ]}
      />

      <PrintTable
        columns={columns}
        data={products}
        emptyMessage="No products found matching filter criteria."
      />

      <PrintTotals
        notes="Official engineering product master catalog."
        rows={[
          { label: 'Total Master Products', value: totalCount, highlight: true },
          { label: 'Items in Report', value: products.length },
        ]}
      />

      <PrintFooter />
    </PrintDocument>
  );
};
