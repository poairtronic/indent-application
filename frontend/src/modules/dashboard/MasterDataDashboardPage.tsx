import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Layers,
  Truck,
  Scale,
  Settings2,
  Building2,
  Users,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Archive,
  BarChart3,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { KPICard } from '../../components/ui/Cards';
import { ActivityTimeline } from '../../components/ui/DataTimeline';
import { ChartWrapper } from '../../components/ui/ChartWrapper';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const MasterDataDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Summary Metrics Across All 8 Master Registries
  const stats = useMemo(
    () => ({
      products: { total: 42, active: 38, archived: 4 },
      materials: { total: 58, active: 52, alert: 6 },
      vendors: { total: 18, active: 16, pending: 2 },
      units: { total: 12, active: 12 },
      processes: { total: 15, active: 15 },
      departments: { total: 8, active: 8 },
      users: { total: 34, active: 31, inactive: 3 },
      roles: { total: 5, active: 5 },
    }),
    [],
  );

  const totalMasterRecords = useMemo(
    () =>
      stats.products.total +
      stats.materials.total +
      stats.vendors.total +
      stats.units.total +
      stats.processes.total +
      stats.departments.total +
      stats.users.total +
      stats.roles.total,
    [stats],
  );

  const totalActiveRecords = useMemo(
    () =>
      stats.products.active +
      stats.materials.active +
      stats.vendors.active +
      stats.units.active +
      stats.processes.active +
      stats.departments.active +
      stats.users.active +
      stats.roles.active,
    [stats],
  );

  // Recent Master Data Changes Feed
  const recentMasterChanges = useMemo(
    () => [
      {
        id: 'mc-1',
        title: 'Product SKU #AGIPL-PRD-005 Updated',
        description: 'Design department updated base cost estimation to ₹3,600.',
        timestamp: '15 mins ago',
      },
      {
        id: 'mc-2',
        title: 'Raw Material AGIPL-MAT-001 Threshold Adjusted',
        description: 'Reorder point updated to 250 KG for Stainless Steel Grade 304.',
        timestamp: '1 hour ago',
      },
      {
        id: 'mc-3',
        title: 'Vendor VND-4002 Category Added',
        description: 'MetalCraft Corp assigned to Primary Metal Suppliers category.',
        timestamp: '3 hours ago',
      },
      {
        id: 'mc-4',
        title: 'Department HOD Assignment',
        description: 'Rajesh Sharma confirmed as Head of Design & Technical Department.',
        timestamp: '5 hours ago',
      },
    ],
    [],
  );

  // Material Distribution Chart Data
  const materialCategoryData = useMemo(
    () => [
      { label: 'Metals & Steel', value: 24 },
      { label: 'Plastics', value: 14 },
      { label: 'Electrical Wires', value: 10 },
      { label: 'Hardware', value: 7 },
      { label: 'Chemicals', value: 3 },
    ],
    [],
  );

  // Top Vendors Performance Ranking
  const topVendors = useMemo(
    () => [
      {
        id: 'v-1',
        name: 'MetalCraft Steel Supplies',
        category: 'Raw Metals',
        rating: '4.9 ★',
        status: 'ACTIVE',
      },
      {
        id: 'v-2',
        name: 'Precision Electricals Ltd',
        category: 'Electrical',
        rating: '4.8 ★',
        status: 'ACTIVE',
      },
      {
        id: 'v-3',
        name: 'Apex Polymer Moulding',
        category: 'Plastics',
        rating: '4.7 ★',
        status: 'ACTIVE',
      },
      {
        id: 'v-4',
        name: 'National Hardware Traders',
        category: 'Fasteners',
        rating: '4.6 ★',
        status: 'ACTIVE',
      },
    ],
    [],
  );

  // Most Used Products Ranking
  const mostUsedProducts = useMemo(
    () => [
      {
        code: 'AGIPL-PRD-001',
        name: 'Industrial Control Panel Box A1',
        volume: '142 Indents',
        cost: '₹14,500',
      },
      {
        code: 'AGIPL-PRD-002',
        name: 'Stainless Steel Flange Assembly',
        volume: '98 Indents',
        cost: '₹8,200',
      },
      {
        code: 'AGIPL-PRD-005',
        name: 'Modular Cable Harness 12V',
        volume: '84 Indents',
        cost: '₹3,600',
      },
      {
        code: 'AGIPL-PRD-003',
        name: 'High-Density Polymer Gasket',
        volume: '62 Indents',
        cost: '₹450',
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav
            className="flex items-center gap-1.5 text-xs text-text-muted mb-1"
            aria-label="Breadcrumb"
          >
            <span
              className="hover:text-text-primary transition-colors cursor-pointer"
              onClick={() => navigate('/')}
            >
              Home
            </span>
            <ChevronRight size={12} />
            <span className="text-text-primary font-semibold">Master Data Intelligence</span>
          </nav>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Enterprise Master Data Governance
          </h1>
          <p className="text-xs text-text-muted">
            Unified catalog intelligence across Products, Materials, Vendors, Units, Processes,
            Departments, Users, and Roles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold">
            <Sparkles size={14} />
            <span>{totalMasterRecords} Master Records</span>
          </div>
        </div>
      </div>

      {/* Record Health & Status Distribution Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Master Records"
          value={totalMasterRecords}
          trend="8 Registries"
          icon={<BarChart3 size={18} />}
          accent="primary"
        />
        <KPICard
          title="Active Governance"
          value={totalActiveRecords}
          trend="In Operations"
          icon={<CheckCircle2 size={18} />}
          accent="success"
        />
        <KPICard
          title="Reorder & Stock Alerts"
          value={stats.materials.alert}
          trend="Material Thresholds"
          icon={<AlertTriangle size={18} />}
          accent="warning"
        />
        <KPICard
          title="Archived & Inactive"
          value={totalMasterRecords - totalActiveRecords}
          trend="Legacy Registries"
          icon={<Archive size={18} />}
          accent="info"
        />
      </div>

      {/* 8 Core Master Registries Portal Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Master Data Registries Navigation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/products')}
            className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 cursor-pointer hover:border-border-strong hover-lift shadow-card transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Package size={18} />
              </div>
              <Badge tone="blue">{stats.products.active} Products</Badge>
            </div>
            <span className="font-bold text-xs text-text-primary block">Products Master</span>
            <p className="text-[11px] text-text-muted line-clamp-1">
              Manufactured products catalog & estimations
            </p>
          </div>

          <div
            onClick={() => navigate('/materials')}
            className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 cursor-pointer hover:border-border-strong hover-lift shadow-card transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Layers size={18} />
              </div>
              <Badge tone="yellow">{stats.materials.total} Raw Materials</Badge>
            </div>
            <span className="font-bold text-xs text-text-primary block">Raw Materials</span>
            <p className="text-[11px] text-text-muted line-clamp-1">
              Material codes & reorder points
            </p>
          </div>

          <div
            onClick={() => navigate('/vendors')}
            className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 cursor-pointer hover:border-border-strong hover-lift shadow-card transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Truck size={18} />
              </div>
              <Badge tone="green">{stats.vendors.active} Approved</Badge>
            </div>
            <span className="font-bold text-xs text-text-primary block">Approved Vendors</span>
            <p className="text-[11px] text-text-muted line-clamp-1">Supplier network & ratings</p>
          </div>

          <div
            onClick={() => navigate('/units')}
            className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 cursor-pointer hover:border-border-strong hover-lift shadow-card transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Scale size={18} />
              </div>
              <Badge tone="blue">{stats.units.total} UOMs</Badge>
            </div>
            <span className="font-bold text-xs text-text-primary block">Units of Measure</span>
            <p className="text-[11px] text-text-muted line-clamp-1">
              Weight, length, and stock units
            </p>
          </div>

          <div
            onClick={() => navigate('/manufacturing-processes')}
            className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 cursor-pointer hover:border-border-strong hover-lift shadow-card transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Settings2 size={18} />
              </div>
              <Badge tone="green">{stats.processes.total} Stages</Badge>
            </div>
            <span className="font-bold text-xs text-text-primary block">
              Manufacturing Processes
            </span>
            <p className="text-[11px] text-text-muted line-clamp-1">
              Process routings & sequence order
            </p>
          </div>

          <div
            onClick={() => navigate('/departments')}
            className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 cursor-pointer hover:border-border-strong hover-lift shadow-card transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Building2 size={18} />
              </div>
              <Badge tone="blue">{stats.departments.total} Departments</Badge>
            </div>
            <span className="font-bold text-xs text-text-primary block">Operating Units</span>
            <p className="text-[11px] text-text-muted line-clamp-1">
              HOD assignments & member queues
            </p>
          </div>

          <div
            onClick={() => navigate('/users')}
            className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 cursor-pointer hover:border-border-strong hover-lift shadow-card transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Users size={18} />
              </div>
              <Badge tone="green">{stats.users.active} Active Users</Badge>
            </div>
            <span className="font-bold text-xs text-text-primary block">User Directory</span>
            <p className="text-[11px] text-text-muted line-clamp-1">
              Personnel roles & status flags
            </p>
          </div>

          <div
            onClick={() => navigate('/roles')}
            className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2 cursor-pointer hover:border-border-strong hover-lift shadow-card transition-all"
          >
            <div className="flex justify-between items-center">
              <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-primary">
                <Shield size={18} />
              </div>
              <Badge tone="blue">{stats.roles.total} Security Roles</Badge>
            </div>
            <span className="font-bold text-xs text-text-primary block">Security Roles</span>
            <p className="text-[11px] text-text-muted line-clamp-1">
              RBAC authority & permission scope
            </p>
          </div>
        </div>
      </div>

      {/* Section: Intelligence Charts & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material Category Distribution Chart */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Raw Material Catalog Distribution
          </h3>
          <ChartWrapper
            title="Raw Material Count by Classification"
            data={materialCategoryData}
            type="bar"
          />
        </div>

        {/* Recent Master Data Audit Feed */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Recent Master Audit Feed
            </h3>
            <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
              <Clock size={12} /> Live Audit
            </span>
          </div>
          <div className="bg-surface-card border border-border-default rounded-xl p-5 shadow-card min-h-[260px]">
            <ActivityTimeline items={recentMasterChanges} />
          </div>
        </div>
      </div>

      {/* Section: Most Used Products & Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Products Ranking */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Most Utilized Product SKUs
            </h3>
            <Button
              variant="secondary"
              size="sm"
              icon={<ExternalLink size={12} />}
              onClick={() => navigate('/products')}
            >
              Catalog
            </Button>
          </div>

          <div className="bg-surface-card border border-border-default rounded-xl p-4 space-y-3 shadow-card">
            {mostUsedProducts.map((prd) => (
              <div
                key={prd.code}
                className="p-3 bg-background-primary/50 border border-border-default/60 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-accent-primary">
                      {prd.code}
                    </span>
                    <span className="font-bold text-xs text-text-primary">{prd.name}</span>
                  </div>
                  <span className="text-[10px] text-text-muted block">Volume: {prd.volume}</span>
                </div>
                <span className="font-bold text-xs text-status-success shrink-0">{prd.cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors Ranking */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Top Approved Vendor Partners
            </h3>
            <Button
              variant="secondary"
              size="sm"
              icon={<ExternalLink size={12} />}
              onClick={() => navigate('/vendors')}
            >
              Network
            </Button>
          </div>

          <div className="bg-surface-card border border-border-default rounded-xl p-4 space-y-3 shadow-card">
            {topVendors.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-background-primary/50 border border-border-default/60 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-text-primary block">{v.name}</span>
                  <span className="text-[10px] text-text-muted block">Category: {v.category}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-xs text-accent-primary font-mono">
                    {v.rating}
                  </span>
                  <Badge tone="green">{v.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
