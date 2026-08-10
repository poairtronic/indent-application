import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

export const ReportsDashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const userDept = user?.department?.departmentCode;
  const isAdmin = user?.permissions.includes('settings.manage');
  const isManager = userDept === 'SMGR' || userDept === 'GMGR';
  const navigate = useNavigate();

  const handleExport = (reportName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`Exporting ${reportName} report to CSV...`);
  };

  const handlePrint = (_reportName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  const handleCardClick = (category: string, id: string) => {
    navigate(`/reports/${category}/${id}`);
  };

  const reportCategories = React.useMemo(() => {
    const categories = [];

    // Manufacturing Operations Category (Production only)
    if (isAdmin || isManager || userDept === 'PROD') {
      categories.push({
        title: 'Manufacturing Operations',
        reports: [
          {
            id: 'daily-production',
            category: 'production',
            name: 'Daily Production Summary',
            description: 'Overview of all completed and ongoing manufacturing indents.',
          },
          {
            id: 'process-yield',
            category: 'production',
            name: 'Process Yield Report',
            description: 'Detailed breakdown of manufacturing processes and output.',
          },
          {
            id: 'machine-utilization',
            category: 'production',
            name: 'Machine Utilization',
            description: 'Time and efficiency tracking for manufacturing equipment.',
          },
        ],
      });
    }

    // Cost & Financial Analytics Category (Accounts only)
    if (isAdmin || isManager || userDept === 'ACCT') {
      categories.push({
        title: 'Cost & Financial Analytics',
        reports: [
          {
            id: 'actual-vs-predicted',
            category: 'cost',
            name: 'Actual vs. Predicted Costs',
            description: 'Financial variance report across all completed cost sheets.',
          },
          {
            id: 'material-breakdown',
            category: 'cost',
            name: 'Material Cost Breakdown',
            description: 'Total expenditure separated by material categories.',
          },
          {
            id: 'department-budget',
            category: 'cost',
            name: 'Department Budget Utilization',
            description: 'Financial tracking grouped by originating department.',
          },
        ],
      });
    }

    // Master Data & Workflow (Design / Stores / Accounts / Admin / Manager)
    const masterReports = [];

    // Vendor Performance is visible to Stores, Accounts, Admin, Manager
    if (isAdmin || isManager || userDept === 'STOR' || userDept === 'ACCT') {
      masterReports.push({
        id: 'vendor-performance',
        category: 'master-data',
        name: 'Vendor Performance Matrix',
        description: 'Evaluation of vendor delivery times and material quality.',
      });
    }

    // Product Catalog Export is visible to Design, Stores, Admin, Manager
    if (isAdmin || isManager || userDept === 'DSGN' || userDept === 'STOR') {
      masterReports.push({
        id: 'products',
        category: 'master-data',
        name: 'Product Catalog Export',
        description: 'Complete export of all configured master products.',
      });
    }

    // Workflow Bottleneck Analysis is visible to Design, Admin, Manager, Stores
    if (isAdmin || isManager || userDept === 'DSGN' || userDept === 'STOR') {
      masterReports.push({
        id: 'workflow-bottleneck',
        category: 'workflow',
        name: 'Workflow Bottleneck Analysis',
        description: 'Average time spent in each stage of the ERP workflow.',
      });
    }

    if (masterReports.length > 0) {
      categories.push({
        title: 'Master Data & Workflow',
        reports: masterReports,
      });
    }

    return categories;
  }, [isAdmin, isManager, userDept]);

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Enterprise Document Reporting</h2>
        <p className="text-text-secondary text-sm">
          Generate, export, and print comprehensive business intelligence reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((category) => (
          <div
            key={category.title}
            className="bg-surface-card border border-border-default rounded-xl p-5 shadow-card flex flex-col"
          >
            <h3 className="text-md font-bold text-text-primary mb-4 pb-2 border-b border-border-default">
              {category.title}
            </h3>

            <div className="flex-1 space-y-4">
              {category.reports.map((report) => (
                <div
                  key={report.name}
                  onClick={() => handleCardClick(report.category, report.id)}
                  className="p-3 bg-background-secondary rounded-lg border border-border-default group hover:border-accent-primary transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-accent-primary" />
                      <h4 className="text-sm font-semibold text-text-primary">{report.name}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Printer size={14} />}
                      onClick={(e) => handlePrint(report.name, e)}
                      className="px-2 py-1"
                    >
                      Print
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Download size={14} />}
                      onClick={(e) => handleExport(report.name, e)}
                      className="px-2 py-1"
                    >
                      CSV
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
