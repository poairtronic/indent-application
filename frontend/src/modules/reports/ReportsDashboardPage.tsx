import React from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const ReportsDashboardPage: React.FC = () => {
  const handleExport = (reportName: string) => {
    // In a real application, this would trigger an API call to download a CSV/PDF
    alert(`Exporting ${reportName} report to CSV...`);
  };

  const handlePrint = (_reportName: string) => {
    window.print();
  };

  const reportCategories = [
    {
      title: 'Manufacturing Operations',
      reports: [
        {
          name: 'Daily Production Summary',
          description: 'Overview of all completed and ongoing manufacturing indents.',
        },
        {
          name: 'Process Yield Report',
          description: 'Detailed breakdown of manufacturing processes and output.',
        },
        {
          name: 'Machine Utilization',
          description: 'Time and efficiency tracking for manufacturing equipment.',
        },
      ],
    },
    {
      title: 'Cost & Financial Analytics',
      reports: [
        {
          name: 'Actual vs. Predicted Costs',
          description: 'Financial variance report across all completed cost sheets.',
        },
        {
          name: 'Material Cost Breakdown',
          description: 'Total expenditure separated by material categories.',
        },
        {
          name: 'Department Budget Utilization',
          description: 'Financial tracking grouped by originating department.',
        },
      ],
    },
    {
      title: 'Master Data & Workflow',
      reports: [
        {
          name: 'Vendor Performance Matrix',
          description: 'Evaluation of vendor delivery times and material quality.',
        },
        {
          name: 'Product Catalog Export',
          description: 'Complete export of all configured master products.',
        },
        {
          name: 'Workflow Bottleneck Analysis',
          description: 'Average time spent in each stage of the ERP workflow.',
        },
      ],
    },
  ];

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
                  className="p-3 bg-background-secondary rounded-lg border border-border-default group hover:border-accent-primary transition-colors"
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
                      onClick={() => handlePrint(report.name)}
                      className="px-2 py-1"
                    >
                      Print
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Download size={14} />}
                      onClick={() => handleExport(report.name)}
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
