import * as fs from 'fs';
import * as path from 'path';
import { SwaggerReport } from '../types';

export function generateSwaggerReports(report: SwaggerReport, outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. JSON
  fs.writeFileSync(path.join(outputDir, 'swagger-contract.json'), JSON.stringify(report, null, 2));

  // 2. SwaggerComparison.md
  let compMd = `# OpenAPI / Swagger Tri-Way Matrix\n\n`;
  compMd += `> Generated at ${report.generatedAt}\n\n`;
  compMd += `## Summary\n`;
  compMd += `- Total Swagger Endpoints: ${report.summary.totalSwagger}\n`;
  compMd += `- Total Backend AST Endpoints: ${report.summary.totalBackend}\n`;
  compMd += `- Total Frontend Hooks: ${report.summary.totalFrontend}\n`;
  compMd += `- Missing in Swagger: ${report.summary.missingInSwagger}\n`;
  compMd += `- Missing in Backend AST: ${report.summary.missingInBackend}\n`;
  compMd += `- Missing in Frontend: ${report.summary.missingInFrontend}\n`;
  compMd += `- Mismatches: ${report.summary.mismatches}\n\n`;

  compMd += `## Matrix\n`;
  compMd += `| Status | Method | Endpoint | Issues |\n`;
  compMd += `|--------|--------|----------|--------|\n`;
  for (const row of report.matrix) {
    const method = row.swaggerEndpoint?.method || row.backendEndpoint?.method || row.frontendEndpoint?.method;
    const url = row.swaggerEndpoint?.path || row.backendEndpoint?.fullPath || row.frontendEndpoint?.url;
    compMd += `| **${row.result}** | ${method} | \`${url}\` | ${row.issues.join('<br>')} |\n`;
  }
  fs.writeFileSync(path.join(outputDir, 'SwaggerComparison.md'), compMd);

  // 3. OpenApiMismatch.md
  let mismatchMd = `# OpenAPI Discrepancies\n\n`;
  mismatchMd += `This report highlights endpoints where the source code (AST) differs from the generated Swagger Contract.\n\n`;

  const missingSwagger = report.matrix.filter(r => r.result === 'MISSING_IN_SWAGGER');
  if (missingSwagger.length > 0) {
    mismatchMd += `## ❌ Missing in Swagger\n`;
    mismatchMd += `These endpoints exist in the codebase but are hidden from or missing in Swagger.\n`;
    for (const row of missingSwagger) {
      const url = row.backendEndpoint?.fullPath || row.frontendEndpoint?.url;
      mismatchMd += `- \`${url}\`\n`;
    }
    mismatchMd += `\n`;
  }

  const mismatches = report.matrix.filter(r => r.result === 'MISMATCH');
  if (mismatches.length > 0) {
    mismatchMd += `## ⚠️ Contract Mismatches\n`;
    mismatchMd += `These endpoints have schema or metadata conflicts.\n`;
    for (const row of mismatches) {
      mismatchMd += `- \`${row.swaggerEndpoint?.path}\`: ${row.issues.join(', ')}\n`;
    }
  }

  fs.writeFileSync(path.join(outputDir, 'OpenApiMismatch.md'), mismatchMd);
  console.log(`[Swagger Reporter] Generated Swagger reports in ${outputDir}`);
}
