import * as fs from 'fs';
import * as path from 'path';
import { RuntimeReport } from '../types';

export function generateRuntimeReports(report: RuntimeReport, outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. JSON
  fs.writeFileSync(path.join(outputDir, 'runtime-results.json'), JSON.stringify(report, null, 2));

  // 2. Markdown
  let md = `# Runtime Verification Report\n\n`;
  md += `> Executed at ${report.executedAt}\n\n`;
  md += `## Summary\n`;
  md += `- **Total Endpoints Executed**: ${report.totalExecuted}\n`;
  md += `- **Passed Validation**: ${report.totalPassed}\n`;
  md += `- **Failed Validation**: ${report.totalFailed}\n\n`;

  const critical = report.results.filter(r => r.errorCategory === 'CRITICAL');
  const warnings = report.results.filter(r => r.errorCategory === 'WARNING');

  if (critical.length > 0) {
    md += `## 🚨 Critical Failures\n\n`;
    md += `These endpoints failed severe expectations (e.g. returned 500 Internal Server Error, or failed to enforce 401 Unauthorized).\n\n`;
    md += `| Method | Endpoint | Auth | No Auth | Details |\n`;
    md += `|--------|----------|------|---------|---------|\n`;
    for (const r of critical) {
      md += `| **${r.method}** | \`${r.endpoint}\` | ${r.statusWithAuth} | ${r.statusWithoutAuth} | ${r.errorDetails} |\n`;
    }
  }

  if (warnings.length > 0) {
    md += `\n## ⚠️ Warnings\n\n`;
    md += `| Method | Endpoint | Auth | No Auth | Details |\n`;
    md += `|--------|----------|------|---------|---------|\n`;
    for (const r of warnings) {
      md += `| **${r.method}** | \`${r.endpoint}\` | ${r.statusWithAuth} | ${r.statusWithoutAuth} | ${r.errorDetails} |\n`;
    }
  }

  md += `\n## All Executed Endpoints\n\n`;
  md += `| Method | Endpoint | Auth | No Auth | Status |\n`;
  md += `|--------|----------|------|---------|--------|\n`;
  for (const r of report.results) {
    const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
    md += `| **${r.method}** | \`${r.endpoint}\` | ${r.statusWithAuth} | ${r.statusWithoutAuth} | ${statusIcon} |\n`;
  }

  fs.writeFileSync(path.join(outputDir, 'RuntimeVerification.md'), md);
  console.log(`[Runtime Reporter] Generated runtime reports in ${outputDir}`);
}
