import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResults } from '../analyzers/quality.analyzer';

export function generateMarkdownReport(results: AnalysisResults, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let md = `# Frontend API Inventory\n\n`;
  md += `> Generated on ${new Date().toISOString()}\n\n`;
  md += `## Summary\n`;
  md += `- **Total API Calls**: ${results.endpoints.length}\n`;
  md += `- **Duplicate Hooks**: ${results.duplicateHooks.length}\n`;
  md += `- **Unused Services**: ${results.unusedServices.length}\n`;
  md += `- **Orphan Hooks**: ${results.orphanHooks.length}\n`;
  md += `- **Hardcoded URLs**: ${results.hardcodedUrls.length}\n\n`;

  md += `## API Endpoints\n\n`;
  md += `| Service | Hook | Method | URL | Req DTO | Res DTO | Query Key |\n`;
  md += `|---------|------|--------|-----|---------|---------|-----------|\n`;

  for (const ep of results.endpoints) {
    const serviceStr = `\`${ep.service}\``;
    const hookStr = ep.hook ? `\`${ep.hook}\`` : '-';
    const methodStr = `\`${ep.method}\``;
    const urlStr = `\`${ep.url}\``;
    const reqDtoStr = ep.requestDto ? `\`${ep.requestDto}\`` : '-';
    const resDtoStr = ep.responseDto ? `\`${ep.responseDto}\`` : '-';
    const queryKeyStr = ep.queryKey ? `\`[${ep.queryKey.join(', ')}]\`` : '-';

    md += `| ${serviceStr} | ${hookStr} | ${methodStr} | ${urlStr} | ${reqDtoStr} | ${resDtoStr} | ${queryKeyStr} |\n`;
  }

  if (results.hardcodedUrls.length > 0) {
    md += `\n## ⚠️ Hardcoded URLs (Action Required)\n`;
    for (const ep of results.hardcodedUrls) {
      md += `- ${ep.service}: \`${ep.url}\`\n`;
    }
  }

  if (results.unusedServices.length > 0) {
    md += `\n## ⚠️ Unused Services\n`;
    for (const svc of results.unusedServices) {
      md += `- \`${svc}\`\n`;
    }
  }

  fs.writeFileSync(outputPath, md, 'utf-8');
  console.log(`[Markdown Reporter] Generated Markdown report at ${outputPath}`);
}
