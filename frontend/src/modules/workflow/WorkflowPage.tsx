import React, { useMemo, useState } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  Search,
  ArrowRight,
  Eye,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { useWorkflowAnalytics } from '../../api/services/analytics/hooks';
import { useIndents } from '../../api/services/indents/hooks';
import type { WorkflowState } from '../../constants/workflow';
import {
  WORKFLOW_STAGES,
  MANUFACTURING_LOOP_STATES,
  FINANCIAL_LOOP_STATES,
  formatWorkflowState,
  getWorkflowStateTone,
} from '../../constants/workflow';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';

export const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<WorkflowState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Workflow Analytics
  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
  } = useWorkflowAnalytics();

  // Fetch Indents List filtered by selected stage or search
  const indentsQuery = useMemo(
    () => ({
      page: 1,
      limit: 50,
      state: selectedStage || undefined,
      search: searchTerm.trim() || undefined,
    }),
    [selectedStage, searchTerm],
  );

  const {
    data: indentsData,
    isLoading: isIndentsLoading,
    refetch: refetchIndents,
  } = useIndents(indentsQuery);

  const activeIndents = indentsData?.items ?? [];

  // Map stage distribution to quick count lookup
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    analytics?.stageDistribution.forEach((dist) => {
      // Find matching workflow state key by checking label
      const stateKey = Object.keys(WORKFLOW_STAGES).find(
        (key) => WORKFLOW_STAGES[key as WorkflowState].label === dist.stageName,
      );
      if (stateKey) {
        counts[stateKey] = dist.count;
      } else {
        counts[dist.stageName] = dist.count;
      }
    });
    return counts;
  }, [analytics]);

  const handleRefresh = () => {
    refetchAnalytics();
    refetchIndents();
  };

  const handleStageSelect = (stage: WorkflowState) => {
    if (selectedStage === stage) {
      setSelectedStage(null); // Deselect
    } else {
      setSelectedStage(stage);
    }
  };

  if (isAnalyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-surface-card animate-pulse rounded-lg" />
            <div className="h-4 w-96 bg-surface-card animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} className="h-28" />
          ))}
        </div>
        <CardSkeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary">
              <GitBranch size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Business Workflows</h1>
              <p className="text-sm text-text-secondary mt-1">
                Monitor stages, identify active bottlenecks, and track cycle throughput in the
                Zero-Approval workflow.
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh Metrics
        </Button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">Completion Rate</p>
            <p className="text-2xl font-bold text-text-primary">
              {analytics?.completionRate ?? 0}%
            </p>
          </div>
          <div className="p-3 bg-status-success/10 text-status-success rounded-lg">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">Avg. Cycle Time</p>
            <p className="text-2xl font-bold text-text-primary">
              {analytics?.averageCycleDays !== undefined && analytics?.averageCycleDays !== null
                ? `${analytics.averageCycleDays} days`
                : 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-accent-primary/10 text-accent-primary rounded-lg">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">Active Bottleneck</p>
            <p className="text-lg font-bold text-text-primary truncate max-w-[180px]">
              {analytics?.bottleneckStage || 'None'}
            </p>
          </div>
          <div className="p-3 bg-status-error/10 text-status-error rounded-lg">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="bg-surface-card rounded-xl p-4 border border-border-default shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">Stalled (&gt;7 Days)</p>
            <p className="text-2xl font-bold text-text-primary">
              {analytics?.stalledTransactions ?? 0}
            </p>
          </div>
          <div className="p-3 bg-status-warning/10 text-status-warning rounded-lg">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* State Machine Flow Visualizer */}
      <div className="space-y-6">
        {/* Loop 1: Manufacturing */}
        <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border-default pb-3">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
              Loop 1: Manufacturing Workflow (Product Delivery)
            </h3>
            <Badge tone="blue">Loop Boundary: Customer Delivered</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
            {MANUFACTURING_LOOP_STATES.map((state, idx) => {
              const def = WORKFLOW_STAGES[state];
              const count = stageCounts[state] ?? 0;
              const isSelected = selectedStage === state;
              const tone = getWorkflowStateTone(state);

              return (
                <div
                  key={state}
                  onClick={() => handleStageSelect(state)}
                  className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none group ${
                    isSelected
                      ? 'bg-background-secondary border-accent-primary ring-2 ring-accent-primary/20 shadow-lg scale-[1.02]'
                      : 'bg-background-primary/40 border-border-default hover:border-border-default hover:bg-background-primary/80 hover:scale-[1.01]'
                  }`}
                >
                  {/* Sequence Badge */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-text-muted px-1.5 py-0.5 bg-background-primary rounded">
                      #{idx + 1}
                    </span>
                    <Badge tone={tone} className="text-[9px] px-1 py-0 shadow-sm">
                      {def.owningDepartmentCode}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1 my-1">
                    <p className="text-xs font-bold text-text-primary truncate">{def.label}</p>
                    <p className="text-[10px] text-text-muted line-clamp-2 leading-snug">
                      {def.description}
                    </p>
                  </div>

                  {/* Active Count */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-border-default/30">
                    <span className="text-[10px] text-text-muted">Active Indents</span>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        count > 0
                          ? 'bg-accent-primary/10 text-accent-primary'
                          : 'bg-background-primary text-text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </div>

                  {/* Connecting Arrow */}
                  {idx < MANUFACTURING_LOOP_STATES.length - 1 && (
                    <div className="hidden lg:block absolute -right-2.5 top-[40%] translate-y-[-50%] z-10 text-text-muted/60 pointer-events-none group-hover:text-text-primary transition-colors">
                      <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Loop 2: Financial */}
        <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border-default pb-3">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
              Loop 2: Financial & Archival Workflow (Closure)
            </h3>
            <Badge tone="green">Terminal State: Completed</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            {FINANCIAL_LOOP_STATES.map((state, idx) => {
              const def = WORKFLOW_STAGES[state];
              const count = stageCounts[state] ?? 0;
              const isSelected = selectedStage === state;
              const tone = getWorkflowStateTone(state);

              return (
                <div
                  key={state}
                  onClick={() => handleStageSelect(state)}
                  className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none group ${
                    isSelected
                      ? 'bg-background-secondary border-accent-primary ring-2 ring-accent-primary/20 shadow-lg scale-[1.02]'
                      : 'bg-background-primary/40 border-border-default hover:border-border-default hover:bg-background-primary/80 hover:scale-[1.01]'
                  }`}
                >
                  {/* Sequence Badge */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-text-muted px-1.5 py-0.5 bg-background-primary rounded">
                      #{idx + 8}
                    </span>
                    <Badge tone={tone} className="text-[9px] px-1 py-0 shadow-sm">
                      {def.owningDepartmentCode}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1 my-1">
                    <p className="text-xs font-bold text-text-primary truncate">{def.label}</p>
                    <p className="text-[10px] text-text-muted line-clamp-2 leading-snug">
                      {def.description}
                    </p>
                  </div>

                  {/* Active Count */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-border-default/30">
                    <span className="text-[10px] text-text-muted">Active Indents</span>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        count > 0
                          ? 'bg-status-success/10 text-status-success'
                          : 'bg-background-primary text-text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </div>

                  {/* Connecting Arrow */}
                  {idx < FINANCIAL_LOOP_STATES.length - 1 && (
                    <div className="hidden lg:block absolute -right-2.5 top-[40%] translate-y-[-50%] z-10 text-text-muted/60 pointer-events-none group-hover:text-text-primary transition-colors">
                      <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Indents Listing Table */}
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              Active Workflow Indents{' '}
              {selectedStage ? `(${formatWorkflowState(selectedStage)})` : ''}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Showing active transactions progressing through the workflow. Click any stage above to
              filter the list.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search indent code..."
                className="pl-9 h-9 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedStage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStage(null)}
                className="h-9 whitespace-nowrap text-xs"
              >
                Clear Stage Filter
              </Button>
            )}
          </div>
        </div>

        {isIndentsLoading ? (
          <div className="space-y-2 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-background-primary/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : activeIndents.length === 0 ? (
          <div className="text-center py-12 bg-background-primary/10 border border-dashed border-border-default/50 rounded-xl">
            <p className="text-sm font-semibold text-text-primary">No Indents Found</p>
            <p className="text-xs text-text-muted mt-1">
              {selectedStage
                ? `No transactions currently reside in the "${formatWorkflowState(selectedStage)}" state.`
                : 'No active workflow indents match your search filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-default text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Indent Number</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Workflow State</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeIndents.map((indent) => {
                  const state = indent.currentState as WorkflowState;
                  return (
                    <tr
                      key={indent.id}
                      className="border-b border-border-default/50 hover:bg-background-primary/50 text-sm transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-text-primary">
                        {indent.indentNumber}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {indent.productName || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone="gray" className="text-[10px]">
                          {indent.departmentName || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={getWorkflowStateTone(state)}>
                          {formatWorkflowState(state)}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted text-xs">
                        {new Date(indent.updatedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/indents/${indent.id}`)}
                          className="inline-flex items-center gap-1.5 text-xs h-8"
                        >
                          <Eye size={12} /> View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
