export interface ReportColumn<T = any> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  align?: 'left' | 'center' | 'right';
}

export interface ReportFilter {
  name: string;
  field: string;
  type: 'select' | 'dateRange' | 'text';
  placeholder?: string;
  options?: { value: string; label: string }[];
  optionsHook?: () => any; // Reference to hook for fetching options
}

export interface ReportConfig {
  id: string;
  name: string;
  category: 'Manufacturing Operations' | 'Cost & Financial Analytics' | 'Master Data & Workflow';
  description: string;
  endpoint: string;
  filters: ReportFilter[];
  columns: ReportColumn[];
  sortBy?: string;
}

export const REPORTS_REGISTRY: Record<string, ReportConfig> = {
  'daily-production': {
    id: 'daily-production',
    name: 'Daily Production Summary',
    category: 'Manufacturing Operations',
    description: 'Overview of all completed and ongoing manufacturing indents.',
    endpoint: '/reports/production/daily',
    sortBy: 'createdAt',
    filters: [
      {
        name: 'Date Range',
        field: 'dateRange',
        type: 'dateRange',
      },
      {
        name: 'Product',
        field: 'productId',
        type: 'select',
        placeholder: 'All Products',
        optionsHook: () => import('../../api/services/products/hooks').then((m) => m.useProducts),
      },
      {
        name: 'Department',
        field: 'departmentId',
        type: 'select',
        placeholder: 'All Departments',
        optionsHook: () =>
          import('../../api/services/departments/hooks').then((m) => m.useDepartments),
      },
      {
        name: 'Status',
        field: 'status',
        type: 'select',
        placeholder: 'All Statuses',
        options: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'SUBMITTED', label: 'Design Completed' },
          { value: 'PENDING_STORES', label: 'Stores Processing' },
          { value: 'IN_PRODUCTION', label: 'Production Processing' },
          { value: 'APPROVED', label: 'Customer Delivered' },
          { value: 'PENDING_ACCOUNTS', label: 'Accounts Cost Verification' },
          { value: 'PENDING_SENIOR_MANAGER', label: 'Accounts Financial Closure' },
          { value: 'PENDING_GENERAL_MANAGER', label: 'Archived' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ],
      },
    ],
    columns: [
      { header: 'Indent Number', accessor: 'indentNumber' },
      { header: 'Product Code', accessor: 'productCode' },
      { header: 'Product Name', accessor: 'productName' },
      { header: 'Department', accessor: 'departmentName' },
      { header: 'Priority', accessor: 'priority' },
      { header: 'Status', accessor: 'status' },
      {
        header: 'Required Date',
        accessor: (row) => new Date(row.requiredDate).toLocaleDateString(),
      },
      { header: 'Created At', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
      {
        header: 'Delivery Date',
        accessor: (row) =>
          row.receivedDate ? new Date(row.receivedDate).toLocaleDateString() : '-',
      },
    ],
  },
  'process-yield': {
    id: 'process-yield',
    name: 'Process Yield Report',
    category: 'Manufacturing Operations',
    description: 'Detailed breakdown of manufacturing processes and output.',
    endpoint: '/reports/production/process-yield',
    sortBy: 'sequence',
    filters: [
      {
        name: 'Date Range',
        field: 'dateRange',
        type: 'dateRange',
      },
      {
        name: 'Product',
        field: 'productId',
        type: 'select',
        placeholder: 'All Products',
        optionsHook: () => import('../../api/services/products/hooks').then((m) => m.useProducts),
      },
      {
        name: 'Process Code',
        field: 'processCode',
        type: 'text',
        placeholder: 'e.g. PR-001',
      },
    ],
    columns: [
      { header: 'Indent Number', accessor: 'indentNumber' },
      { header: 'Product Name', accessor: 'productName' },
      { header: 'Process Code', accessor: 'processCode' },
      { header: 'Process Name', accessor: 'processName' },
      { header: 'Sequence', accessor: 'sequence', align: 'center' },
      { header: 'Est. Hours', accessor: 'estimatedHours', align: 'right' },
      {
        header: 'Act. Hours',
        accessor: (row) => (row.actualHours !== null ? row.actualHours : '-'),
        align: 'right',
      },
      {
        header: 'Variance (Hrs)',
        accessor: (row) => (row.varianceHours !== null ? row.varianceHours : '-'),
        align: 'right',
      },
      {
        header: 'Efficiency %',
        accessor: (row) =>
          row.efficiencyPercentage !== null ? `${row.efficiencyPercentage}%` : '-',
        align: 'right',
      },
      {
        header: 'Scrap Factor %',
        accessor: (row) => (row.scrapFactor !== null ? `${row.scrapFactor}%` : '-'),
        align: 'right',
      },
    ],
  },
  'machine-utilization': {
    id: 'machine-utilization',
    name: 'Machine Utilization',
    category: 'Manufacturing Operations',
    description: 'Time and efficiency tracking for manufacturing equipment.',
    endpoint: '/reports/production/machine-utilization',
    sortBy: 'processCode',
    filters: [
      {
        name: 'Process Code',
        field: 'processCode',
        type: 'text',
        placeholder: 'e.g. PR-001',
      },
    ],
    columns: [
      { header: 'Process Code', accessor: 'processCode' },
      { header: 'Process Name', accessor: 'processName' },
      { header: 'Total Indents Run', accessor: 'totalIndentCount', align: 'center' },
      { header: 'Total Est. Hours', accessor: 'totalEstimatedHours', align: 'right' },
      {
        header: 'Total Act. Hours',
        accessor: (row) => (row.totalActualHours !== null ? row.totalActualHours : '-'),
        align: 'right',
      },
      {
        header: 'Avg Act. Hours',
        accessor: (row) => (row.averageActualHours !== null ? row.averageActualHours : '-'),
        align: 'right',
      },
    ],
  },
  'actual-vs-predicted': {
    id: 'actual-vs-predicted',
    name: 'Actual vs. Predicted Costs',
    category: 'Cost & Financial Analytics',
    description: 'Financial variance report across all completed cost sheets.',
    endpoint: '/reports/cost/actual-vs-predicted',
    sortBy: 'createdAt',
    filters: [
      {
        name: 'Date Range',
        field: 'dateRange',
        type: 'dateRange',
      },
      {
        name: 'Product',
        field: 'productId',
        type: 'select',
        placeholder: 'All Products',
        optionsHook: () => import('../../api/services/products/hooks').then((m) => m.useProducts),
      },
      {
        name: 'Status',
        field: 'status',
        type: 'select',
        placeholder: 'All Statuses',
        options: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'FINALIZED', label: 'Finalized' },
          { value: 'CANCELLED', label: 'Cancelled' },
        ],
      },
    ],
    columns: [
      { header: 'Cost Number', accessor: 'costNumber' },
      { header: 'Indent Number', accessor: 'indentNumber' },
      { header: 'Product Name', accessor: 'productName' },
      {
        header: 'Planned Total ($)',
        accessor: (row) => Number(row.predictedTotal).toFixed(2),
        align: 'right',
      },
      {
        header: 'Actual Total ($)',
        accessor: (row) => (row.actualTotal !== null ? Number(row.actualTotal).toFixed(2) : '-'),
        align: 'right',
      },
      {
        header: 'Variance ($)',
        accessor: (row) =>
          row.varianceAmount !== null ? Number(row.varianceAmount).toFixed(2) : '-',
        align: 'right',
      },
      {
        header: 'Variance %',
        accessor: (row) => (row.variancePercentage !== null ? `${row.variancePercentage}%` : '-'),
        align: 'right',
      },
      { header: 'Status', accessor: 'status' },
      { header: 'Created At', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
    ],
  },
  'material-breakdown': {
    id: 'material-breakdown',
    name: 'Material Cost Breakdown',
    category: 'Cost & Financial Analytics',
    description: 'Total expenditure separated by material categories.',
    endpoint: '/reports/cost/material-breakdown',
    sortBy: 'materialCode',
    filters: [
      {
        name: 'Date Range',
        field: 'dateRange',
        type: 'dateRange',
      },
      {
        name: 'Category',
        field: 'status', // mapped to status query parameter on backend to prevent schema pollution
        type: 'select',
        placeholder: 'All Categories',
        options: [
          { value: 'RAW_MATERIAL', label: 'Raw Material' },
          { value: 'CONSUMABLE', label: 'Consumable' },
          { value: 'SPARE', label: 'Spare Parts' },
          { value: 'TOOLING', label: 'Tooling' },
        ],
      },
    ],
    columns: [
      { header: 'Material Code', accessor: 'materialCode' },
      { header: 'Material Name', accessor: 'materialName' },
      { header: 'Category', accessor: 'category' },
      { header: 'Total Est. Qty', accessor: 'totalPredictedQty', align: 'right' },
      {
        header: 'Total Act. Qty',
        accessor: (row) => (row.totalActualQty !== null ? row.totalActualQty : '-'),
        align: 'right',
      },
      {
        header: 'Est. Amount ($)',
        accessor: (row) => Number(row.totalPredictedAmount).toFixed(2),
        align: 'right',
      },
      {
        header: 'Act. Amount ($)',
        accessor: (row) =>
          row.totalActualAmount !== null ? Number(row.totalActualAmount).toFixed(2) : '-',
        align: 'right',
      },
      {
        header: 'Variance ($)',
        accessor: (row) =>
          row.varianceAmount !== null ? Number(row.varianceAmount).toFixed(2) : '-',
        align: 'right',
      },
    ],
  },
  'department-budget': {
    id: 'department-budget',
    name: 'Department Budget Utilization',
    category: 'Cost & Financial Analytics',
    description: 'Financial tracking grouped by originating department.',
    endpoint: '/reports/cost/department-budget',
    sortBy: 'departmentCode',
    filters: [
      {
        name: 'Date Range',
        field: 'dateRange',
        type: 'dateRange',
      },
    ],
    columns: [
      { header: 'Dept Code', accessor: 'departmentCode' },
      { header: 'Department Name', accessor: 'departmentName' },
      {
        header: 'Total Planned Cost ($)',
        accessor: (row) => Number(row.totalPlannedCost).toFixed(2),
        align: 'right',
      },
      {
        header: 'Total Actual Cost ($)',
        accessor: (row) => Number(row.totalActualCost).toFixed(2),
        align: 'right',
      },
      {
        header: 'Variance ($)',
        accessor: (row) => Number(row.varianceAmount).toFixed(2),
        align: 'right',
      },
      {
        header: 'Variance %',
        accessor: (row) => `${Number(row.variancePercentage).toFixed(2)}%`,
        align: 'right',
      },
    ],
  },
  'vendor-performance': {
    id: 'vendor-performance',
    name: 'Vendor Performance Matrix',
    category: 'Master Data & Workflow',
    description: 'Evaluation of vendor delivery times and material quality.',
    endpoint: '/reports/master-data/vendor-performance',
    sortBy: 'vendorCode',
    filters: [
      {
        name: 'Date Range',
        field: 'dateRange',
        type: 'dateRange',
      },
      {
        name: 'Vendor',
        field: 'vendorId',
        type: 'select',
        placeholder: 'All Vendors',
        optionsHook: () => import('../../api/services/vendors/hooks').then((m) => m.useVendors),
      },
    ],
    columns: [
      { header: 'Vendor Code', accessor: 'vendorCode' },
      { header: 'Vendor Name', accessor: 'vendorName' },
      { header: 'Supplied Cost Items', accessor: 'totalCostItems', align: 'center' },
      {
        header: 'Predicted Total ($)',
        accessor: (row) => Number(row.totalPredictedAmount).toFixed(2),
        align: 'right',
      },
      {
        header: 'Actual Total ($)',
        accessor: (row) =>
          row.totalActualAmount !== null ? Number(row.totalActualAmount).toFixed(2) : '-',
        align: 'right',
      },
      {
        header: 'Variance ($)',
        accessor: (row) =>
          row.totalVariance !== null ? Number(row.totalVariance).toFixed(2) : '-',
        align: 'right',
      },
      {
        header: 'Variance %',
        accessor: (row) =>
          row.variancePercentage !== null ? `${Number(row.variancePercentage).toFixed(2)}%` : '-',
        align: 'right',
      },
    ],
  },
  products: {
    id: 'products',
    name: 'Product Catalog Export',
    category: 'Master Data & Workflow',
    description: 'Complete export of all configured master products.',
    endpoint: '/reports/master-data/products',
    sortBy: 'productCode',
    filters: [
      {
        name: 'Status',
        field: 'status',
        type: 'select',
        placeholder: 'All Statuses',
        options: [
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'DISCONTINUED', label: 'Discontinued' },
          { value: 'UNDER_DEVELOPMENT', label: 'Under Development' },
        ],
      },
    ],
    columns: [
      { header: 'Product Code', accessor: 'productCode' },
      { header: 'Product Name', accessor: 'productName' },
      { header: 'Drawing Number', accessor: (row) => row.drawingNumber || '-' },
      { header: 'Revision', accessor: (row) => row.revision || '-' },
      { header: 'Status', accessor: 'status' },
      { header: 'Materials Mapped', accessor: 'materialCount', align: 'center' },
      { header: 'Processes Mapped', accessor: 'processCount', align: 'center' },
      { header: 'Active Indents', accessor: 'activeIndentCount', align: 'center' },
      { header: 'Created At', accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
    ],
  },
  'workflow-bottleneck': {
    id: 'workflow-bottleneck',
    name: 'Workflow Bottleneck Analysis',
    category: 'Master Data & Workflow',
    description: 'Average time spent in each stage of the ERP workflow.',
    endpoint: '/reports/workflow/bottleneck',
    sortBy: 'stageName',
    filters: [
      {
        name: 'Date Range',
        field: 'dateRange',
        type: 'dateRange',
      },
    ],
    columns: [
      { header: 'Workflow Stage Name', accessor: 'stageName' },
      { header: 'Passed Indents Count', accessor: 'totalTransactionsPassed', align: 'center' },
      { header: 'Avg Processing Time (Hrs)', accessor: 'averageDurationHours', align: 'right' },
      { header: 'Max Processing Time (Hrs)', accessor: 'maxDurationHours', align: 'right' },
      { header: 'Stalled Active Indents', accessor: 'activeTransactionsCount', align: 'center' },
    ],
  },
};
