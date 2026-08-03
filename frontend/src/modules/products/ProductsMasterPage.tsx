import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Download,
  Archive,
  CheckCircle2,
  Coins,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { KPICard } from '../../components/ui/Cards';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ProductFormModal } from './ProductFormModal';
import type { ProductData } from './ProductFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import { downloadFile } from '../../utils/download';

const INITIAL_PRODUCTS: ProductData[] = [
  {
    id: 'prd-101',
    productCode: 'PRD-9001',
    productName: 'Industrial Control Panel Box A1',
    category: 'ELECTRICAL',
    unitOfMeasure: 'PCS',
    estimatedCost: 14500,
    description: 'Enclosed powder-coated IP65 control panel for motor drives.',
    isActive: true,
  },
  {
    id: 'prd-102',
    productCode: 'PRD-9002',
    productName: 'Stainless Steel Flange Assembly 304',
    category: 'MECHANICAL',
    unitOfMeasure: 'SETS',
    estimatedCost: 8200,
    description: 'Precision machined 304 stainless steel pipe flange set.',
    isActive: true,
  },
  {
    id: 'prd-103',
    productCode: 'PRD-9003',
    productName: 'High-Density Polymer Gasket Ring',
    category: 'HARDWARE',
    unitOfMeasure: 'PCS',
    estimatedCost: 450,
    description: 'Oil-resistant sealing gasket for hydraulic valves.',
    isActive: true,
  },
  {
    id: 'prd-104',
    productCode: 'PRD-9004',
    productName: 'Custom Pneumatic Actuator Module',
    category: 'CUSTOM',
    unitOfMeasure: 'PCS',
    estimatedCost: 28900,
    description: 'Double-acting heavy-duty pneumatic actuator unit.',
    isActive: false,
  },
  {
    id: 'prd-105',
    productCode: 'PRD-9005',
    productName: 'Modular Cable Harness Assembly 12V',
    category: 'ASSEMBLY',
    unitOfMeasure: 'SETS',
    estimatedCost: 3600,
    description: 'Pre-crimped heat-shrink insulated wiring harness.',
    isActive: true,
  },
];

export const ProductsMasterPage: React.FC = () => {
  const [products, setProducts] = useState<ProductData[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductData | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.productName.toLowerCase().includes(search.toLowerCase()) ||
        p.productCode.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && p.isActive) ||
        (statusFilter === 'ARCHIVED' && !p.isActive);
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const activeCount = useMemo(() => products.filter((p) => p.isActive).length, [products]);
  const archivedCount = useMemo(() => products.filter((p) => !p.isActive).length, [products]);
  const avgCost = useMemo(() => {
    if (products.length === 0) return 0;
    const total = products.reduce((acc, p) => acc + p.estimatedCost, 0);
    return Math.round(total / products.length);
  }, [products]);

  const handleSaveProduct = async (productData: ProductData) => {
    if (productData.id) {
      setProducts((prev) => prev.map((p) => (p.id === productData.id ? productData : p)));
    } else {
      const newProduct: ProductData = {
        ...productData,
        id: `prd-${Date.now()}`,
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleToggleArchive = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  const handleExportCSV = () => {
    const headers = [
      'Product Code',
      'Product Name',
      'Category',
      'Unit',
      'Estimated Cost',
      'Status',
    ];
    const rows = filteredProducts.map((p) => [
      p.productCode,
      `"${p.productName.replace(/"/g, '""')}"`,
      p.category,
      p.unitOfMeasure,
      p.estimatedCost.toString(),
      p.isActive ? 'ACTIVE' : 'ARCHIVED',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, 'products_master.csv', 'text/csv');
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Products Master Catalog
          </h1>
          <p className="text-xs text-text-muted">
            Manage manufactured products, SKUs, cost estimations, and CAD technical parameters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={16} />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingProduct(null);
              setFormModalOpen(true);
            }}
          >
            Create Product
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total SKUs Catalog"
          value={products.length}
          trend="Master Items"
          icon={<Package size={18} />}
          accent="primary"
        />
        <KPICard
          title="Active Products"
          value={activeCount}
          trend="In Production"
          icon={<CheckCircle2 size={18} />}
          accent="success"
        />
        <KPICard
          title="Archived SKUs"
          value={archivedCount}
          trend="Legacy Items"
          icon={<Archive size={18} />}
          accent="warning"
        />
        <KPICard
          title="Average Est. Cost"
          value={formatCurrency(avgCost)}
          trend="Base Unit Cost"
          icon={<Coins size={18} />}
          accent="info"
        />
      </div>

      {/* Controls Header: Search & Filters */}
      <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <Input
            id="productSearch"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product code or SKU description..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-background-primary border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="MECHANICAL">Mechanical</option>
              <option value="HARDWARE">Hardware</option>
              <option value="ASSEMBLY">Assembly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background-primary border border-border-default rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-background-secondary/60 border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4">Est. Cost (INR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default/50 text-text-primary">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-background-primary/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-accent-primary">
                      {p.productCode}
                    </td>
                    <td className="py-3.5 px-4 font-bold">{p.productName}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-background-secondary px-2 py-0.5 rounded text-[10px] font-semibold border border-border-default">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{p.unitOfMeasure}</td>
                    <td className="py-3.5 px-4 font-bold text-status-success">
                      {formatCurrency(p.estimatedCost)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge tone={p.isActive ? 'green' : 'gray'}>
                        {p.isActive ? 'ACTIVE' : 'ARCHIVED'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleArchive(p.id!)}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            p.isActive
                              ? 'text-status-warning hover:bg-status-warning/10'
                              : 'text-status-success hover:bg-status-success/10'
                          }`}
                        >
                          {p.isActive ? 'Archive' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDetailProduct(p)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
                          title="View Specs"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setFormModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-secondary"
                          title="Edit Product"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-status-error/80 hover:text-status-error hover:bg-status-error/10"
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <ProductFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleSaveProduct}
        initialData={editingProduct}
      />

      <ProductDetailModal
        open={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Product: ${deleteTarget?.productName}`}
        message="Are you sure you want to remove this product SKU from the master catalog?"
        tone="danger"
        confirmLabel="Delete SKU"
      />
    </div>
  );
};
