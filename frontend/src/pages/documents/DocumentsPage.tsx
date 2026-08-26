import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderArchive,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Download,
  Eye,
  Search,
  Grid,
  List,
  Calendar,
  User,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  FileCheck,
  Receipt,
  File,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDocuments, useDownloadAttachment } from '../../api/services/indents/hooks';
import type { IndentDocumentItem } from '../../api/services/indents/service';
import { apiClient } from '../../api/client';
import { Badge, StatusChip } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ToastViewport, useToasts } from '../../components/ui/toast';

// Helper to format file sizes
function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper to format timestamps
function formatDateTime(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// Helper for file type icons & colors
function getFileTypeConfig(fileType?: string, fileName?: string) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  const type = (fileType || '').toUpperCase();

  if (type === 'PDF' || ext === 'pdf') {
    return {
      icon: FileText,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10 border-rose-500/20',
      badgeTone: 'red' as const,
      label: 'PDF Document',
    };
  }
  if (type === 'EXCEL' || ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return {
      icon: FileSpreadsheet,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badgeTone: 'green' as const,
      label: 'Excel Sheet',
    };
  }
  if (type === 'IMAGE' || ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
    return {
      icon: FileImage,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10 border-purple-500/20',
      badgeTone: 'info' as const,
      label: 'Image',
    };
  }
  if (type === 'CAD' || ext === 'dwg' || ext === 'dxf') {
    return {
      icon: FileCode,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 border-blue-500/20',
      badgeTone: 'blue' as const,
      label: 'CAD Drawing',
    };
  }

  return {
    icon: File,
    color: 'text-text-muted',
    bg: 'bg-surface-elevated/40 border-border-default',
    badgeTone: 'gray' as const,
    label: 'Document',
  };
}

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toasts, show, dismiss } = useToasts();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | 'DESIGN' | 'ACCOUNTS'>('ALL');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GROUPED' | 'TABLE'>('GROUPED');
  const [collapsedIndents, setCollapsedIndents] = useState<Record<string, boolean>>({});

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<IndentDocumentItem | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotate, setPreviewRotate] = useState(0);

  // Queries & Mutations
  const { data: documents = [], isLoading, isError, error, refetch, isRefetching } = useDocuments();
  const { mutateAsync: downloadAttachment } = useDownloadAttachment();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Handle Download Action
  const handleDownload = async (doc: IndentDocumentItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const downloadKey = doc.storageFileName || doc.fileName;
    try {
      setDownloadingId(doc.id);
      await downloadAttachment(downloadKey);
      show('success', `Downloaded "${doc.fileName}" successfully.`);
    } catch (err: any) {
      show('error', err?.message || `Failed to download "${doc.fileName}".`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Preview Action
  const handleOpenPreview = useCallback(
    async (doc: IndentDocumentItem) => {
      setPreviewDoc(doc);
      setPreviewZoom(1);
      setPreviewRotate(0);

      const isPdf =
        doc.fileType === 'PDF' ||
        doc.mimeType === 'application/pdf' ||
        doc.fileName.toLowerCase().endsWith('.pdf');
      const isImage =
        doc.fileType === 'IMAGE' ||
        (doc.mimeType && doc.mimeType.startsWith('image/')) ||
        ['.jpg', '.jpeg', '.png', '.webp', '.svg'].some((ext) =>
          doc.fileName.toLowerCase().endsWith(ext),
        );

      if (isPdf || isImage) {
        setIsLoadingPreview(true);
        try {
          const downloadKey = doc.storageFileName || doc.fileName;
          const response = await apiClient.get(
            `/business-transactions/attachments/download/${encodeURIComponent(downloadKey)}`,
            { responseType: 'blob' },
          );
          const blobType = isPdf ? 'application/pdf' : doc.mimeType || 'image/jpeg';
          const blob = new Blob([response.data], { type: blobType });
          const url = window.URL.createObjectURL(blob);
          setPreviewBlobUrl(url);
        } catch (err: any) {
          show('error', err?.message || 'Failed to load document preview.');
        } finally {
          setIsLoadingPreview(false);
        }
      } else {
        setPreviewBlobUrl(null);
        setIsLoadingPreview(false);
      }
    },
    [show],
  );

  // Cleanup Blob URL when preview closes
  const handleClosePreview = () => {
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewDoc(null);
    setIsLoadingPreview(false);
  };

  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        window.URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  // Toggle Indent Collapse
  const toggleIndentCollapse = (indentId: string) => {
    setCollapsedIndents((prev) => ({
      ...prev,
      [indentId]: !prev[indentId],
    }));
  };

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Department filter
      if (departmentFilter !== 'ALL') {
        const dept = (doc.department || '').toUpperCase();
        if (departmentFilter === 'DESIGN' && !dept.includes('DESIGN') && !dept.includes('DSGN')) {
          return false;
        }
        if (
          departmentFilter === 'ACCOUNTS' &&
          !dept.includes('ACCOUNT') &&
          !dept.includes('ACCT') &&
          !dept.includes('ACC') &&
          !dept.includes('FINANCE')
        ) {
          return false;
        }
      }

      // File type filter
      if (fileTypeFilter !== 'ALL') {
        const type = (doc.fileType || '').toUpperCase();
        const ext = doc.fileName.split('.').pop()?.toUpperCase() || '';
        if (fileTypeFilter === 'PDF' && type !== 'PDF' && ext !== 'PDF') return false;
        if (
          fileTypeFilter === 'EXCEL' &&
          type !== 'EXCEL' &&
          ext !== 'XLSX' &&
          ext !== 'XLS' &&
          ext !== 'CSV'
        )
          return false;
        if (
          fileTypeFilter === 'IMAGE' &&
          type !== 'IMAGE' &&
          !['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext)
        )
          return false;
        if (fileTypeFilter === 'CAD' && type !== 'CAD' && ext !== 'DWG' && ext !== 'DXF')
          return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = doc.fileName.toLowerCase().includes(query);
        const matchesIndent = doc.indent?.indentNumber?.toLowerCase().includes(query);
        const matchesCustomer = doc.indent?.customerName?.toLowerCase().includes(query);
        const matchesProduct = doc.indent?.product?.productName?.toLowerCase().includes(query);
        const matchesRemarks = doc.remarks?.toLowerCase().includes(query);
        const matchesDept = doc.department?.toLowerCase().includes(query);
        if (
          !matchesName &&
          !matchesIndent &&
          !matchesCustomer &&
          !matchesProduct &&
          !matchesRemarks &&
          !matchesDept
        ) {
          return false;
        }
      }

      return true;
    });
  }, [documents, departmentFilter, fileTypeFilter, searchTerm]);

  // Group documents by Indent
  const groupedByIndent = useMemo(() => {
    const map = new Map<
      string,
      {
        indent: IndentDocumentItem['indent'] | null;
        indentId: string;
        docs: IndentDocumentItem[];
      }
    >();

    for (const doc of filteredDocuments) {
      const key = doc.indentId || 'unassigned';
      if (!map.has(key)) {
        map.set(key, {
          indent: doc.indent || null,
          indentId: doc.indentId,
          docs: [],
        });
      }
      map.get(key)!.docs.push(doc);
    }

    return Array.from(map.values());
  }, [filteredDocuments]);

  // Metrics Summary
  const metrics = useMemo(() => {
    let designCount = 0;
    let accountsCount = 0;
    let totalBytes = 0;
    const uniqueIndents = new Set<string>();

    for (const doc of documents) {
      const dept = (doc.department || '').toUpperCase();
      if (
        dept.includes('ACCOUNT') ||
        dept.includes('ACCT') ||
        dept.includes('ACC') ||
        dept.includes('FINANCE')
      ) {
        accountsCount++;
      } else {
        designCount++;
      }
      totalBytes += doc.fileSize || 0;
      if (doc.indentId) uniqueIndents.add(doc.indentId);
    }

    return {
      totalDocs: documents.length,
      designDocs: designCount,
      accountsDocs: accountsCount,
      totalIndents: uniqueIndents.size,
      totalVolume: formatFileSize(totalBytes),
    };
  }, [documents]);

  return (
    <div className="space-y-6 pb-12">
      <ToastViewport toasts={toasts} onDismiss={dismiss} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-card p-6 rounded-2xl border border-border-default shadow-card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0 shadow-sm">
            <FolderArchive size={26} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Enterprise Document Repository
              </h1>
              <Badge tone="blue" size="sm">
                Live Supabase Storage
              </Badge>
            </div>
            <p className="text-sm text-text-muted mt-1 max-w-2xl">
              Centralized visibility, search, and direct downloading of all technical drawings,
              accounts vendor bills, and verification invoices associated with manufacturing
              indents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/indents')}
            className="flex items-center gap-2"
          >
            <Layers size={14} />
            View Indents
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card p-5 rounded-xl border border-border-default shadow-card hover:border-accent-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Documents
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
              <FolderArchive size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">{metrics.totalDocs}</p>
          <p className="text-xs text-text-muted mt-1">
            Across {metrics.totalIndents} active indents
          </p>
        </div>

        <div className="bg-surface-card p-5 rounded-xl border border-border-default shadow-card hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Accounts & Invoices
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Receipt size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">{metrics.accountsDocs}</p>
          <p className="text-xs text-text-muted mt-1">Vendor bills & cost proofs</p>
        </div>

        <div className="bg-surface-card p-5 rounded-xl border border-border-default shadow-card hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Design & CAD Drawings
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FileCode size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">{metrics.designDocs}</p>
          <p className="text-xs text-text-muted mt-1">Technical specifications & blueprints</p>
        </div>

        <div className="bg-surface-card p-5 rounded-xl border border-border-default shadow-card hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Storage Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <FileCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">{metrics.totalVolume}</p>
          <p className="text-xs text-text-muted mt-1">Encrypted on Supabase storage</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-surface-card p-4 rounded-xl border border-border-default shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              type="text"
              placeholder="Search by Indent #, filename, customer, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 w-full bg-background-primary text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Department Tabs & View Mode Toggles */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Department Filter Pills */}
            <div className="inline-flex bg-background-primary p-1 rounded-lg border border-border-default text-xs">
              <button
                onClick={() => setDepartmentFilter('ALL')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  departmentFilter === 'ALL'
                    ? 'bg-surface-card text-text-primary shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                All Departments
              </button>
              <button
                onClick={() => setDepartmentFilter('ACCOUNTS')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  departmentFilter === 'ACCOUNTS'
                    ? 'bg-surface-card text-emerald-500 shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Accounts / Bills
              </button>
              <button
                onClick={() => setDepartmentFilter('DESIGN')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  departmentFilter === 'DESIGN'
                    ? 'bg-surface-card text-blue-500 shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Design Drawings
              </button>
            </div>

            {/* File Type Dropdown */}
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="h-8.5 px-3 py-1 bg-background-primary border border-border-default rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="ALL">All File Types</option>
              <option value="PDF">PDF Documents (.pdf)</option>
              <option value="EXCEL">Excel Spreadsheets (.xlsx, .xls)</option>
              <option value="IMAGE">Images (.jpg, .png)</option>
              <option value="CAD">CAD Drawings (.dwg, .dxf)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="inline-flex bg-background-primary p-1 rounded-lg border border-border-default">
              <button
                onClick={() => setViewMode('GROUPED')}
                title="Group by Indent"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'GROUPED'
                    ? 'bg-surface-card text-accent-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                title="Table View"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'TABLE'
                    ? 'bg-surface-card text-accent-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || departmentFilter !== 'ALL' || fileTypeFilter !== 'ALL') && (
          <div className="flex items-center gap-2 pt-2 border-t border-border-default/50 text-xs text-text-muted">
            <SlidersHorizontal size={13} />
            <span>Active filters:</span>
            {searchTerm && (
              <span className="bg-surface-elevated px-2 py-0.5 rounded text-text-primary">
                Search: "{searchTerm}"
              </span>
            )}
            {departmentFilter !== 'ALL' && (
              <span className="bg-surface-elevated px-2 py-0.5 rounded text-text-primary">
                Dept: {departmentFilter}
              </span>
            )}
            {fileTypeFilter !== 'ALL' && (
              <span className="bg-surface-elevated px-2 py-0.5 rounded text-text-primary">
                Type: {fileTypeFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('ALL');
                setFileTypeFilter('ALL');
              }}
              className="text-accent-primary hover:underline ml-2"
            >
              Reset all filters
            </button>
            <span className="ml-auto font-medium text-text-primary">
              Showing {filteredDocuments.length} of {documents.length} documents
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-surface-card p-6 rounded-xl border border-border-default animate-pulse space-y-4"
            >
              <div className="h-6 bg-surface-elevated rounded w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="h-24 bg-surface-elevated/60 rounded-lg" />
                <div className="h-24 bg-surface-elevated/60 rounded-lg" />
                <div className="h-24 bg-surface-elevated/60 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load documents"
          message={
            (error as Error)?.message || 'An error occurred while fetching uploaded documents.'
          }
          onRetry={() => refetch()}
        />
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          variant={documents.length === 0 ? 'no-data' : 'no-results'}
          title="No documents found"
          description={
            documents.length === 0
              ? 'No documents have been uploaded yet. Technical drawings and accounts vendor invoices uploaded during indent workflow will appear here.'
              : 'No documents match your active search and filter criteria.'
          }
          action={
            documents.length > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setDepartmentFilter('ALL');
                  setFileTypeFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => navigate('/indents')}>
                Go to Indents
              </Button>
            )
          }
        />
      ) : viewMode === 'GROUPED' ? (
        /* GROUPED BY INDENT VIEW */
        <div className="space-y-6">
          {groupedByIndent.map(({ indent, indentId, docs }) => {
            const isCollapsed = collapsedIndents[indentId];
            const indentNumber = indent?.indentNumber || 'Unassigned Indent';
            const customerName = indent?.customerName || 'N/A';
            const productName = indent?.product?.productName;
            const currentState = indent?.currentState || indent?.status;

            return (
              <div
                key={indentId}
                className="bg-surface-card rounded-2xl border border-border-default shadow-card overflow-hidden transition-all"
              >
                {/* Indent Header Bar */}
                <div className="p-5 bg-background-primary/40 border-b border-border-default flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleIndentCollapse(indentId)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors shrink-0 mt-0.5"
                    >
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-bold text-text-primary tracking-tight">
                          {indentNumber}
                        </span>
                        {currentState && <StatusChip status={currentState} size="sm" />}
                        <Badge tone="gray" size="sm">
                          {docs.length} {docs.length === 1 ? 'document' : 'documents'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted mt-1.5">
                        {customerName !== 'N/A' && (
                          <span className="flex items-center gap-1">
                            <span className="text-text-secondary font-medium">Customer:</span>{' '}
                            {customerName}
                          </span>
                        )}
                        {productName && (
                          <span className="flex items-center gap-1">
                            <span className="text-text-secondary font-medium">Product:</span>{' '}
                            {productName}
                          </span>
                        )}
                        {indent?.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(indent.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    {indentId && indentId !== 'unassigned' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/indents/${indentId}`)}
                        className="text-xs h-8 flex items-center gap-1.5"
                      >
                        <span>Open Indent</span>
                        <ArrowRight size={13} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Indent Document Cards Grid */}
                {!isCollapsed && (
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map((doc) => {
                      const cfg = getFileTypeConfig(doc.fileType, doc.fileName);
                      const Icon = cfg.icon;
                      const isAccounts =
                        (doc.department || '').toUpperCase().includes('ACCOUNT') ||
                        (doc.department || '').toUpperCase().includes('ACCT') ||
                        (doc.department || '').toUpperCase().includes('ACC') ||
                        (doc.department || '').toUpperCase().includes('FINANCE');
                      const uploaderName =
                        typeof doc.uploadedBy === 'object' && doc.uploadedBy !== null
                          ? `${doc.uploadedBy.firstName || ''} ${doc.uploadedBy.lastName || ''}`.trim() ||
                            doc.uploadedBy.email
                          : 'System User';

                      return (
                        <div
                          key={doc.id}
                          className="bg-surface-card rounded-xl p-4 border border-border-default/80 hover:border-accent-primary/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Top row: Icon & Department Badge */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color}`}
                              >
                                <Icon size={20} />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Badge tone={isAccounts ? 'green' : 'blue'} size="sm">
                                  {isAccounts ? 'ACCOUNTS' : 'DESIGN'}
                                </Badge>
                                <Badge tone={cfg.badgeTone} size="sm">
                                  {cfg.label}
                                </Badge>
                              </div>
                            </div>

                            {/* File Name & Remarks */}
                            <h4
                              className="text-sm font-semibold text-text-primary line-clamp-2 title-tooltip cursor-pointer hover:text-accent-primary transition-colors mb-1"
                              title={doc.fileName}
                              onClick={() => handleOpenPreview(doc)}
                            >
                              {doc.fileName}
                            </h4>

                            {doc.remarks && (
                              <p className="text-xs text-text-muted italic line-clamp-2 mb-2 bg-background-primary/50 p-1.5 rounded border border-border-default/40">
                                "{doc.remarks}"
                              </p>
                            )}

                            {/* Metadata */}
                            <div className="space-y-1 text-[11px] text-text-muted mt-2 pt-2 border-t border-border-default/40">
                              <div className="flex items-center justify-between">
                                <span>Size:</span>
                                <span className="font-medium text-text-secondary">
                                  {formatFileSize(doc.fileSize)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Uploaded:</span>
                                <span className="text-text-secondary">
                                  {formatDateTime(doc.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>By:</span>
                                <span className="text-text-secondary truncate max-w-[140px]">
                                  {uploaderName}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-default/50">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenPreview(doc)}
                              className="flex-1 text-xs h-8 flex items-center justify-center gap-1.5 hover:bg-accent-primary/10 hover:text-accent-primary hover:border-accent-primary/30"
                            >
                              <Eye size={14} />
                              <span>Preview</span>
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => handleDownload(doc, e)}
                              disabled={downloadingId === doc.id}
                              className="flex-1 text-xs h-8 flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Download
                                size={14}
                                className={downloadingId === doc.id ? 'animate-bounce' : ''}
                              />
                              <span>{downloadingId === doc.id ? 'Saving...' : 'Download'}</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* UNIFIED TABLE VIEW */
        <div className="bg-surface-card rounded-2xl border border-border-default shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background-primary/60 border-b border-border-default text-xs uppercase text-text-muted tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Document Name</th>
                  <th className="py-3 px-4 font-semibold">Indent Number</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Size</th>
                  <th className="py-3 px-4 font-semibold">Uploaded By</th>
                  <th className="py-3 px-4 font-semibold">Upload Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50">
                {filteredDocuments.map((doc) => {
                  const cfg = getFileTypeConfig(doc.fileType, doc.fileName);
                  const Icon = cfg.icon;
                  const isAccounts =
                    (doc.department || '').toUpperCase().includes('ACCOUNT') ||
                    (doc.department || '').toUpperCase().includes('ACCT') ||
                    (doc.department || '').toUpperCase().includes('ACC') ||
                    (doc.department || '').toUpperCase().includes('FINANCE');
                  const uploaderName =
                    typeof doc.uploadedBy === 'object' && doc.uploadedBy !== null
                      ? `${doc.uploadedBy.firstName || ''} ${doc.uploadedBy.lastName || ''}`.trim() ||
                        doc.uploadedBy.email
                      : 'System User';

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-background-primary/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color}`}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <p
                              className="font-semibold text-text-primary hover:text-accent-primary cursor-pointer transition-colors"
                              onClick={() => handleOpenPreview(doc)}
                            >
                              {doc.fileName}
                            </p>
                            {doc.remarks && (
                              <p className="text-xs text-text-muted line-clamp-1 italic">
                                "{doc.remarks}"
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {doc.indent?.indentNumber ? (
                          <div>
                            <button
                              onClick={() => navigate(`/indents/${doc.indentId}`)}
                              className="font-medium text-accent-primary hover:underline text-xs flex items-center gap-1"
                            >
                              <span>{doc.indent.indentNumber}</span>
                              <ExternalLink size={11} />
                            </button>
                            {doc.indent.customerName && (
                              <p className="text-[11px] text-text-muted truncate max-w-[140px]">
                                {doc.indent.customerName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={isAccounts ? 'green' : 'blue'} size="sm">
                          {isAccounts ? 'ACCOUNTS' : 'DESIGN'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={cfg.badgeTone} size="sm">
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-secondary font-medium">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-text-muted shrink-0" />
                          <span className="truncate max-w-[120px]">{uploaderName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-muted whitespace-nowrap">
                        {formatDateTime(doc.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenPreview(doc)}
                            className="h-8 px-2.5 text-xs flex items-center gap-1"
                            title="Preview file"
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline">Preview</span>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => handleDownload(doc, e)}
                            disabled={downloadingId === doc.id}
                            className="h-8 px-2.5 text-xs flex items-center gap-1"
                            title="Download file"
                          >
                            <Download
                              size={14}
                              className={downloadingId === doc.id ? 'animate-bounce' : ''}
                            />
                            <span className="hidden sm:inline">
                              {downloadingId === doc.id ? 'Saving...' : 'Download'}
                            </span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* In-App Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={handleClosePreview}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-5xl bg-surface-card border border-border-strong rounded-2xl shadow-modal flex flex-col max-h-[90vh] overflow-hidden z-10 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border-default bg-background-primary/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-text-primary truncate">
                    {previewDoc.fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span>{formatFileSize(previewDoc.fileSize)}</span>
                    <span>&middot;</span>
                    <span>{previewDoc.department || 'Design'}</span>
                    {previewDoc.indent?.indentNumber && (
                      <>
                        <span>&middot;</span>
                        <span className="text-accent-primary font-medium">
                          {previewDoc.indent.indentNumber}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Zoom / Rotate Controls (for images) */}
                {previewBlobUrl && previewDoc.fileType === 'IMAGE' && (
                  <div className="flex items-center gap-1 bg-background-primary px-2 py-1 rounded-lg border border-border-default mr-2">
                    <button
                      onClick={() => setPreviewZoom((z) => Math.max(0.5, z - 0.25))}
                      className="p-1 text-text-muted hover:text-text-primary rounded"
                      title="Zoom Out"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="text-xs font-mono px-1 text-text-secondary">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setPreviewZoom((z) => Math.min(3, z + 0.25))}
                      className="p-1 text-text-muted hover:text-text-primary rounded"
                      title="Zoom In"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      onClick={() => setPreviewRotate((r) => (r + 90) % 360)}
                      className="p-1 text-text-muted hover:text-text-primary rounded ml-1"
                      title="Rotate"
                    >
                      <RotateCw size={15} />
                    </button>
                  </div>
                )}

                {/* Direct Download Button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownload(previewDoc)}
                  disabled={downloadingId === previewDoc.id}
                  className="flex items-center gap-1.5 text-xs h-8"
                >
                  <Download size={14} />
                  <span>
                    {downloadingId === previewDoc.id ? 'Downloading...' : 'Download File'}
                  </span>
                </Button>

                {/* Close Button */}
                <button
                  onClick={handleClosePreview}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background-secondary rounded-lg transition-colors ml-1"
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 overflow-auto p-6 bg-background-primary/80 flex items-center justify-center min-h-[400px]">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="w-10 h-10 border-4 border-t-accent-primary border-border-default rounded-full animate-spin" />
                  <p className="text-xs text-text-muted font-medium animate-pulse">
                    Retrieving file from Supabase storage...
                  </p>
                </div>
              ) : previewBlobUrl &&
                (previewDoc.fileType === 'PDF' ||
                  previewDoc.mimeType === 'application/pdf' ||
                  previewDoc.fileName.toLowerCase().endsWith('.pdf')) ? (
                /* PDF Viewer Embed */
                <iframe
                  src={previewBlobUrl}
                  title={previewDoc.fileName}
                  className="w-full h-[65vh] rounded-xl border border-border-default bg-white shadow-inner"
                />
              ) : previewBlobUrl &&
                (previewDoc.fileType === 'IMAGE' ||
                  (previewDoc.mimeType && previewDoc.mimeType.startsWith('image/')) ||
                  ['.jpg', '.jpeg', '.png', '.webp', '.svg'].some((ext) =>
                    previewDoc.fileName.toLowerCase().endsWith(ext),
                  )) ? (
                /* Image Viewer */
                <div className="overflow-auto max-h-[65vh] flex items-center justify-center p-4">
                  <img
                    src={previewBlobUrl}
                    alt={previewDoc.fileName}
                    style={{
                      transform: `scale(${previewZoom}) rotate(${previewRotate}deg)`,
                      transition: 'transform 0.2s ease',
                    }}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg border border-border-default"
                  />
                </div>
              ) : (
                /* Excel / CAD / Other File Details Viewer */
                <div className="max-w-md w-full bg-surface-card p-6 rounded-2xl border border-border-default shadow-card text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mx-auto">
                    {previewDoc.fileName.endsWith('.xlsx') ||
                    previewDoc.fileName.endsWith('.xls') ? (
                      <FileSpreadsheet size={32} className="text-emerald-500" />
                    ) : previewDoc.fileName.endsWith('.dwg') ||
                      previewDoc.fileName.endsWith('.dxf') ? (
                      <FileCode size={32} className="text-blue-500" />
                    ) : (
                      <FileText size={32} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">{previewDoc.fileName}</h4>
                    <p className="text-xs text-text-muted mt-1">
                      {previewDoc.fileType || 'Document'} &middot;{' '}
                      {formatFileSize(previewDoc.fileSize)}
                    </p>
                  </div>
                  {previewDoc.remarks && (
                    <div className="bg-background-primary p-3 rounded-lg border border-border-default text-xs text-text-secondary text-left">
                      <span className="font-semibold text-text-primary block mb-1">Remarks:</span>
                      {previewDoc.remarks}
                    </div>
                  )}
                  <p className="text-xs text-text-muted">
                    This file format is optimized for download and direct viewing in specialized
                    software (such as Microsoft Excel or AutoCAD).
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleDownload(previewDoc)}
                    disabled={downloadingId === previewDoc.id}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    <span>Download & Open File</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border-default bg-background-primary/50 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
              <div>
                Uploaded by{' '}
                <span className="text-text-primary font-medium">
                  {typeof previewDoc.uploadedBy === 'object' && previewDoc.uploadedBy !== null
                    ? `${previewDoc.uploadedBy.firstName || ''} ${previewDoc.uploadedBy.lastName || ''}`.trim() ||
                      previewDoc.uploadedBy.email
                    : 'System'}
                </span>{' '}
                on {formatDateTime(previewDoc.createdAt)}
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.indentId && previewDoc.indentId !== 'unassigned' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      handleClosePreview();
                      navigate(`/indents/${previewDoc.indentId}`);
                    }}
                    className="text-xs h-7 flex items-center gap-1"
                  >
                    <span>Go to Indent</span>
                    <ExternalLink size={11} />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClosePreview}
                  className="text-xs h-7"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
