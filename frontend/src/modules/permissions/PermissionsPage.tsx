import React, { useState, useMemo } from 'react';
import { Shield, Search, Lock, Layers, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { usePermissionModules, usePermissions } from '../../api/services/permissions/hooks';

export const PermissionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const { data: modules = [], isLoading: modulesLoading } = usePermissionModules();
  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    error,
  } = usePermissions(selectedModule === 'ALL' ? undefined : selectedModule);

  const moduleOptions = useMemo(() => ['ALL', ...modules], [modules]);

  const filteredPermissions = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return permissions;
    return permissions.filter(
      (p) =>
        p.code.toLowerCase().includes(term) ||
        p.module.toLowerCase().includes(term) ||
        p.action.toLowerCase().includes(term),
    );
  }, [permissions, search]);

  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, typeof permissions> = {};
    for (const perm of filteredPermissions) {
      if (!grouped[perm.module]) grouped[perm.module] = [];
      grouped[perm.module].push(perm);
    }
    return Object.entries(grouped).map(([module, perms]) => ({
      module,
      permissions: perms,
    }));
  }, [filteredPermissions]);

  if (modulesLoading || permissionsLoading) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Permission Hierarchy & Matrix
          </h1>
          <p className="text-xs text-text-muted">
            Read-only system permission tokens, category hierarchy, and authority mapping
          </p>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center">
          <div className="animate-spin mx-auto w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full" />
          <p className="text-xs text-text-muted mt-3">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Permission Hierarchy & Matrix
          </h1>
          <p className="text-xs text-text-muted">
            Read-only system permission tokens, category hierarchy, and authority mapping
          </p>
        </div>
        <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center space-y-2">
          <AlertCircle size={24} className="mx-auto text-red-500" />
          <p className="text-xs font-bold text-text-primary">Failed to load permissions</p>
          <p className="text-xs text-text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">
          Permission Hierarchy & Matrix
        </h1>
        <p className="text-xs text-text-muted">
          Read-only system permission tokens, category hierarchy, and authority mapping
        </p>
      </div>

      {/* Controls Header: Search & Module Tabs */}
      <div className="bg-surface-card border border-border-default rounded-xl p-4 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search size={16} />
            </div>
            <Input
              id="permSearch"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions tokens (e.g., users.create, indent.view)..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <Shield size={16} className="text-accent-primary" />
            <span>Total System Tokens:</span>
            <span className="text-text-primary font-bold bg-background-secondary px-2 py-0.5 rounded border border-border-default">
              {permissions.length} Tokens
            </span>
          </div>
        </div>

        {/* Module Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-border-default/40 pt-3">
          {moduleOptions.map((mod) => (
            <button
              key={mod}
              onClick={() => setSelectedModule(mod)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                selectedModule === mod
                  ? 'bg-accent-primary text-white shadow-sm'
                  : 'bg-background-primary/60 text-text-muted hover:text-text-primary hover:bg-background-secondary'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Permission Modules Grid */}
      <div className="space-y-6">
        {groupedPermissions.length === 0 ? (
          <div className="bg-surface-card border border-border-default rounded-xl p-8 text-center space-y-2">
            <Layers size={24} className="mx-auto text-text-muted/50" />
            <p className="text-xs font-bold text-text-primary">No permissions matched your query</p>
            <p className="text-xs text-text-muted">Try modifying your search or module filter.</p>
          </div>
        ) : (
          groupedPermissions.map((group) => (
            <div
              key={group.module}
              className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4 shadow-card"
            >
              <div className="flex items-center justify-between border-b border-border-default/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-accent-primary/10 text-accent-primary">
                    <Shield size={16} />
                  </div>
                  <h3 className="font-bold text-sm text-text-primary capitalize">
                    {group.module} Module Permissions
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-text-muted bg-background-secondary px-2 py-0.5 rounded border border-border-default">
                  {group.permissions.length} Tokens
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="p-3 bg-background-primary/50 border border-border-default/60 rounded-xl space-y-1.5 hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-accent-primary">
                      <Lock size={12} />
                      <span className="font-mono font-bold text-xs text-text-primary truncate">
                        {perm.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted">
                      {perm.description ?? `${perm.action} on ${perm.module}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
